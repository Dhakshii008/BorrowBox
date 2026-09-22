import { User } from '../models/index.js';
import { signToken } from '../utils/token.js';
import { AppError, catchAsync } from '../utils/asyncHandler.js';

const attachToken = (res, user) => {
  const token = signToken(user._id);
  return {
    token,
    user: user.toPublicJSON(),
  };
};

export const register = catchAsync(async (req, res, next) => {
  const { name, email, password, department, year } = req.body;

  if (!name || !email || !password) {
    return next(new AppError('Name, email and password are required.', 400));
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return next(new AppError('An account with this email already exists.', 409));
  }

  const user = await User.create({
    name,
    email,
    password,
    department: department || '',
    year: year || null,
  });

  const data = attachToken(res, user);
  return res.status(201).json({ success: true, message: 'Account created successfully.', ...data });
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Email and password are required.', 400));
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    return next(new AppError('Invalid email or password.', 401));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new AppError('Invalid email or password.', 401));
  }

  const data = attachToken(res, user);
  return res.status(200).json({ success: true, message: 'Welcome back.', ...data });
});

export const me = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  return res.json({ success: true, user: user.toPublicJSON() });
});

export const updateProfile = catchAsync(async (req, res, next) => {
  const { name, department, year } = req.body;
  const updates = {};

  if (name !== undefined) updates.name = name;
  if (department !== undefined) updates.department = department;
  if (year !== undefined) updates.year = year ? Number(year) : null;

  if (req.file) updates.profileImage = `/uploads/${req.file.filename}`;

  if (Object.keys(updates).length === 0) {
    return next(new AppError('No updates provided.', 400));
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  return res.json({ success: true, message: 'Profile updated.', user: user.toPublicJSON() });
});

export const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Current and new password are required.', 400));
  }
  if (newPassword.length < 6) {
    return next(new AppError('New password must be at least 6 characters.', 400));
  }

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return next(new AppError('Current password is incorrect.', 400));
  }

  user.password = newPassword;
  await user.save();

  return res.json({ success: true, message: 'Password updated successfully.' });
});