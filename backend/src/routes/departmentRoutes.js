const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const validate = require('../middleware/validate');
const { listDepartments, createDepartment } = require('../controllers/departmentController');
const { ROLES } = require('../utils/roles');

const router = express.Router();

router.use(auth);
// Only admin can create departments, but all authenticated can list
router.get('/', listDepartments);
router.post(
  '/',
  authorizeRoles(ROLES.ADMIN),
  validate([body('name').isString().isLength({ min: 2 }).withMessage('Department name required')]),
  createDepartment
);

module.exports = router;

