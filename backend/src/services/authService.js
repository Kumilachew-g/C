const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');
const logger = require('../utils/logger');
const { ROLES } = require('../utils/roles');

const SALT_ROUNDS = 10;

const generateToken = (user, roleName) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: roleName,
      fullName: user.fullName,
    },
    process.env.JWT_SECRET || 'change_me',
    { expiresIn: '8h' }
  );

const generateRefreshToken = (user, roleName) =>
  jwt.sign(
    {
      id: user.id,
      role: roleName,
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'change_me_refresh',
    { expiresIn: '7d' }
  );

const ensureRoleExists = async (roleName) => {
  const [role] = await Role.findOrCreate({
    where: { name: roleName },
    defaults: { description: `${roleName} role` },
  });
  return role;
};

const register = async ({ fullName, email, password, roleName }) => {
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    const error = new Error('User already exists');
    error.status = 400;
    throw error;
  }

  const role = await ensureRoleExists(roleName || ROLES.DEPARTMENT_USER);
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    fullName,
    email,
    password: hashed,
    roleId: role.id,
  });

  const token = generateToken(user, role.name);
  const refreshToken = generateRefreshToken(user, role.name);
  logger.info('User registered: %s', email);
  return { user, token, refreshToken, role: role.name };
};

const login = async (email, password) => {
  const user = await User.findOne({ where: { email }, include: [Role] });
  if (!user) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  const token = generateToken(user, user.Role.name);
  const refreshToken = generateRefreshToken(user, user.Role.name);
  user.lastLoginAt = new Date();
  await user.save();

  return { user, token, refreshToken, role: user.Role.name };
};

const refresh = async (refreshToken) => {
  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'change_me_refresh'
    );
    const user = await User.findByPk(payload.id, { include: [Role] });
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }
    if (user.status === 'disabled') {
      const error = new Error('User disabled');
      error.status = 403;
      throw error;
    }
    const accessToken = generateToken(user, user.Role.name);
    const newRefreshToken = generateRefreshToken(user, user.Role.name);
    return { token: accessToken, refreshToken: newRefreshToken, role: user.Role.name, user };
  } catch (err) {
    const error = new Error('Invalid refresh token');
    error.status = 401;
    throw error;
  }
};

module.exports = { register, login, ensureRoleExists, refresh };

