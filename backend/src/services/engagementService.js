const { Engagement, Department } = require('../models');
const availabilityService = require('./availabilityService');
const notificationService = require('./notificationService');
const { ROLES } = require('../utils/roles');

// Helper function to format engagement with department information
const formatEngagementWithDepartment = async (engagement) => {
  if (!engagement) return null;
  
  // Reload with department if not already included
  if (!engagement.RequestingUnit && engagement.requestingUnitId) {
    const engagementWithDept = await Engagement.findByPk(engagement.id, {
      include: [
        {
          model: Department,
          as: 'RequestingUnit',
          attributes: ['id', 'name'],
          required: false,
        },
      ],
    });
    if (engagementWithDept) {
      engagement = engagementWithDept;
    }
  }
  
  const engagementData = engagement.toJSON ? engagement.toJSON() : engagement;
  return {
    ...engagementData,
    requestingUnit: engagementData.RequestingUnit ? {
      id: engagementData.RequestingUnit.id,
      name: engagementData.RequestingUnit.name,
    } : null,
  };
};

const createEngagement = async (payload, userId) => {
  const engagement = await Engagement.create({
    ...payload,
    createdBy: userId,
  });
  // Reload with department information
  const engagementWithDept = await Engagement.findByPk(engagement.id, {
    include: [
      {
        model: Department,
        as: 'RequestingUnit',
        attributes: ['id', 'name'],
        required: false,
      },
    ],
  });
  
  const formattedEngagement = await formatEngagementWithDepartment(engagementWithDept || engagement);
  
  // Send notification to assigned commissioner
  if (engagement.commissionerId && engagement.commissionerId !== userId) {
    try {
      await notificationService.notifyEngagementCreated(formattedEngagement, userId);
    } catch (error) {
      // Don't fail engagement creation if notification fails
      console.error('Failed to send notification:', error);
    }
  }
  
  return formattedEngagement;
};

const listEngagements = async (user) => {
  let where = {};

  if (user.role === ROLES.ADMIN || user.role === ROLES.SECRETARIAT) {
    // Admin and Secretariat can see all engagements
    where = {};
  } else if (user.role === ROLES.COMMISSIONER) {
    // Commissioners see only engagements assigned to them
    where = { commissionerId: user.id };
  } else {
    // Department users see only engagements they created
    where = { createdBy: user.id };
  }

  const engagements = await Engagement.findAll({
    where,
    include: [
      {
        model: Department,
        as: 'RequestingUnit',
        attributes: ['id', 'name'],
        required: false,
      },
    ],
    order: [['createdAt', 'DESC']],
  });
  
  // Format the response to include department name
  return engagements.map((engagement) => {
    const engagementData = engagement.toJSON();
    return {
      ...engagementData,
      requestingUnit: engagementData.RequestingUnit ? {
        id: engagementData.RequestingUnit.id,
        name: engagementData.RequestingUnit.name,
      } : null,
    };
  });
};

