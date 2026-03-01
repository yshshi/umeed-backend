const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fromMemberId: { type: String, required: true },
    fromName: { type: String, required: true },
    level: { type: Number, required: true },
    amount: { type: Number, required: true },
    percentage: { type: Number, required: true },
    status: { type: String, enum: ['credited', 'pending', 'cancelled'], default: 'credited' },
    referenceType: { type: String, default: 'registration' },
    referenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

commissionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Commission', commissionSchema);
