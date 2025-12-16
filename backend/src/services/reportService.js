const { Op, fn, col, literal } = require('sequelize');
const { Engagement, User, AuditLog } = require('../models');
const { ROLES } = require('../utils/roles');

const engagementCountByCommissioner = async () => {
  const rows = await Engagement.findAll({
    attributes: [
      [col('Engagement.commissionerId'), 'commissionerId'],
      [fn('COUNT', col('Engagement.id')), 'engagementCount'],
    ],
    include: [
      {
        model: User,
        as: 'Commissioner',
        attributes: ['fullName', 'email'],
      },
    ],
    group: [col('Engagement.commissionerId'), col('Commissioner.id')],
    order: [[literal('engagementCount'), 'DESC']],
  });

  return rows.map((row) => ({
    commissionerId: row.commissionerId,
    commissionerName: row.Commissioner?.fullName || 'Unknown',
    commissionerEmail: row.Commissioner?.email || '',
    engagementCount: Number(row.get('engagementCount') || 0),
  }));
};

const monthlyEngagementSummary = async (year) => {
  const where = year
    ? {
        date: {
          [Op.between]: [`${year}-01-01`, `${year}-12-31`],
        },
      }
    : {};

  const rows = await Engagement.findAll({
    attributes: [
      [fn('DATE_FORMAT', col('date'), '%Y-%m'), 'month'],
      [fn('COUNT', col('id')), 'count'],
    ],
    where,
    group: [fn('DATE_FORMAT', col('date'), '%Y-%m')],
    order: [[literal('month'), 'ASC']],
  });

  return rows.map((row) => ({
    month: row.get('month'),
    count: Number(row.get('count') || 0),
  }));
};

const auditLogs = async ({ limit = 100, userId }) => {
  const where = {};
  if (userId) where.userId = userId;

  const logs = await AuditLog.findAll({
    where,
    include: [{ model: User, attributes: ['fullName', 'email'] }],
    order: [['createdAt', 'DESC']],
    limit: Math.min(Number(limit) || 100, 500),
  });

  return logs.map((log) => ({
    id: log.id,
    userId: log.userId,
    userName: log.User?.fullName || '',
    userEmail: log.User?.email || '',
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    metadata: log.metadata,
    timestamp: log.createdAt,
  }));
};

module.exports = {
  engagementCountByCommissioner,
  monthlyEngagementSummary,
  auditLogs,
};