const updateEngagementStatus = async (id, status, user, adminReason) => {
  const engagement = await Engagement.findByPk(id, {
    include: [
      {
        model: Department,
        as: 'RequestingUnit',
        attributes: ['id', 'name'],
        required: false,
      },
    ],
  });
  if (!engagement) {
    const error = new Error('Engagement not found');
    error.status = 404;
    throw error;
  }

  // If there is no actual status change, just return the formatted engagement
  if (status === engagement.status) {
    return await formatEngagementWithDepartment(engagement);
  }

  // Admin and Secretariat:
  // - Can schedule DRAFT engagements
  // - Can administratively cancel DRAFT or SCHEDULED engagements (with reason)
  // - Cannot mark engagements as APPROVED or COMPLETED (that is reserved for commissioners)
  // - Cannot change status of COMPLETED engagements
  // - Cannot move engagements back to DRAFT once they have been scheduled
  if (user.role === ROLES.ADMIN || user.role === ROLES.SECRETARIAT) {
    // Never allow any changes once completed
    if (engagement.status === 'completed') {
      const error = new Error('Completed engagements cannot be modified.');
      error.status = 400;
      throw error;
    }

    if (status === 'cancelled') {
      if (!adminReason || adminReason.trim().length < 10) {
        const error = new Error(
          'Administrative cancellation requires a reason of at least 10 characters.'
        );
        error.status = 400;
        return Promise.reject(error);
      }
      if (engagement.status === 'completed') {
        const error = new Error('Completed engagements cannot be cancelled by administrators.');
        error.status = 400;
        return Promise.reject(error);
      }
    } else if (status === 'scheduled') {
      if (engagement.status !== 'draft') {
        const error = new Error(
          'Only draft engagements can be moved to scheduled by administrators or secretariat.'
        );
        error.status = 400;
        throw error;
      }
    } else if (status === 'approved' || status === 'completed') {
      const error = new Error('Only commissioners can approve or complete engagements.');
      error.status = 400;
      throw error;
    } else if (status === 'draft' && engagement.status !== 'draft') {
      const error = new Error('Engagements cannot be reverted back to draft once scheduled.');
      error.status = 400;
      throw error;
    }
  }
  // Commissioners can only update status for engagements assigned to them,
  // and only through this flow:
  // - scheduled → approved or cancelled
  // - approved  → completed or cancelled
  else if (user.role === ROLES.COMMISSIONER) {
    if (engagement.commissionerId !== user.id) {
      const error = new Error('You can only update engagements assigned to you');
      error.status = 403;
      throw error;
    }
    // From scheduled: can only approve or cancel (not complete directly)
    if (engagement.status === 'scheduled') {
      if (!['approved', 'cancelled'].includes(status)) {
        const error = new Error('From scheduled, commissioners can only approve or cancel.');
        error.status = 400;
        throw error;
      }
    }
    // From approved: can only complete or cancel
    else if (engagement.status === 'approved') {
      if (!['completed', 'cancelled'].includes(status)) {
        const error = new Error('From approved, commissioners can only complete or cancel.');
        error.status = 400;
        throw error;
      }

      // Only allow completion after the scheduled time has passed
      if (status === 'completed') {
        const engagementDateTime = new Date(`${engagement.date}T${engagement.time}`);
        const now = new Date();
        if (engagementDateTime > now) {
          const error = new Error(
            'You can only mark this engagement as completed after the scheduled time.'
          );
          error.status = 400;
          throw error;
        }
      }
    } else {
      const error = new Error('You can only change the status of scheduled or approved engagements');
      error.status = 403;
      throw error;
    }
  }
  // Department users can update the status of engagements they created:
  // - From DRAFT → SCHEDULED (submitting the request)
  // - From DRAFT/SCHEDULED → CANCELLED (self-cancellation)
  // They cannot mark engagements as COMPLETED and cannot touch engagements they did not create.
  else if (user.role === ROLES.DEPARTMENT_USER) {
    if (engagement.createdBy !== user.id) {
      const error = new Error('You can only update engagements you created.');
      error.status = 403;
      throw error;
    }

    // Completed or cancelled engagements are final for department users
    if (engagement.status === 'completed' || engagement.status === 'cancelled') {
      const error = new Error('You cannot modify completed or cancelled engagements.');
      error.status = 400;
      throw error;
    }

    if (status === 'completed') {
      const error = new Error('Only commissioners can mark engagements as completed.');
      error.status = 400;
      throw error;
    }

    // From draft, they may go to scheduled or cancelled (never approved/completed)
    if (engagement.status === 'draft') {
      if (!['draft', 'scheduled', 'cancelled'].includes(status)) {
        const error = new Error(
          'Draft engagements created by you can only be scheduled or cancelled.'
        );
        error.status = 400;
        throw error;
      }
    }

    // From scheduled, they may only cancel (cannot revert to draft or approve/complete)
    if (engagement.status === 'scheduled') {
      if (status !== 'cancelled' && status !== 'scheduled') {
        const error = new Error('You can only cancel scheduled engagements you created.');
        error.status = 400;
        throw error;
      }
    }

    // Special rule: when a department user cancels their own engagement,
    // we soft-delete it (paranoid delete) so it no longer appears in listings,
    // while still being available in the database for audit purposes.
    if (status === 'cancelled') {
      const oldStatus = engagement.status;
      const formattedEngagement = await formatEngagementWithDepartment(engagement);
      await engagement.destroy(); // paranoid: true on model => soft delete

      try {
        await notificationService.notifyEngagementStatusChanged(
          formattedEngagement,
          oldStatus,
          'cancelled',
          user.id
        );
      } catch (error) {
        // Don't fail cancellation if notification fails
        console.error('Failed to send notification:', error);
      }

      return formattedEngagement;
    }
  } else {
    const error = new Error('Forbidden');
    error.status = 403;
    throw error;
  }

  if (status === 'scheduled') {
    const engagementDateTime = new Date(`${engagement.date}T${engagement.time}`);
    const isAvailable = await availabilityService.isCommissionerAvailable(
      engagement.commissionerId,
      engagementDateTime
    );
    if (!isAvailable) {
      const error = new Error('Commissioner not available for the selected time');
      error.status = 400;
      throw error;
    }
  }

  const oldStatus = engagement.status;
  engagement.status = status;
  await engagement.save();
  
  const formattedEngagement = await formatEngagementWithDepartment(engagement);
  
  // Send notification if status changed
  if (oldStatus !== status) {
    try {
      await notificationService.notifyEngagementStatusChanged(
        formattedEngagement,
        oldStatus,
        status,
        user.id
      );
    } catch (error) {
      // Don't fail status update if notification fails
      console.error('Failed to send notification:', error);
    }
  }
  
  return formattedEngagement;
};

