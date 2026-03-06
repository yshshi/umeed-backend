const User = require('../models/User');
const generateMemberId = require('../utils/generateMemberId');
const { sendWelcomeEmail } = require('../services/emailService');
const { sendReferralRegistrationAlert } = require('../services/emailService');
const { processRegistrationCommission } = require('../services/commissionService');

const ALLOWED_BUSINESS_TYPE = 'Gullak Plan';

/**
 * Logged-in user registers a new member (parentId = current user, level and ancestors set)
 */
exports.registerUnderUser = async (req, res, next) => {
  try {
    const businessType = (req.body.businessType || '').trim();
    if (businessType !== ALLOWED_BUSINESS_TYPE) {
      return res.status(400).json({ success: false, message: 'Only Gullak Plan is available for registration.' });
    }
    const parent = req.user;
    const memberId = await generateMemberId();
    const referralCode = memberId;
    const ancestors = [...parent.ancestors, parent._id];
    const level = parent.level + 1;

    const user = await User.create({
      name: req.body.name.trim(),
      email: req.body.email.trim().toLowerCase(),
      mobile: req.body.mobile.trim(),
      password: req.body.password,
      memberId,
      referralCode,
      parentId: parent._id,
      level,
      businessType,
      ancestors,
    });

    const userResponse = await User.findById(user._id).select('-password').lean();

    sendWelcomeEmail(user).catch(() => {});
    sendReferralRegistrationAlert(parent, user).catch(() => {});
    processRegistrationCommission(user).catch((err) => console.error('Commission error:', err));

    res.status(201).json({
      success: true,
      message: 'Member registered successfully.',
      user: userResponse,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Member ID already exists. Please try again.' });
    }
    next(err);
  }
};
