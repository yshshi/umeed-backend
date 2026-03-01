const User = require('../models/User');

/**
 * Update profile (personal, address, family, bank)
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = [
      'name', 'mobile', 'address', 'familyDetails', 'bankDetails',
      'address.street', 'address.city', 'address.state', 'address.pincode', 'address.country',
      'familyDetails.spouseName', 'familyDetails.children', 'familyDetails.dob',
      'bankDetails.accountHolderName', 'bankDetails.bankName', 'bankDetails.accountNumber',
      'bankDetails.ifscCode', 'bankDetails.branch',
    ];
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name.trim();
    if (req.body.mobile !== undefined) updates.mobile = req.body.mobile.trim();
    if (req.body.address) updates.address = { ...req.user.address, ...req.body.address };
    if (req.body.familyDetails) updates.familyDetails = { ...req.user.familyDetails, ...req.body.familyDetails };
    if (req.body.bankDetails) updates.bankDetails = { ...req.user.bankDetails, ...req.body.bankDetails };

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password').lean();
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

/**
 * Get user by ID (for tree/profile view) - only own or admin
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const isOwn = req.user.id === user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwn && !isAdmin) return res.status(403).json({ success: false, message: 'Access denied.' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
