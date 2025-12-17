const { Engagement } = require('../models');
const availabilityService = require('./availabilityService');
const { ROLES } = require('../utils/roles');

const createEngagement = async (payload, userId) => {
  const engagement = await Engagement.create({
    ...payload,
    createdBy: userId,
  });
  return engagement;
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

  const engagements = await Engagement.findAll({ where, order: [['createdAt', 'DESC']] });
  return engagements;
};

const updateEngagementStatus = async (id, status, user) => {
  const engagement = await Engagement.findByPk(id);
  if (!engagement) {
    const error = new Error('Engagement not found');
    error.status = 404;
    throw error;
  }

  // Admin and Secretariat can update any engagement
  if (user.role === ROLES.ADMIN || user.role === ROLES.SECRETARIAT) {
    // Allowed
  }
  // Commissioners can only update engagements assigned to them
  else if (user.role === ROLES.COMMISSIONER) {
    if (engagement.commissionerId !== user.id) {
      const error = new Error('You can only update engagements assigned to you');
      error.status = 403;
      throw error;
    }
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

  engagement.status = status;
  await engagement.save();
  return engagement;
};

module.exports = {
  createEngagement,
  listEngagements,
  updateEngagementStatus,
};

