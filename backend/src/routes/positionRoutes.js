const express = require('express');
const { body, param, query } = require('express-validator');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const validate = require('../middleware/validate');
const {
  listPositions,
  createPosition,
  updatePosition,
  deletePosition,
} = require('../controllers/positionController');
const { ROLES } = require('../utils/roles');

const router = express.Router();

router.use(auth);

// Only admin can manage positions
router.get(
  '/',
  authorizeRoles(ROLES.ADMIN),
  validate([
    query('departmentId').optional().isUUID().withMessage('departmentId must be UUID'),
  ]),
  listPositions
);

router.post(
  '/',
  authorizeRoles(ROLES.ADMIN),
  validate([
    body('name').isString().isLength({ min: 2 }).withMessage('Position name required'),
    body('departmentId').isUUID().withMessage('departmentId must be UUID'),
  ]),
  createPosition
);

router.put(
  '/:id',
  authorizeRoles(ROLES.ADMIN),
  validate([
    param('id').isUUID().withMessage('Invalid position id'),
    body('name').isString().isLength({ min: 2 }).withMessage('Position name required'),
    body('departmentId').optional().isUUID().withMessage('departmentId must be UUID'),
  ]),
  updatePosition
);

router.delete(
  '/:id',
  authorizeRoles(ROLES.ADMIN),
  validate([param('id').isUUID().withMessage('Invalid position id')]),
  deletePosition
);

module.exports = router;


