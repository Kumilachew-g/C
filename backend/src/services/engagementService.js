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
  const isPrivileged =
    user.role === ROLES.ADMIN ||
    user.role === ROLES.COMMISSIONER ||
    user.role === ROLES.SECRETARIAT;

  const where = isPrivileged ? {} : { createdBy: user.id };
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

  if (
    engagement.createdBy !== user.id &&
    !(
      user.role === ROLES.ADMIN ||
      user.role === ROLES.COMMISSIONER ||
      user.role === ROLES.SECRETARIAT
    )
  ) {
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

