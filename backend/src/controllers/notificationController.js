import { Notification } from '../models/index.js';
import { catchAsync } from '../utils/asyncHandler.js';

export const getNotifications = catchAsync(async (req, res) => {
  const { limit = 30 } = req.query;
  const notifications = await Notification.find({ userId: req.user._id })
    .sort('-createdAt')
    .limit(Math.min(Number(limit) || 30, 100));

  const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });

  return res.json({ success: true, notifications, unreadCount });
});

export const markRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });

  if (notification.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not your notification.' });
  }

  notification.read = true;
  await notification.save();

  const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });
  return res.json({ success: true, notification, unreadCount });
});

export const markAllRead = catchAsync(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
  return res.json({ success: true, message: 'All notifications marked as read.', unreadCount: 0 });
});