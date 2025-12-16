const reportService = require('../services/reportService');

const getEngagementCountByCommissioner = async (_req, res, next) => {
  try {
    const data = await reportService.engagementCountByCommissioner();
    res.json({ data, exportedAt: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};

const getMonthlyEngagementSummary = async (req, res, next) => {
  try {
    const year = req.query.year ? Number(req.query.year) : undefined;
    const data = await reportService.monthlyEngagementSummary(year);
    res.json({ data, exportedAt: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const { limit, userId } = req.query;
    const data = await reportService.auditLogs({ limit, userId });
    res.json({ data, exportedAt: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEngagementCountByCommissioner,
  getMonthlyEngagementSummary,
  getAuditLogs,
};

