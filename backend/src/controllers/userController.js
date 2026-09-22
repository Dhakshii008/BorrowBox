import { User, Item, Transaction, BorrowRequest, Review } from '../models/index.js';
import { catchAsync, AppError } from '../utils/asyncHandler.js';
import { computeTrustScore } from '../services/trustService.js';

export const getReputation = catchAsync(async (req, res, next) => {
  const userId = req.params.userId;

  const user = await User.findById(userId);
  if (!user) return next(new AppError('User not found.', 404));

  const [reputation, reviews, itemsCount] = await Promise.all([
    computeTrustScore(userId),
    Review.find({ reviewedUserId: userId })
      .sort('-createdAt')
      .populate('reviewerId', 'name profileImage')
      .populate({
        path: 'transactionId',
        populate: { path: 'itemId', select: 'name images' },
      }),
    Item.countDocuments({ ownerId: userId }),
  ]);

  return res.json({
    success: true,
    user: user.toPublicJSON(),
    reputation,
    itemsCount,
    reviews,
  });
});

export const getPublicProfile = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return next(new AppError('User not found.', 404));

  const [reputation, itemCount] = await Promise.all([
    computeTrustScore(id),
    Item.countDocuments({ ownerId: id }),
  ]);

  return res.json({
    success: true,
    user: { ...user.toPublicJSON() },
    reputation,
    itemCount,
  });
});