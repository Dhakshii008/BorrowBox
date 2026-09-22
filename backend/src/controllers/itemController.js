import { Item, BorrowRequest, Transaction, Notification } from '../models/index.js';
import { AppError, catchAsync } from '../utils/asyncHandler.js';
import { createNotification } from '../services/notificationService.js';

const getAssetUrls = (files) =>
  (files || []).map((f) => `/uploads/${f.filename}`);

export const listItems = catchAsync(async (req, res) => {
  const {
    search,
    category,
    location,
    condition,
    availability,
    status,
    owner,
    excludeOwner,
    sort = '-createdAt',
    page = 1,
    limit = 12,
  } = req.query;

  const query = {};

  if (category) query.category = category;
  if (location) query.location = location;
  if (condition) query.condition = condition;

  if (availability === 'true') query.availability = true;
  if (availability === 'false') query.availability = false;

  if (owner) {
    query.ownerId = owner;
  } else if (status) {
    if (status === 'true') query.status = { $ne: 'UNAVAILABLE' };
    else if (status !== 'all') query.status = status;
  } else {
    query.status = 'AVAILABLE';
    query.availability = { $ne: false };
  }

  if (excludeOwner) query.ownerId = { $ne: excludeOwner };

  if (search && search.trim()) {
    query.$text = { $search: search.trim() };
  }

  const sortOptions = {};
  switch (sort) {
    case 'newest':
      sortOptions.createdAt = -1;
      break;
    case 'oldest':
      sortOptions.createdAt = 1;
      break;
    case 'name':
    case 'name-asc':
      sortOptions.name = 1;
      break;
    default:
      sortOptions.createdAt = -1;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
  const skip = (pageNum - 1) * limitNum;

  const [items, total] = await Promise.all([
    Item.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate('ownerId', 'name email department year profileImage trustScore rating ratingCount'),
    Item.countDocuments(query),
  ]);

  const itemsPlain = items.map((item) => {
    const obj = item.toObject();
    return { ...obj, owner: obj.ownerId };
  });

  return res.json({
    success: true,
    items: itemsPlain,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 0,
    },
  });
});

export const getItem = catchAsync(async (req, res, next) => {
  const item = await Item.findById(req.params.id).populate(
    'ownerId',
    'name email department year profileImage trustScore rating ratingCount'
  );

  if (!item) {
    return next(new AppError('Item not found.', 404));
  }

  return res.json({ success: true, item: { ...item.toObject(), owner: item.ownerId } });
});

export const createItem = catchAsync(async (req, res, next) => {
  const { name, description, category, condition, location, availability } = req.body;

  if (!name || !category || !condition) {
    return next(new AppError('Name, category and condition are required.', 400));
  }

  const images = getAssetUrls(req.files || []);

  const item = await Item.create({
    ownerId: req.user._id,
    name,
    description: description || '',
    category,
    condition,
    images,
    location: location || 'Main Block',
    availability: availability !== 'false',
  });

  return res.status(201).json({ success: true, message: 'Item listed successfully.', item });
});

export const updateItem = catchAsync(async (req, res, next) => {
  const item = await Item.findById(req.params.id);
  if (!item) return next(new AppError('Item not found.', 404));

  if (item.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You can only edit your own items.', 403));
  }

  const allowed = ['name', 'description', 'category', 'condition', 'location', 'availability'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) item[field] = req.body[field];
  });

  if (req.files && req.files.length > 0) {
    const newImages = getAssetUrls(req.files);
    if (req.body.removeAllImages === 'true') {
      item.images = newImages;
    } else {
      const existing = Array.isArray(req.body.existingImages)
        ? req.body.existingImages
        : typeof req.body.existingImages === 'string' && req.body.existingImages
          ? [req.body.existingImages]
          : [];
      item.images = [...existing, ...newImages];
    }
  }

  await item.save();
  return res.json({ success: true, message: 'Item updated successfully.', item });
});

export const deleteItem = catchAsync(async (req, res, next) => {
  const item = await Item.findById(req.params.id);
  if (!item) return next(new AppError('Item not found.', 404));

  if (item.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You can only remove your own items.', 403));
  }

  const activeTransaction = await Transaction.findOne({
    itemId: item._id,
    status: { $in: ['BORROWED', 'RETURN_REQUESTED'] },
  });

  if (activeTransaction) {
    return next(new AppError('This item is currently borrowed and cannot be removed yet.', 400));
  }

  await BorrowRequest.updateMany({ itemId: item._id, status: 'PENDING' }, { status: 'DECLINED' });
  await item.deleteOne();

  return res.json({ success: true, message: 'Item removed successfully.' });
});

export const dashboardStats = catchAsync(async (req, res) => {
  const userId = req.user._id;

  const [ownItems, activeBorrowings, pendingRequestsReceived, unreadNotifications, itemStatuses] =
    await Promise.all([
      Item.countDocuments({ ownerId: userId }),
      Transaction.countDocuments({
        borrowerId: userId,
        status: { $in: ['BORROWED', 'RETURN_REQUESTED'] },
      }),
      BorrowRequest.countDocuments({
        ownerId: userId,
        status: 'PENDING',
      }),
      Notification.countDocuments({ userId, read: false }),
      Item.aggregate([
        { $match: { ownerId: userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

  const [recentBorrowed, recentListed, pendingList, recentNotifications, recommended] =
    await Promise.all([
      BorrowRequest.find({ borrowerId: userId })
        .sort('-createdAt')
        .limit(5)
        .populate('itemId', 'name images category location')
        .populate('ownerId', 'name rating profileImage'),
      Item.find({ ownerId: userId }).sort('-createdAt').limit(5),
      BorrowRequest.find({ ownerId: userId, status: 'PENDING' })
        .sort('-createdAt')
        .limit(5)
        .populate('itemId', 'name images')
        .populate('borrowerId', 'name profileImage'),
      Notification.find({ userId }).sort('-createdAt').limit(5),
      Item.find({ status: 'AVAILABLE', ownerId: { $ne: userId } })
        .sort('-createdAt')
        .limit(4)
        .populate('ownerId', 'name rating trustScore profileImage'),
    ]);

  const stats = {
    activeBorrowings,
    itemsShared: ownItems,
    pendingRequests: pendingRequestsReceived,
    unreadNotifications,
    availableItems: itemStatuses.find((s) => s._id === 'AVAILABLE')?.count || 0,
    reservedItems: itemStatuses.find((s) => s._id === 'RESERVED')?.count || 0,
    borrowedItems: itemStatuses.find((s) => s._id === 'BORROWED')?.count || 0,
    trustScore: req.user.trustScore,
  };

  return res.json({
    success: true,
    stats,
    recentBorrowed,
    recentListed,
    pendingList,
    recentNotifications,
    recommended,
  });
});