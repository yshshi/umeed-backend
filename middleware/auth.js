const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * JWT authentication middleware - protects routes
 */
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. No token.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-change-in-production');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ success: false, message: 'User not found.' });
    if (!req.user.isActive) return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized. Invalid token.' });
  }
};

/**
 * Role-based middleware - admin only
 */
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
  }
  next();
};

module.exports = { protect, adminOnly };
