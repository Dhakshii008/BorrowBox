import Transaction from '../models/Transaction.js';
import Review from '../models/Review.js';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const countCompletedForUser = async (userId) => {
  const [lent, borrowed] = await Promise.all([
    Transaction.countDocuments({ ownerId: userId, status: 'RETURNED' }),
    Transaction.countDocuments({ borrowerId: userId, status: 'RETURNED' }),
  ]);
  return { lent, borrowed };
};

const countLateReturns = async (userId) => {
  const transactions = await Transaction.find({ borrowerId: userId, status: 'RETURNED' });
  let late = 0;
  for (const txn of transactions) {
    if (txn.returnedAt && txn.expectedReturnDate && new Date(txn.returnedAt) > new Date(txn.expectedReturnDate)) {
      late += 1;
    }
  }
  return late;
};

export const getReliability = async (userId) => {
  const transactions = await Transaction.find({ borrowerId: userId });
  const returned = transactions.filter((t) => t.status === 'RETURNED').length;
  if (transactions.length === 0) return 100;
  return Math.round((returned / transactions.length) * 100);
};

export const computeTrustScore = async (userId) => {
  const Review = (await import('../models/Review.js')).default;

  const [reviews, { lent, borrowed }] = await Promise.all([
    Review.find({ reviewedUserId: userId }),
    countCompletedForUser(userId),
  ]);

  const totalTransactions = lent + borrowed;
  const reliability = await getReliability(userId);
  const lateReturns = await countLateReturns(userId);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const ratingScore = (avgRating / 5) * 40;
  const reliabilityScore = (reliability / 100) * 35;
  const activityScore = Math.min(totalTransactions * 5, 15);
  const latePenalty = lateReturns * 10;
  const trustScore = clamp(Math.round(ratingScore + reliabilityScore + activityScore - latePenalty), 5, 100);

  return {
    trustScore,
    rating: Math.round(avgRating * 10) / 10,
    ratingCount: reviews.length,
    itemsLent: lent,
    itemsBorrowed: borrowed,
    successfulReturns: borrowed,
    lateReturns,
    reliability,
  };
};

export const refreshUserReputation = async (userId) => {
  const stats = await computeTrustScore(userId);
  const User = (await import('../models/User.js')).default;
  await User.findByIdAndUpdate(userId, {
    trustScore: stats.trustScore,
    rating: stats.rating,
    ratingCount: stats.ratingCount,
  });
  return stats;
};