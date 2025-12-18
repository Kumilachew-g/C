const { Notification } = require('../models');
const notificationService = require('../services/notificationService');

const listNotifications = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { limit = 50, offset = 0 } = req.query;

    const notifications = await Notification.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      notifications: notifications.rows.map((n) => ({
        id: n.id,
        userId: n.userId,
        message: n.message,
        type: n.type,
        metadata: n.metadata,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      total: notifications.count,
      unreadCount: await notificationService.getUnreadCount(userId),
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const notification = await Notification.findOne({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.update({ isRead: true });
    res.json({ message: 'Notification marked as read' });
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
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const count = await notificationService.getUnreadCount(userId);
    res.json({ unreadCount: count });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};


