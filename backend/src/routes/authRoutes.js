const express = require('express');
const { body } = require('express-validator');
const { register, login, refresh } = require('../controllers/authController');
const validate = require('../middleware/validate');
const authenticateToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const { ROLES } = require('../utils/roles');

const router = express.Router();

router.post(
  '/register',
  authenticateToken,
  authorizeRoles(ROLES.ADMIN),
  validate([
    body('fullName').isString().isLength({ min: 2 }).withMessage('fullName required'),
    body('email').isEmail().withMessage('valid email required'),
    body('password').isLength({ min: 8 }).withMessage('password min length 8'),
    body('roleName').optional().isString(),
    body('department').optional().isString(),
  ]),
  register
);

router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('valid email required'),
    body('password').isLength({ min: 8 }).withMessage('password min length 8'),
  ]),
  login
);

router.post(
  '/refresh',
  validate([body('refreshToken').isString().withMessage('refreshToken required')]),
  refresh
);

module.exports = router;

