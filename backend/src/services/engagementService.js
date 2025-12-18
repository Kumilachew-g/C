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

  // Admin and Secretariat can update the status of any engagement,
  // but can only cancel with an explicit administrative reason.
  if (user.role === ROLES.ADMIN || user.role === ROLES.SECRETARIAT) {
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
    }
  }
  // Commissioners can only update status for engagements assigned to them,
  // and only from 'scheduled' → 'completed' or 'cancelled'
  else if (user.role === ROLES.COMMISSIONER) {
    if (engagement.commissionerId !== user.id) {
      const error = new Error('You can only update engagements assigned to you');
      error.status = 403;
      throw error;
    }
    if (engagement.status !== 'scheduled') {
      const error = new Error('You can only change the status of scheduled engagements');
      error.status = 403;
      throw error;
    }
    if (!['completed', 'cancelled'].includes(status)) {
      const error = new Error('Commissioners can only mark engagements as completed or cancelled.');
      error.status = 400;
      throw error;
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

