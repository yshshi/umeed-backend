const jwt = require('jsonwebtoken');
const User = require('../models/User');
const generateMemberId = require('../utils/generateMemberId');
const { sendWelcomeEmail } = require('../services/emailService');
const { sendReferralRegistrationAlert } = require('../services/emailService');
const { processRegistrationCommission } = require('../services/commissionService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

const generateToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRE });

/**
 * Register new user. Referral from query ref or body referralCode.
 * parentId and level set from referrer. ancestors built for tree.
 */
exports.register = async (req, res, next) => {
  try {
    const ref = req.body.referralCode || req.query.ref;
    let parent = null;
    if (ref) {
      parent = await User.findOne({ referralCode: ref.toUpperCase().trim(), isActive: true });
      if (!parent) {
        return res.status(400).json({ success: false, message: 'Invalid referral code.' });
      }
    }

    const memberId = await generateMemberId();
    const referralCode = memberId;
    const ancestors = parent ? [...parent.ancestors, parent._id] : [];
    const level = parent ? parent.level + 1 : 1;

    const user = await User.create({
      name: req.body.name.trim(),
      email: req.body.email.trim().toLowerCase(),
      mobile: req.body.mobile.trim(),
      password: req.body.password,
      memberId,
      referralCode,
      parentId: parent?._id || null,
      level,
      businessType: req.body.businessType.trim(),
      ancestors,
    });

    const token = generateToken(user._id);
    const userResponse = await User.findById(user._id).select('-password').lean();

    // Welcome email
    sendWelcomeEmail(user).catch(() => {});

    // Notify parent
    if (parent) {
      sendReferralRegistrationAlert(parent, user).catch(() => {});
      processRegistrationCommission(user).catch((err) => console.error('Commission error:', err));
    }

    res.status(201).json({
      success: true,
      token,
      user: userResponse,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email or member ID already exists.' });
    }
    next(err);
  }
};

/**
 * Login with memberId + password
 */
exports.login = async (req, res, next) => {
  try {
    const user = await User.findOne({ memberId: req.body.memberId.toUpperCase().trim() }).select('+password');
    if (!user || !(await user.comparePassword(req.body.password))) {
      return res.status(401).json({ success: false, message: 'Invalid Member ID or password.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }
    const token = generateToken(user._id);
    const userResponse = await User.findById(user._id).select('-password').lean();
    res.json({ success: true, token, user: userResponse });
  } catch (err) {
    next(err);
  }
};

/**
 * Get current user profile (protected)
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password').lean();
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
