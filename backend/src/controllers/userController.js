const { User, Role, CommissionerProfile } = require('../models');
const { ROLES } = require('../utils/roles');
const authService = require('../services/authService');

const listUsers = async (_req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'fullName', 'email', 'departmentId', 'status', 'lastLoginAt', 'createdAt'],
      include: [{ model: Role, attributes: ['name'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(
      users.map((user) => ({
        ...user.toJSON(),
        role: user.Role?.name,
      }))
    );
  } catch (error) {
    next(error);
  }
};

const listCommissioners = async (_req, res, next) => {
  try {
    const commissionerRole = await Role.findOne({ where: { name: ROLES.COMMISSIONER } });
    if (!commissionerRole) {
      return res.json([]);
    }

    const commissioners = await User.findAll({
      where: { roleId: commissionerRole.id, status: 'active' },
      attributes: ['id', 'fullName', 'email'],
      include: [
        {
          model: CommissionerProfile,
          attributes: ['title', 'office'],
          required: false,
        },
      ],
      order: [['fullName', 'ASC']],
    });

    res.json(
      commissioners.map((c) => ({
        id: c.id,
        fullName: c.fullName,
        email: c.email,
        title: c.CommissionerProfile?.title || '',
        office: c.CommissionerProfile?.office || '',
      }))
    );
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    user.status = status;
    await user.save();
    res.locals.entityId = user.id;
    res.json({ id: user.id, status: user.status });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const result = await authService.resetPassword(id, password);
    res.locals.entityId = result.id;
    res.json({ id: result.id, message: 'Password reset successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { listUsers, listCommissioners, updateStatus, resetPassword };

