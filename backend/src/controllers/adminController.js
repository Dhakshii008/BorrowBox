import { User, Item, BorrowRequest, Transaction, Report, Notification } from '../models/index.js';
import { catchAsync, AppError } from '../utils/asyncHandler.js';
import { computeTrustScore } from '../services/trustService.js';
import { createNotification } from '../services/notificationService.js';

export const adminStats = catchAsync(async (req, res) => {
  const [
    totalUsers,
    totalItems,
    activeBorrowings,
    completedTransactions,
    pendingRequests,
    reportedIssues,
    openReports,
  ] = await Promise.all([
    User.countDocuments(),
    Item.countDocuments(),
    Transaction.countDocuments({ status: { $in: ['BORROWED', 'RETURN_REQUESTED'] } }),
    Transaction.countDocuments({ status: 'RETURNED' }),
    BorrowRequest.countDocuments({ status: 'PENDING' }),
    Report.countDocuments(),
    Report.countDocuments({ status: 'OPEN' }),
  ]);

  const recentUsers = await User.find().sort('-createdAt').limit(5);
  const recentTransactions = await Transaction.find()
    .sort('-createdAt')
    .limit(5)
    .populate('itemId', 'name')
    .populate('borrowerId', 'name');

  return res.json({
    success: true,
    stats: {
      totalUsers,
      totalItems,
      activeBorrowings,
      completedTransactions,
      pendingRequests,
      reportedIssues,
      openReports,
    },
    recentUsers: recentUsers.map((u) => u.toPublicJSON()),
    recentTransactions,
  });
});

export const adminUsers = catchAsync(async (req, res) => {
  const { search, role } = req.query;
  const query = {};
  if (role) query.role = role;
  if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

  const users = await User.find(query).sort('-createdAt');
  return res.json({ success: true, users: users.map((u) => u.toPublicJSON()) });
});

export const adminItems = catchAsync(async (req, res) => {
  const { status } = req.query;
  const query = {};
  if (status && status !== 'all') query.status = status;

  const items = await Item.find(query)
    .sort('-createdAt')
    .populate('ownerId', 'name email');

  return res.json({ success: true, items });
});

export const adminTransactions = catchAsync(async (req, res) => {
  const transactions = await Transaction.find()
    .sort('-createdAt')
    .populate('itemId', 'name images')
    .populate('ownerId', 'name email')
    .populate('borrowerId', 'name email');

  return res.json({ success: true, transactions });
});

export const adminReports = catchAsync(async (req, res) => {
  const { status } = req.query;
  const query = {};
  if (status && status !== 'all') query.status = status;

  const reports = await Report.find(query)
    .sort('-createdAt')
    .populate('reporterId', 'name email');

  return res.json({ success: true, reports });
});

export const adminDeleteItem = catchAsync(async (req, res, next) => {
  const item = await Item.findById(req.params.id);
  if (!item) return next(new AppError('Item not found.', 404));

  const activeTransaction = await Transaction.findOne({
    itemId: item._id,
    status: { $in: ['BORROWED', 'RETURN_REQUESTED'] },
  });
  if (activeTransaction) {
    return next(new AppError('This item is currently borrowed and cannot be removed.', 400));
  }

  await BorrowRequest.updateMany({ itemId: item._id, status: 'PENDING' }, { status: 'DECLINED' });
  const ownerId = item.ownerId;
  const itemName = item.name;
  await item.deleteOne();

  await createNotification({
    userId: ownerId,
    type: 'system',
    title: 'Item removed',
    message: `Your item "${itemName}" was removed by a moderator.`,
  });

  return res.json({ success: true, message: 'Item removed by admin.' });
});

export const adminDeleteUser = catchAsync(async (req, res, next) => {
  if (req.user._id.toString() === req.params.id) {
    return next(new AppError('You cannot delete your own account.', 400));
  }

  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found.', 404));

  await Item.updateMany({ ownerId: user._id }, { availability: false, status: 'UNAVAILABLE' });
  await user.deleteOne();

  return res.json({ success: true, message: 'User deactivated.' });
});

export const adminResolveReport = catchAsync(async (req, res, next) => {
  const report = await Report.findById(req.params.id);
  if (!report) return next(new AppError('Report not found.', 404));

  report.status = 'RESOLVED';
  report.resolvedAt = new Date();
  await report.save();

  await createNotification({
    userId: report.reporterId,
    type: 'report_resolved',
    title: 'Report resolved',
    message: 'Your reported issue has been reviewed and resolved by the moderators.',
    relatedId: report._id,
  });

  return res.json({ success: true, message: 'Report resolved.', report });
});