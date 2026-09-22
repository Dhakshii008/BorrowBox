import QRCode from 'qrcode';
import crypto from 'crypto';
import { Item, BorrowRequest, Transaction } from '../models/index.js';
import { AppError, catchAsync } from '../utils/asyncHandler.js';
import { signHandoverToken, verifyHandoverToken, generateHandoverCode } from '../utils/token.js';
import { createNotification } from '../services/notificationService.js';
import { refreshUserReputation } from '../services/trustService.js';

const DURATION_MS = {
  '2 hours': 2 * 60 * 60 * 1000,
  '1 day': 24 * 60 * 60 * 1000,
  '2 days': 2 * 24 * 60 * 60 * 1000,
  '1 week': 7 * 24 * 60 * 60 * 1000,
};

const publicAppUrl = () => {
  const base = process.env.PUBLIC_APP_URL || process.env.CLIENT_URL || 'http://localhost:5173';
  return base.replace(/\/+$/, '');
};

const computeExpectedReturn = (duration) => {
  const ms = DURATION_MS[duration];
  if (!ms) return null;
  return new Date(Date.now() + ms);
};

const handoverInfoForRequest = async (requestId) => {
  const request = await BorrowRequest.findById(requestId)
    .populate('itemId', 'name images category condition location status availability')
    .populate('ownerId', 'name profileImage rating trustScore')
    .populate('borrowerId', 'name profileImage');
  const existing = await Transaction.findOne({ requestId: request._id, status: { $ne: 'RETURNED' } });
  return { request, existingTransaction: existing };
};

const performHandover = async ({ requestId, reqUser, token, code }) => {
  const request = await BorrowRequest.findById(requestId)
    .populate('itemId', 'name images category condition location')
    .populate('ownerId', 'name profileImage rating trustScore')
    .populate('borrowerId', 'name profileImage rating trustScore');

  if (!request) throw new AppError('Request not found.', 404);

  const isParticipant =
    request.borrowerId._id.toString() === reqUser._id.toString() ||
    request.ownerId._id.toString() === reqUser._id.toString() ||
    reqUser.role === 'admin';

  if (!isParticipant) {
    throw new AppError('You are not part of this borrowing.', 403);
  }

  if (request.status !== 'ACCEPTED') {
    throw new AppError(
      `Only accepted requests can be handed over (current status: ${request.status}).`,
      409
    );
  }

  const existing = await Transaction.findOne({ requestId: request._id, status: { $ne: 'RETURNED' } });
  if (existing) {
    throw new AppError('This request has already been handed over.', 409);
  }

  let valid = false;

  if (token) {
    try {
      const decoded = verifyHandoverToken(token);
      valid =
        decoded.purpose === 'borrowbox-handover' &&
        decoded.requestId === request._id.toString() &&
        (!code || decoded.code === code);
    } catch (error) {
      throw new AppError('That handover code is invalid or has expired.', 400);
    }
  } else if (code) {
    const hash = crypto.createHash('sha256').update(String(code).trim()).digest('hex');
    const stored = request.handoverCodeHash;
    valid = Boolean(stored) && hash === stored;
  } else {
    throw new AppError('Handover token or code is required.', 400);
  }

  if (!valid) {
    throw new AppError('Invalid handover code. Please scan the QR from the owner.', 400);
  }

  const item = request.itemId;
  const transaction = await Transaction.create({
    requestId: request._id,
    itemId: request.itemId._id,
    ownerId: request.ownerId._id,
    borrowerId: request.borrowerId._id,
    handoverCode: code || '',
    borrowedAt: new Date(),
    expectedReturnDate: computeExpectedReturn(request.requestedDuration),
    status: 'BORROWED',
  });

  request.status = 'BORROWED';
  await request.save();

  if (item) {
    item.status = 'BORROWED';
    item.availability = false;
    await item.save();
  }

  await createNotification({
    userId: request.ownerId._id,
    type: 'system',
    title: 'Item handed over',
    message: `${reqUser.name} confirmed the handover of "${item.name}".`,
    relatedId: transaction._id,
  });

  const populated = await Transaction.findById(transaction._id)
    .populate('itemId', 'name images category location')
    .populate('ownerId', 'name profileImage rating trustScore')
    .populate('borrowerId', 'name profileImage rating');

  return populated;
};

