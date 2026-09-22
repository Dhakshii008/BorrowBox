let emitter = null;

export const registerNotifier = (fn) => {
  emitter = fn;
};

export const createNotification = async ({ userId, type, title, message, relatedId = null }) => {
  const Notification = (await import('../models/Notification.js')).default;

  if (!userId) return null;

  const notification = await Notification.create({
    userId,
    type,
    title,
    message,
    relatedId: relatedId || null,
  });

  if (emitter) {
    await emitter(userId, 'notification', {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      relatedId: notification.relatedId,
      createdAt: notification.createdAt,
    });
  }

  return notification;
};