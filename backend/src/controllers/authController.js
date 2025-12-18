const authService = require('../services/authService');
const { User, Department } = require('../models');

const register = async (req, res, next) => {
  try {
    const { fullName, email, password, roleName } = req.body;
    const { user, token, refreshToken, role } = await authService.register({
      fullName,
      email,
      password,
      roleName,
    });
    
    // Reload user with department
    const userWithDept = await User.findByPk(user.id, {
      include: [{ model: Department, attributes: ['id', 'name'] }],
    });
    
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role,
        department: userWithDept?.Department?.name,
        departmentId: userWithDept?.departmentId,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token, refreshToken, role } = await authService.login(email, password);
    
    // Reload user with department
    const userWithDept = await User.findByPk(user.id, {
      include: [{ model: Department, attributes: ['id', 'name'] }],
    });
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role,
        department: userWithDept?.Department?.name,
        departmentId: userWithDept?.departmentId,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const { token, refreshToken: newRefreshToken, user, role } = await authService.refresh(refreshToken);
    
    // Reload user with department
    const userWithDept = await User.findByPk(user.id, {
      include: [{ model: Department, attributes: ['id', 'name'] }],
    });
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role,
        department: userWithDept?.Department?.name,
        departmentId: userWithDept?.departmentId,
      },
      token,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refresh };

