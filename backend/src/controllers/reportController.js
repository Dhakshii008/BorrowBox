import { Report, Item } from '../models/index.js';
import { catchAsync, AppError } from '../utils/asyncHandler.js';

export const createReport = catchAsync(async (req, res, next) => {
  const { targetType, targetId, reason } = req.body;

  if (!targetType || !targetId || !reason) {
    return next(new AppError('Target and reason are required.', 400));
  }

  if (!['item', 'user'].includes(targetType)) {
    return next(new AppError('Invalid report target.', 400));
  }

  if (targetType === 'user') {
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(targetId);
    if (!user) return next(new AppError('Target user not found.', 404));
  } else {
    const item = await Item.findById(targetId);
    if (!item) return next(new AppError('Target item not found.', 404));
  }

  const report = await Report.create({
    reporterId: req.user._id,
    targetType,
    targetId,
    reason,
  });

  return res.status(201).json({
    success: true,
    message: 'Issue reported. The team will review it shortly.',
    report,
  });
});