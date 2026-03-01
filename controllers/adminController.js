const User = require('../models/User');
const Commission = require('../models/Commission');

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
