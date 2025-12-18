const { Notification, User, Engagement } = require('../models');
const logger = require('../utils/logger');

// Notification types
const NOTIFICATION_TYPES = {
  ENGAGEMENT_CREATED: 'engagement_created',
  ENGAGEMENT_ASSIGNED: 'engagement_assigned',
  ENGAGEMENT_STATUS_CHANGED: 'engagement_status_changed',
  ENGAGEMENT_UPDATED: 'engagement_updated',
  ENGAGEMENT_CANCELLED: 'engagement_cancelled',
};

/**
 * Create a notification for a user
 */
const createNotification = async (userId, message, type = null, metadata = {}) => {
  try {
    const notification = await Notification.create({
      userId,
      message,
      type,
      metadata: JSON.stringify(metadata),
    });
    logger.info(`Notification created for user ${userId}: ${message}`);
    return notification;
  } catch (error) {
    logger.error(`Failed to create notification for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Notify commissioner when engagement is assigned to them
 */
const notifyEngagementAssigned = async (engagement, commissionerId) => {
  const message = `New engagement assigned: ${engagement.referenceNo || 'Engagement'} - ${engagement.purpose}`;
  return createNotification(
    commissionerId,
    message,
    NOTIFICATION_TYPES.ENGAGEMENT_ASSIGNED,
    { engagementId: engagement.id, referenceNo: engagement.referenceNo }
  );
};

/**
 * Notify commissioner when engagement status changes
 */
const notifyEngagementStatusChanged = async (engagement, oldStatus, newStatus, userId) => {
  const statusMessages = {
    scheduled: 'has been scheduled',
    completed: 'has been completed',
    cancelled: 'has been cancelled',
    draft: 'has been set to draft',
  };

  const message = `Engagement ${engagement.referenceNo || 'Engagement'} ${statusMessages[newStatus] || `status changed to ${newStatus}`}`;
  
  // Notify the commissioner
  if (engagement.commissionerId && engagement.commissionerId !== userId) {
    await createNotification(
      engagement.commissionerId,
      message,
      NOTIFICATION_TYPES.ENGAGEMENT_STATUS_CHANGED,
      { engagementId: engagement.id, referenceNo: engagement.referenceNo, oldStatus, newStatus }
    );
  }

  // Notify the creator if different from commissioner and status changer
  if (engagement.createdBy && engagement.createdBy !== userId && engagement.createdBy !== engagement.commissionerId) {
    await createNotification(
      engagement.createdBy,
      message,
      NOTIFICATION_TYPES.ENGAGEMENT_STATUS_CHANGED,
      { engagementId: engagement.id, referenceNo: engagement.referenceNo, oldStatus, newStatus }
    );
  }
};

/**
 * Notify when engagement is created
 */
const notifyEngagementCreated = async (engagement, createdByUserId) => {
  // Notify the assigned commissioner
  if (engagement.commissionerId && engagement.commissionerId !== createdByUserId) {
    const message = `New engagement request: ${engagement.referenceNo || 'Engagement'} - ${engagement.purpose}`;
    await createNotification(
      engagement.commissionerId,
      message,
      NOTIFICATION_TYPES.ENGAGEMENT_CREATED,
      { engagementId: engagement.id, referenceNo: engagement.referenceNo }
    );
  }
};

/**
 * Notify when engagement is updated
 */
const notifyEngagementUpdated = async (engagement, updatedByUserId) => {
  const message = `Engagement ${engagement.referenceNo || 'Engagement'} has been updated`;
  
  // Notify the commissioner
  if (engagement.commissionerId && engagement.commissionerId !== updatedByUserId) {
    await createNotification(
      engagement.commissionerId,
      message,
      NOTIFICATION_TYPES.ENGAGEMENT_UPDATED,
      { engagementId: engagement.id, referenceNo: engagement.referenceNo }
    );
  }

  // Notify the creator if different
  if (engagement.createdBy && engagement.createdBy !== updatedByUserId && engagement.createdBy !== engagement.commissionerId) {
    await createNotification(
      engagement.createdBy,
      message,
      NOTIFICATION_TYPES.ENGAGEMENT_UPDATED,
      { engagementId: engagement.id, referenceNo: engagement.referenceNo }
    );
  }
};

/**
 * Get unread count for a user
 */
const getUnreadCount = async (userId) => {
  try {
    const count = await Notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
    return count;
  } catch (error) {
    logger.error(`Failed to get unread count for user ${userId}:`, error);
    return 0;
  }
};

module.exports = {
  createNotification,
  notifyEngagementAssigned,
  notifyEngagementStatusChanged,
  notifyEngagementCreated,
  notifyEngagementUpdated,
  getUnreadCount,
  NOTIFICATION_TYPES,
};

