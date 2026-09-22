import { Review, Transaction, User } from '../models/index.js';
import { catchAsync, AppError } from '../utils/asyncHandler.js';
import { refreshUserReputation } from '../services/trustService.js';
import { createNotification } from '../services/notificationService.js';

export const createReview = catchAsync(async (req, res, next) => {
  const { transactionId, rating, comment } = req.body;

  if (!transactionId || typeof rating !== 'number' || rating < 1 || rating > 5) {
    return next(new AppError('A rating between 1 and 5 is required.', 400));
  }

  const transaction = await Transaction.findById(transactionId);
  if (!transaction) return next(new AppError('Transaction not found.', 404));

  const isParticipant =
    transaction.ownerId.toString() === req.user._id.toString() ||
    transaction.borrowerId.toString() === req.user._id.toString();

  if (!isParticipant) {
    return next(new AppError('Only participants of the transaction can review.', 403));
  }

  if (transaction.status !== 'RETURNED') {
    return next(new AppError('You can only review completed transactions.', 409));
  }

  const duplicate = await Review.findOne({
    transactionId,
    reviewerId: req.user._id,
  });
  if (duplicate) {
    return next(new AppError('You have already reviewed this transaction.', 409));
  }

  const reviewedUserId =
    transaction.ownerId.toString() === req.user._id.toString()
      ? transaction.borrowerId
      : transaction.ownerId;

  const review = await Review.create({
    transactionId,
    reviewerId: req.user._id,
    reviewedUserId,
    rating,
    comment: comment || '',
  });

  await refreshUserReputation(reviewedUserId);

  const reviewedUser = await User.findById(reviewedUserId);
  await createNotification({
    userId: reviewedUserId,
    type: 'review_received',
    title: 'New review received',
    message: `${req.user.name} rated you ${rating} star${rating === 1 ? '' : 's'} on a completed borrowing.`,
    relatedId: transaction._id,
  });

  return res.status(201).json({
    success: true,
    message: 'Review submitted. Thank you for keeping the community trustworthy.',
    review,
    reviewedUser: reviewedUser ? reviewedUser.toPublicJSON() : null,
  });
});

export const listMyReviews = catchAsync(async (req, res) => {
  const reviews = await Review.find({ reviewerId: req.user._id })
    .sort('-createdAt')
    .populate('reviewedUserId', 'name profileImage');

  return res.json({ success: true, reviews });
});

export const listReviewsForUser = catchAsync(async (req, res) => {
  const userId = req.params.userId;
  const reviews = await Review.find({ reviewedUserId: userId })
    .sort('-createdAt')
    .populate('reviewerId', 'name profileImage')
    .populate('transactionId', 'itemId')
    .populate({
      path: 'transactionId',
      populate: { path: 'itemId', select: 'name images' },
    });

  return res.json({ success: true, reviews });
});