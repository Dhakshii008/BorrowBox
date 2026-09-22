import { Item, BorrowRequest } from '../models/index.js';
import { AppError, catchAsync } from '../utils/asyncHandler.js';
import { createNotification } from '../services/notificationService.js';

const DURATION_MS = {
  '2 hours': 2 * 60 * 60 * 1000,
  '1 day': 24 * 60 * 60 * 1000,
  '2 days': 2 * 24 * 60 * 60 * 1000,
  '1 week': 7 * 24 * 60 * 60 * 1000,
};

export const createBorrowRequest = catchAsync(async (req, res, next) => {
  const { itemId, reason, requestedDuration } = req.body;
  const borrowerId = req.user._id;

  if (!itemId || !reason || !requestedDuration) {
    return next(new AppError('Item, reason and duration are required.', 400));
  }

  if (!DURATION_MS[requestedDuration]) {
    return next(new AppError('Invalid requested duration.', 400));
  }

  const item = await Item.findById(itemId);
  if (!item) return next(new AppError('Item not found.', 404));

  if (item.ownerId.toString() === borrowerId.toString()) {
    return next(new AppError('You cannot borrow your own item.', 400));
  }

  if (item.status !== 'AVAILABLE' || item.availability === false) {
    return next(new AppError('This item is currently not available for borrowing.', 409));
  }

  const duplicate = await BorrowRequest.findOne({
    itemId: item._id,
    borrowerId,
    status: { $in: ['PENDING', 'ACCEPTED', 'BORROWED'] },
  });

  if (duplicate) {
    return next(new AppError('You already have an active or pending request for this item.', 409));
  }

  const request = await BorrowRequest.create({
    itemId: item._id,
    ownerId: item.ownerId,
    borrowerId,
    reason,
    requestedDuration,
    status: 'PENDING',
  });

  await createNotification({
    userId: item.ownerId,
    type: 'borrow_request',
    title: 'New borrow request',
    message: `${req.user.name} wants to borrow "${item.name}".`,
    relatedId: request._id,
  });

  const populated = await BorrowRequest.findById(request._id)
    .populate('itemId', 'name images location category')
    .populate('ownerId', 'name profileImage')
    .populate('borrowerId', 'name profileImage rating');

  return res.status(201).json({
    success: true,
    message: 'Borrow request sent.',
    request: populated,
  });
});

export const myBorrowRequests = catchAsync(async (req, res) => {
  const requests = await BorrowRequest.find({ borrowerId: req.user._id })
    .sort('-createdAt')
    .populate('itemId', 'name images location category status')
    .populate('ownerId', 'name profileImage rating trustScore');

  return res.json({ success: true, requests });
});

export const receivedBorrowRequests = catchAsync(async (req, res) => {
  const requests = await BorrowRequest.find({ ownerId: req.user._id })
    .sort('-createdAt')
    .populate('itemId', 'name images location category status')
    .populate('borrowerId', 'name profileImage rating trustScore department year');

  return res.json({ success: true, requests });
});

const canManageItem = (item, user) =>
  item.ownerId.toString() === user._id.toString() || user.role === 'admin';

export const acceptBorrowRequest = catchAsync(async (req, res, next) => {
  const request = await BorrowRequest.findById(req.params.id)
    .populate('itemId', 'name images ownerId status availability')
    .populate('borrowerId', 'name')
    .populate('ownerId', 'name');

  if (!request) return next(new AppError('Request not found.', 404));

  if (!canManageItem(request.itemId, req.user)) {
    return next(new AppError('Only the item owner can accept this request.', 403));
  }

  if (request.status !== 'PENDING') {
    return next(new AppError(`This request cannot be accepted (current status: ${request.status}).`, 409));
  }

  if (request.itemId.status !== 'AVAILABLE' || request.itemId.availability === false) {
    return next(new AppError('This item is no longer available.', 409));
  }

  request.status = 'ACCEPTED';
  request.acceptedAt = new Date();
  await request.save();

  request.itemId.status = 'RESERVED';
  await request.itemId.save();

  const otherPending = await BorrowRequest.find({
    itemId: request.itemId._id,
    _id: { $ne: request._id },
    status: 'PENDING',
  });

  await Promise.all(
    otherPending.map(async (other) => {
      other.status = 'DECLINED';
      other.declinedAt = new Date();
      await other.save();
      await createNotification({
        userId: other.borrowerId,
        type: 'request_declined',
        title: 'Request declined',
        message: `Your request for "${request.itemId.name}" was declined because the item was lent to someone else.`,
        relatedId: other._id,
      });
    })
  );

  await createNotification({
    userId: request.borrowerId,
    type: 'request_accepted',
    title: 'Request accepted',
    message: `${req.user.name} accepted your request for "${request.itemId.name}".`,
    relatedId: request._id,
  });

  const updated = await BorrowRequest.findById(request._id)
    .populate('itemId', 'name images location category status')
    .populate('ownerId', 'name profileImage')
    .populate('borrowerId', 'name profileImage rating');

  return res.json({
    success: true,
    message: 'Request accepted. The item is now reserved.',
    request: updated,
  });
});

export const declineBorrowRequest = catchAsync(async (req, res, next) => {
  const request = await BorrowRequest.findById(req.params.id)
    .populate('itemId', 'name ownerId status')
    .populate('borrowerId', 'name');

  if (!request) return next(new AppError('Request not found.', 404));

  if (!canManageItem(request.itemId, req.user)) {
    return next(new AppError('Only the item owner can decline this request.', 403));
  }

  if (request.status !== 'PENDING') {
    return next(new AppError(`This request cannot be declined (current status: ${request.status}).`, 409));
  }

  request.status = 'DECLINED';
  request.declinedAt = new Date();
  await request.save();

  await createNotification({
    userId: request.borrowerId,
    type: 'request_declined',
    title: 'Request declined',
    message: `Your request for "${request.itemId.name}" was declined.`,
    relatedId: request._id,
  });

  const updated = await BorrowRequest.findById(request._id)
    .populate('itemId', 'name images location category status')
    .populate('ownerId', 'name profileImage')
    .populate('borrowerId', 'name profileImage rating');

  return res.json({
    success: true,
    message: 'Request declined.',
    request: updated,
  });
});