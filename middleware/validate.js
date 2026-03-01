/**
 * Simple validation helpers for request body
 */
const validateRegister = (req, res, next) => {
  const { name, email, mobile, password, businessType } = req.body;
  const errors = [];
  if (!name?.trim()) errors.push('Name is required');
  if (!email?.trim()) errors.push('Email is required');
  if (!mobile?.trim()) errors.push('Mobile is required');
  if (!password || password.length < 6) errors.push('Password must be at least 6 characters');
  if (!businessType?.trim()) errors.push('Business type is required');
  if (errors.length) return res.status(400).json({ success: false, message: errors.join(', ') });
  next();
};

const validateLogin = (req, res, next) => {
  const { memberId, password } = req.body;
  if (!memberId?.trim() || !password) {
    return res.status(400).json({ success: false, message: 'Member ID and password are required' });
  }
  next();
};

module.exports = { validateRegister, validateLogin };
