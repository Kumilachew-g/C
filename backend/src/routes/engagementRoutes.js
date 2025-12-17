const express = require('express');
const { body, param } = require('express-validator');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const auditLogger = require('../middleware/auditLogger');
const { createEngagement, listEngagements, updateStatus } = require('../controllers/engagementController');
const { ROLES } = require('../utils/roles');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(auth);

router
  .route('/')
  .get(listEngagements)
  .post(
    authorizeRoles(ROLES.ADMIN, ROLES.SECRETARIAT, ROLES.DEPARTMENT_USER),
    validate([
      body('referenceNo').isString().isLength({ min: 3 }).withMessage('referenceNo required'),
      body('purpose').isString().isLength({ min: 5 }).withMessage('purpose required'),
      body('date').isISO8601().withMessage('date required'),
      body('time').isString().withMessage('time required'),
      body('commissionerId').isUUID().withMessage('commissionerId required'),
    ]),
    auditLogger('CREATE_ENGAGEMENT', 'Engagement'),
    createEngagement
  );

router.patch(
  '/:id/status',
  authorizeRoles(ROLES.ADMIN, ROLES.COMMISSIONER, ROLES.SECRETARIAT),
  validate([
    param('id').isUUID().withMessage('id must be UUID'),
    body('status')
      .isIn(['draft', 'scheduled', 'completed', 'cancelled'])
      .withMessage('invalid status'),
  ]),
  auditLogger('UPDATE_ENGAGEMENT_STATUS', 'Engagement'),
  updateStatus
);

module.exports = router;

