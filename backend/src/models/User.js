import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    department: {
      type: String,
      default: '',
      trim: true,
    },
    year: {
      type: Number,
      default: null,
    },
    profileImage: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    trustScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.comparePassword = async function (candidate) {
  const bcrypt = (await import('bcryptjs')).default;
  return bcrypt.compare(candidate, this.password);
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const bcrypt = (await import('bcryptjs')).default;
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    department: this.department,
    year: this.year,
    profileImage: this.profileImage,
    role: this.role,
    trustScore: this.trustScore,
    rating: this.rating,
    ratingCount: this.ratingCount,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model('User', userSchema);
export default User;