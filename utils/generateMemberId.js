const User = require('../models/User');

/**
 * Generate next member ID in format NM10001, NM10002, ...
 */
const generateMemberId = async () => {
  const last = await User.findOne().sort({ memberId: -1 }).select('memberId').lean();
  if (!last || !last.memberId) return 'NM10001';
  const num = parseInt(last.memberId.replace(/\D/g, ''), 10) || 10000;
  return `NM${num + 1}`;
};

module.exports = generateMemberId;
