const express = require('express');
const { body, param } = require('express-validator');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const auditLogger = require('../middleware/auditLogger');
const { listUsers, listCommissioners, updateStatus } = require('../controllers/userController');
const { ROLES } = require('../utils/roles');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(auth);

router.get('/', authorizeRoles(ROLES.ADMIN, ROLES.COMMISSIONER, ROLES.AUDITOR), listUsers);
router.get('/commissioners', listCommissioners);

router.patch(
  '/:id/status',
  authorizeRoles(ROLES.ADMIN),
  validate([
    param('id').isUUID().withMessage('id must be UUID'),
    body('status').isIn(['active', 'disabled']).withMessage('invalid status'),
  ]),
  auditLogger('UPDATE_USER_STATUS', 'User'),
  updateStatus
);

module.exports = router;

