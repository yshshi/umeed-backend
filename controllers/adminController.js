const User = require('../models/User');
const Commission = require('../models/Commission');
const Transaction = require('../models/Transaction');
const { processDepositCommission } = require('../services/commissionService');

/**
 * Get all users (admin only)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

/**
 * Activate / Deactivate user
 */
exports.toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive !== false },
      { new: true }
    ).select('-password').lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

/**
 * Add deposit for a user (admin only). Updates wallet, totalDeposit, latestDeposit*, triggers commission to ancestors.
 */
exports.addDeposit = async (req, res, next) => {
  try {
    const amount = Math.round(parseFloat(req.body.amount) || 0);
    if (amount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount.' });
    const user = await User.findById(req.params.id).select('ancestors name memberId');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      {
        $inc: { walletBalance: amount, totalDeposit: amount },
        $set: {
          latestDepositAmount: amount,
          latestDepositDate: new Date(),
        },
      },
      { new: true }
    ).select('-password').lean();

    await Transaction.create({
      userId: user._id,
      type: 'credit',
      amount,
      balanceAfter: updated.walletBalance,
      description: 'Deposit added by admin',
      referenceType: 'deposit',
    });

    const userWithAncestors = await User.findById(req.params.id).select('ancestors name memberId').lean();
    await processDepositCommission(userWithAncestors, amount);

    res.json({ success: true, user: updated, message: 'Deposit added and commission processed.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Update total amount for a user (admin only)
 */
exports.updateTotalAmount = async (req, res, next) => {
  try {
    const totalAmount = Math.round(parseFloat(req.body.totalAmount) || 0);
    if (totalAmount < 0) return res.status(400).json({ success: false, message: 'Invalid amount.' });
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { totalAmount },
      { new: true }
    ).select('-password').lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

/**
 * Platform stats
 */
exports.getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalCommissions = await Commission.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]);
    const totalCommission = totalCommissions[0]?.total || 0;
    res.json({
      success: true,
      stats: { totalUsers, activeUsers, totalCommission },
    });
  } catch (err) {
    next(err);
  }
};
