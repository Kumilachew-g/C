const authService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const { fullName, email, password, roleName } = req.body;
    const { user, token, refreshToken, role } = await authService.register({
      fullName,
      email,
      password,
      roleName,
    });
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role,
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
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role,
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
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role,
      },
      token,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refresh };