export const generateHandover = catchAsync(async (req, res, next) => {
  const request = await BorrowRequest.findById(req.params.requestId)
    .populate('itemId', 'name images')
    .populate('borrowerId', 'name');

  if (!request) return next(new AppError('Request not found.', 404));

  if (request.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Only the item owner can generate the handover QR.', 403));
  }

  if (request.status !== 'ACCEPTED') {
    return next(new AppError(`Handover is only allowed for accepted requests (current status: ${request.status}).`, 409));
  }

  const existing = await Transaction.findOne({ requestId: request._id, status: { $ne: 'RETURNED' } });
  if (existing) {
    return next(new AppError('A transaction already exists for this request.', 409));
  }

  const code = generateHandoverCode();
  const token = signHandoverToken({
    purpose: 'borrowbox-handover',
    requestId: request._id.toString(),
    itemId: request.itemId._id.toString(),
    code,
  });

  request.handoverCodeHash = crypto.createHash('sha256').update(code).digest('hex');
  await request.save();

  const verifyBaseUrl = String(req.body?.verifyBaseUrl || publicAppUrl()).replace(/\/+$/, '');
  const verifyUrl = `${verifyBaseUrl}/verify/${token}`;
  const qrDataUrl = await QRCode.toDataURL(String(verifyUrl), {
    margin: 1,
    width: 320,
    color: { dark: '#0F172A', light: '#FFFFFF' },
  });

  const decoded = verifyHandoverToken(token);
  const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 15 * 60 * 1000);

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[BorrowBox] Handover QR URL: ${verifyUrl}`);
  }

  return res.json({
    success: true,
    message: 'Handover QR generated.',
    qr: qrDataUrl,
    token,
    code,
    verifyUrl,
    createdAt: decoded.iat ? new Date(decoded.iat * 1000) : new Date(),
    expiresAt,
    request: {
      id: request._id,
      itemName: request.itemId.name,
      borrowerName: request.borrowerId.name,
      duration: request.requestedDuration,
    },
  });
});

export const handoverInfo = catchAsync(async (req, res, next) => {
  let decoded;
  try {
    decoded = verifyHandoverToken(req.params.token);
  } catch (error) {
    const expiredToken = error?.name === 'TokenExpiredError';
    return res.json({
      success: true,
      valid: false,
      state: expiredToken ? 'expired' : 'invalid',
      reason: expiredToken
        ? 'This handover QR has expired.'
        : 'This verification link is invalid or does not exist.',
    });
  }

  if (decoded.purpose !== 'borrowbox-handover') {
    return res.json({ success: true, valid: false, state: 'invalid', reason: 'This verification link is invalid or does not exist.' });
  }

  const { request, existingTransaction } = await handoverInfoForRequest(decoded.requestId);
  if (!request) {
    return res.json({ success: true, valid: false, state: 'invalid', reason: 'This verification link is invalid or does not exist.' });
  }

  const secondsLeft = decoded.exp ? Math.max(0, Math.floor((decoded.exp * 1000 - Date.now()) / 1000)) : 0;

  const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : null;
  const createdAt = decoded.iat ? new Date(decoded.iat * 1000) : null;
  const expired = secondsLeft <= 0;
  const used = Boolean(existingTransaction) || request.status !== 'ACCEPTED';
  const state = expired ? 'expired' : used ? 'used' : 'active';

  return res.json({
    success: true,
    state,
    valid: state === 'active',
    secondsLeft,
    createdAt,
    expiresAt,
    handoverId: request._id,
    qrUsed: Boolean(existingTransaction),
    status: request.status,
    itemStatus: request.itemId?.status || null,
    request: {
      id: request._id,
      item: request.itemId,
      owner: request.ownerId,
      borrower: request.borrowerId,
      duration: request.requestedDuration,
      reason: request.reason,
    },
  });
});

export const verifyHandoverByToken = catchAsync(async (req, res, next) => {
  const { token } = req.body;
  if (!token) return next(new AppError('Handover token is required.', 400));

  let decoded;
  try {
    decoded = verifyHandoverToken(token);
  } catch (error) {
    return next(new AppError('This handover QR has expired. Ask the owner to generate a new one.', 400));
  }

  if (decoded.purpose !== 'borrowbox-handover') {
    return next(new AppError('This handover QR is invalid.', 400));
  }

  let transaction;
  try {
    transaction = await performHandover({ requestId: decoded.requestId, reqUser: req.user, token });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    throw error;
  }

  return res.json({
    success: true,
    message: 'Handover verified. Enjoy your item!',
    transaction,
  });
});

export const verifyHandover = catchAsync(async (req, res, next) => {
  let transaction;
  try {
    transaction = await performHandover({
      requestId: req.params.requestId,
      reqUser: req.user,
      token: req.body.token,
      code: req.body.code,
    });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    throw error;
  }

  return res.json({
    success: true,
    message: 'Handover verified. Enjoy your item!',
    transaction,
  });
});

export const requestReturn = catchAsync(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id)
    .populate('itemId', 'name images')
    .populate('ownerId', 'name profileImage');

  if (!transaction) return next(new AppError('Transaction not found.', 404));

  if (transaction.borrowerId.toString() !== req.user._id.toString()) {
    return next(new AppError('Only the borrower can request a return.', 403));
  }

  if (transaction.status !== 'BORROWED') {
    return next(new AppError('Return can only be requested for an actively borrowed item.', 409));
  }

  transaction.status = 'RETURN_REQUESTED';
  await transaction.save();

  const request = await BorrowRequest.findById(transaction.requestId);
  if (request) {
    request.status = 'RETURN_REQUESTED';
    await request.save();
  }

  await createNotification({
    userId: transaction.ownerId,
    type: 'return_requested',
    title: 'Return requested',
    message: `${req.user.name} wants to return "${transaction.itemId?.name || 'your item'}".`,
    relatedId: transaction._id,
  });

  const updated = await Transaction.findById(transaction._id)
    .populate('itemId', 'name images')
    .populate('borrowerId', 'name profileImage')
    .populate('ownerId', 'name profileImage');

  return res.json({
    success: true,
    message: 'Return request sent to the owner.',
    transaction: updated,
  });
});

export const confirmReturn = catchAsync(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id)
    .populate('itemId', 'name images')
    .populate('borrowerId', 'name');

  if (!transaction) return next(new AppError('Transaction not found.', 404));

  if (transaction.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Only the item owner can confirm the return.', 403));
  }

  if (transaction.status !== 'RETURN_REQUESTED') {
    return next(new AppError('Return can only be confirmed after the borrower requested it.', 409));
  }

  transaction.status = 'RETURNED';
  transaction.returnedAt = new Date();
  await transaction.save();

  const request = await BorrowRequest.findById(transaction.requestId);
  if (request) {
    request.status = 'RETURNED';
    request.returnedAt = new Date();
    await request.save();
  }

  const item = await Item.findById(transaction.itemId);
  if (item) {
    item.status = 'AVAILABLE';
    item.availability = true;
    await item.save();
  }

  await createNotification({
    userId: transaction.borrowerId,
    type: 'return_confirmed',
    title: 'Return confirmed',
    message: `${req.user.name} confirmed that "${item?.name || 'your borrowed item'}" was returned. Thanks for lending and borrowing safely!`,
    relatedId: transaction._id,
  });

  await createNotification({
    userId: transaction.ownerId,
    type: 'return_confirmed',
    title: 'Return completed',
    message: `You confirmed the return of "${item?.name || 'your item'}". It is now available to lend again.`,
    relatedId: transaction._id,
  });

  await Promise.all([
    refreshUserReputation(transaction.ownerId),
    refreshUserReputation(transaction.borrowerId),
  ]);

  const updated = await Transaction.findById(transaction._id)
    .populate('itemId', 'name images')
    .populate('borrowerId', 'name profileImage')
    .populate('ownerId', 'name profileImage');

  return res.json({
    success: true,
    message: 'Return confirmed. The item is now available again.',
    transaction: updated,
  });
});

export const myTransactions = catchAsync(async (req, res) => {
  const transactions = await Transaction.find({ borrowerId: req.user._id })
    .sort('-createdAt')
    .populate('itemId', 'name images location category')
    .populate('ownerId', 'name profileImage rating trustScore')
    .populate('requestId', 'reason requestedDuration');

  return res.json({ success: true, transactions });
});

export const ownedTransactions = catchAsync(async (req, res) => {
  const transactions = await Transaction.find({ ownerId: req.user._id })
    .sort('-createdAt')
    .populate('itemId', 'name images location category')
    .populate('borrowerId', 'name profileImage rating trustScore')
    .populate('requestId', 'reason requestedDuration');

  return res.json({ success: true, transactions });
});