const updateEngagement = async (id, payload, user) => {
  const engagement = await Engagement.findByPk(id, {
    include: [
      {
        model: Department,
        as: 'RequestingUnit',
        attributes: ['id', 'name'],
        required: false,
      },
    ],
  });
  if (!engagement) {
    const error = new Error('Engagement not found');
    error.status = 404;
    throw error;
  }

  // Admin and Secretariat can update any engagement
  if (user.role === ROLES.ADMIN || user.role === ROLES.SECRETARIAT) {
    // Allowed
  }
  // Commissioners can only update engagements assigned to them (limited fields)
  else if (user.role === ROLES.COMMISSIONER) {
    if (engagement.commissionerId !== user.id) {
      const error = new Error('You can only update engagements assigned to you');
      error.status = 403;
      throw error;
    }
    // Commissioners can only update date/time for rescheduling
    const allowedFields = ['date', 'time'];
    Object.keys(payload).forEach((key) => {
      if (!allowedFields.includes(key)) {
        delete payload[key];
      }
    });
  }
  // Department users can only update engagements they created (if still draft)
  else if (engagement.createdBy === user.id) {
    if (engagement.status !== 'draft') {
      const error = new Error('You can only modify draft engagements');
      error.status = 403;
      throw error;
    }
  } else {
    const error = new Error('Forbidden');
    error.status = 403;
    throw error;
  }

  // Check availability if date/time is being changed
  const newDate = payload.date || engagement.date;
  const newTime = payload.time || engagement.time;
  if (payload.date || payload.time) {
    const engagementDateTime = new Date(`${newDate}T${newTime}`);
    const isAvailable = await availabilityService.isCommissionerAvailable(
      payload.commissionerId || engagement.commissionerId,
      engagementDateTime
    );
    if (!isAvailable) {
      const error = new Error('Commissioner not available for the selected time');
      error.status = 400;
      throw error;
    }
  }

  Object.assign(engagement, payload);
  await engagement.save();
  
  const formattedEngagement = await formatEngagementWithDepartment(engagement);
  
  // Send notification if engagement was updated
  try {
    await notificationService.notifyEngagementUpdated(formattedEngagement, user.id);
  } catch (error) {
    // Don't fail update if notification fails
    console.error('Failed to send notification:', error);
  }
  
  return formattedEngagement;
};

const getEngagement = async (id, user) => {
  const engagement = await Engagement.findByPk(id, {
    include: [
      {
        model: Department,
        as: 'RequestingUnit',
        attributes: ['id', 'name'],
        required: false,
      },
    ],
  });
  if (!engagement) {
    const error = new Error('Engagement not found');
    error.status = 404;
    throw error;
  }

  // Check access permissions
  if (user.role === ROLES.ADMIN || user.role === ROLES.SECRETARIAT) {
    // Allowed
  } else if (user.role === ROLES.COMMISSIONER) {
    if (engagement.commissionerId !== user.id) {
      const error = new Error('Forbidden');
      error.status = 403;
      throw error;
    }
  } else if (engagement.createdBy !== user.id) {
    const error = new Error('Forbidden');
    error.status = 403;
    throw error;
  }

  return await formatEngagementWithDepartment(engagement);
};

module.exports = {
  createEngagement,
  listEngagements,
  updateEngagementStatus,
  updateEngagement,
  getEngagement,
};

