const express = require('express');
const { body, param } = require('express-validator');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const validate = require('../middleware/validate');
const {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');
const { ROLES } = require('../utils/roles');

const router = express.Router();

router.use(auth);
// Only admin can create/update/delete departments, but all authenticated can list
router.get('/', listDepartments);

router.post(
  '/',
  authorizeRoles(ROLES.ADMIN),
  validate([body('name').isString().isLength({ min: 2 }).withMessage('Department name required')]),
  createDepartment
);

router.put(
  '/:id',
  authorizeRoles(ROLES.ADMIN),
  validate([
    param('id').isUUID().withMessage('Invalid department id'),
    body('name').isString().isLength({ min: 2 }).withMessage('Department name required'),
  ]),
  updateDepartment
);

router.delete(
  '/:id',
  authorizeRoles(ROLES.ADMIN),
  validate([param('id').isUUID().withMessage('Invalid department id')]),
  deleteDepartment
);

module.exports = router;

