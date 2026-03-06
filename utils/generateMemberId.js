const User = require('../models/User');

/**
 * Generate next member ID in format UM10001, UM10002, ...
 */
const PREFIX = 'UM';
const generateMemberId = async () => {
  const last = await User.findOne().sort({ memberId: -1 }).select('memberId').lean();
  if (!last || !last.memberId) return 'UM10001';
  const num = parseInt(last.memberId.replace(/\D/g, ''), 10) || 10000;
  return `${PREFIX}${num + 1}`;
};

module.exports = generateMemberId;
