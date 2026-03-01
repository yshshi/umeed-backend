const Commission = require('../models/Commission');

/**
 * Get commission history for logged-in user
 */
exports.getMyCommissions = async (req, res, next) => {
  try {
    const commissions = await Commission.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    res.json({ success: true, commissions });
  } catch (err) {
    next(err);
  }
};
