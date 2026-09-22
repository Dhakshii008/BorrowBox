import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [120, 'Item name cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    category: {
      type: String,
      enum: ['Academic', 'Electronics', 'Daily Use', 'Events', 'Other'],
      required: [true, 'Category is required'],
    },
    condition: {
      type: String,
      enum: ['Excellent', 'Good', 'Fair', 'Poor'],
      required: [true, 'Condition is required'],
    },
    images: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      enum: [
        'Main Block',
        'Library',
        'Canteen',
        'Hostel',
        'Engineering Block',
        'Lab Block',
        'Sports Ground',
        'Other',
      ],
      default: 'Main Block',
    },
    availability: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'RESERVED', 'BORROWED', 'UNAVAILABLE'],
      default: 'AVAILABLE',
    },
  },
  {
    timestamps: true,
  }
);

itemSchema.index({ name: 'text', description: 'text' });
itemSchema.index({ category: 1, location: 1, condition: 1, status: 1 });

const Item = mongoose.model('Item', itemSchema);
export default Item;