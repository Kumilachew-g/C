const { Notification } = require('../models');

const listNotifications = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const notifications = await Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    res.json(
      notifications.map((n) => ({
        id: n.id,
        userId: n.userId,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt,
      }))
    );
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await Notification.update({ isRead: true }, { where: { userId, isRead: false } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listNotifications,
  markAllAsRead,
};


