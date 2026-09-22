import mongoose from 'mongoose';

const borrowRequestSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    borrowerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      maxlength: [1000, 'Reason cannot exceed 1000 characters'],
    },
    requestedDuration: {
      type: String,
      enum: ['2 hours', '1 day', '2 days', '1 week'],
      required: [true, 'Requested duration is required'],
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'BORROWED', 'RETURN_REQUESTED', 'RETURNED'],
      default: 'PENDING',
    },
    handoverCodeHash: {
      type: String,
      default: '',
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    declinedAt: {
      type: Date,
      default: null,
    },
    returnedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

borrowRequestSchema.index({ itemId: 1, borrowerId: 1, status: 1 });

const BorrowRequest = mongoose.model('BorrowRequest', borrowRequestSchema);
export default BorrowRequest;