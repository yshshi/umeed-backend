const Transaction = require('../models/Transaction');

/**
 * Get transaction history for wallet
 */
exports.getTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    res.json({ success: true, transactions });
  } catch (err) {
    next(err);
  }
};
