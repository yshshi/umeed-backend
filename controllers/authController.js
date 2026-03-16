const jwt = require('jsonwebtoken');
const User = require('../models/User');
const generateMemberId = require('../utils/generateMemberId');
const { sendWelcomeEmail } = require('../services/emailService');
const { sendReferralRegistrationAlert } = require('../services/emailService');
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

const generateToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRE });

const ALLOWED_BUSINESS_TYPE = 'Gullak Plan';

/**
 * Register new user. Referral from query ref or body referralCode.
 * parentId and level set from referrer. ancestors built for tree.
 */
exports.register = async (req, res, next) => {
  try {
    const businessType = (req.body.businessType || '').trim();
    if (businessType !== ALLOWED_BUSINESS_TYPE) {
      return res.status(400).json({ success: false, message: 'Only Gullak Plan is available for registration.' });
    }
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
      businessType,
      ancestors,
    });

    const token = generateToken(user._id);
    const userResponse = await User.findById(user._id).select('-password').lean();

    // Welcome email
    sendWelcomeEmail(user).catch(() => {});

    // Notify parent
    if (parent) {
      sendReferralRegistrationAlert(parent, user).catch(() => {});
    }

    res.status(201).json({
      success: true,
      token,
      user: userResponse,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Member ID already exists. Please try again.' });
    }
    next(err);
  }
};

/**
 * Login with memberId + password
 */
exports.login = async (req, res, next) => {
  try {
    console.log("Login request received:", req.body);

    const memberId = req.body.memberId?.toUpperCase().trim();
    console.log("Formatted Member ID:", memberId);

    const user = await User.findOne({ memberId }).select('+password');
    console.log("User found:", user ? user._id : "No user found");

    if (!user) {
      console.log("Login failed: User not found");
      return res.status(401).json({ success: false, message: 'Invalid Member ID or password.' });
    }

    const isPasswordValid = await user.comparePassword(req.body.password);
    console.log("Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      console.log("Login failed: Invalid password");
      return res.status(401).json({ success: false, message: 'Invalid Member ID or password.' });
    }

    if (!user.isActive) {
      console.log("Login failed: Account deactivated for user:", user._id);
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    const token = generateToken(user._id);
    console.log("Token generated for user:", user._id);

    const userResponse = await User.findById(user._id).select('-password').lean();
    console.log("User response prepared");

    res.json({ success: true, token, user: userResponse });

  } catch (err) {
    console.error("Login error:", err);
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
