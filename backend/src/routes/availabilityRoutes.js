const express = require('express');
const { body, param, query } = require('express-validator');
const authenticateToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const validate = require('../middleware/validate');
const { createSlot, listSlots, updateSlot, deleteSlot } = require('../controllers/availabilityController');
const { ROLES } = require('../utils/roles');

const router = express.Router();

router.use(authenticateToken);

router.get(
  '/',
  authorizeRoles(ROLES.ADMIN, ROLES.COMMISSIONER, ROLES.SECRETARIAT),
  validate([query('commissionerId').optional().isUUID().withMessage('commissionerId must be UUID')]),
  listSlots
);

router.post(
  '/',
  authorizeRoles(ROLES.ADMIN, ROLES.COMMISSIONER, ROLES.SECRETARIAT),
  validate([
    body('commissionerId').isUUID().withMessage('commissionerId required'),
    body('startTime').isISO8601().withMessage('startTime must be ISO8601'),
    body('endTime').isISO8601().withMessage('endTime must be ISO8601'),
  ]),
  createSlot
);

router.patch(
  '/:id',
  authorizeRoles(ROLES.ADMIN, ROLES.COMMISSIONER, ROLES.SECRETARIAT),
  validate([
    param('id').isUUID().withMessage('id must be UUID'),
    body('startTime').optional().isISO8601().withMessage('startTime must be ISO8601'),
    body('endTime').optional().isISO8601().withMessage('endTime must be ISO8601'),
  ]),
  updateSlot
);

router.delete(
  '/:id',
  authorizeRoles(ROLES.ADMIN, ROLES.COMMISSIONER, ROLES.SECRETARIAT),
  validate([param('id').isUUID().withMessage('id must be UUID')]),
  deleteSlot
);

module.exports = router;

