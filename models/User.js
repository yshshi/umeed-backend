const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    password: { type: String, required: true, select: false },
    memberId: { type: String, required: true, unique: true, uppercase: true },
    referralCode: { type: String, required: true, unique: true, uppercase: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    level: { type: Number, default: 1 },
    registrationDate: { type: Date, default: Date.now },
    businessType: { type: String, required: true, trim: true },
    walletBalance: { type: Number, default: 0 },
    totalIncome: { type: Number, default: 0 },
    totalBonus: { type: Number, default: 0 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isActive: { type: Boolean, default: true },
    ancestors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Profile extended fields
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    familyDetails: {
      spouseName: String,
      children: String,
      dob: Date,
    },
    bankDetails: {
      accountHolderName: String,
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      branch: String,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
