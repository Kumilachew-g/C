const express = require('express');
const { body, param } = require('express-validator');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const auditLogger = require('../middleware/auditLogger');
const { createEngagement, listEngagements, updateStatus, updateEngagement, getEngagement } = require('../controllers/engagementController');
const { ROLES } = require('../utils/roles');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(auth);

router
  .route('/')
  .get(listEngagements)
  .post(
    // Only Admin, Secretariat, and Department Users can create engagements
    // Commissioners cannot create engagements - they only view and manage assigned ones
    authorizeRoles(ROLES.ADMIN, ROLES.SECRETARIAT, ROLES.DEPARTMENT_USER),
    validate([
      body('referenceNo').isString().isLength({ min: 3 }).withMessage('referenceNo required'),
      body('purpose').isString().isLength({ min: 5 }).withMessage('purpose required'),
      body('date').isISO8601().withMessage('date required'),
      body('time').isString().withMessage('time required'),
      body('commissionerId').isUUID().withMessage('commissionerId required'),
      body('requestingUnitId').optional().isUUID().withMessage('requestingUnitId must be UUID'),
    ]),
    auditLogger('CREATE_ENGAGEMENT', 'Engagement'),
    createEngagement
  );

router.get(
  '/:id',
  getEngagement
);

router.patch(
  '/:id/status',
  authorizeRoles(ROLES.ADMIN, ROLES.COMMISSIONER, ROLES.SECRETARIAT),
  validate([
    param('id').isUUID().withMessage('id must be UUID'),
    body('status')
      .isIn(['draft', 'scheduled', 'completed', 'cancelled'])
      .withMessage('invalid status'),
    body('adminReason')
      .optional()
      .isString()
      .isLength({ min: 10 })
      .withMessage('adminReason must be at least 10 characters when provided'),
  ]),
  auditLogger('UPDATE_ENGAGEMENT_STATUS', 'Engagement'),
  updateStatus
);

router.patch(
  '/:id',
  authorizeRoles(ROLES.ADMIN, ROLES.COMMISSIONER, ROLES.SECRETARIAT, ROLES.DEPARTMENT_USER),
  validate([
    param('id').isUUID().withMessage('id must be UUID'),
    body('referenceNo').optional().isString().isLength({ min: 3 }),
    body('purpose').optional().isString().isLength({ min: 5 }),
    body('description').optional().isString(),
    body('date').optional().isISO8601(),
    body('time').optional().isString(),
    body('commissionerId').optional().isUUID(),
    body('requestingUnitId').optional().isUUID(),
  ]),
  auditLogger('UPDATE_ENGAGEMENT', 'Engagement'),
  updateEngagement
);

module.exports = router;

