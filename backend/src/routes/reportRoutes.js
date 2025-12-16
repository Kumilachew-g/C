const express = require('express');
const { query } = require('express-validator');
const authenticateToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const validate = require('../middleware/validate');
const {
  getEngagementCountByCommissioner,
  getMonthlyEngagementSummary,
  getAuditLogs,
} = require('../controllers/reportController');
const { ROLES } = require('../utils/roles');

const router = express.Router();

router.use(authenticateToken, authorizeRoles(ROLES.ADMIN, ROLES.AUDITOR));

router.get('/engagements/by-commissioner', getEngagementCountByCommissioner);

router.get(
  '/engagements/monthly',
  validate([query('year').optional().isInt({ min: 1970, max: 2100 }).withMessage('invalid year')]),
  getMonthlyEngagementSummary
);

router.get(
  '/audit-logs',
  validate([
    query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('limit 1-500'),
    query('userId').optional().isUUID().withMessage('userId must be UUID'),
  ]),
  getAuditLogs
);

module.exports = router;

