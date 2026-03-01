const User = require('../models/User');

/**
 * Get tree for userId. Returns nested structure for recursive component.
 * ancestors array used for optimized path; we fetch direct children and build tree to level 1 (direct referrals only if you want "tree limited until level 1" as direct only; otherwise we do full subtree).
 * Requirement: "Tree limited until level 1" -> show only direct referrals (level 1 down from root).
 */
async function buildTreeNodes(userId, maxDepth = 1, currentDepth = 0) {
  if (currentDepth >= maxDepth) return [];
  const children = await User.find({ parentId: userId, isActive: true })
    .select('name memberId level registrationDate walletBalance totalIncome')
    .sort({ registrationDate: 1 })
    .lean();
  const result = [];
  for (const c of children) {
    result.push({
      ...c,
      id: c._id.toString(),
      children: await buildTreeNodes(c._id, maxDepth, currentDepth + 1),
    });
  }
  return result;
}

/**
 * GET /api/team/tree/:userId
 * Return nested JSON for tree. Limit to level 1 = direct children only (one level down).
 */
exports.getTree = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const requestingUser = req.user;
    if (requestingUser.role !== 'admin' && requestingUser.id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const root = await User.findById(userId).select('name memberId level registrationDate walletBalance totalIncome').lean();
    if (!root) return res.status(404).json({ success: false, message: 'User not found.' });
    const children = await buildTreeNodes(userId, 1, 0);
    const tree = {
      ...root,
      id: root._id.toString(),
      children,
    };
    res.json({ success: true, tree });
  } catch (err) {
    next(err);
  }
};

/**
 * Get direct members count and total members count (descendants) for a user
 */
exports.getTeamStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const directCount = await User.countDocuments({ parentId: userId, isActive: true });
    const user = await User.findById(userId).select('ancestors').lean();
    const allDescendants = await User.find({ ancestors: userId }).select('_id').lean();
    const totalCount = allDescendants.length;
    res.json({ success: true, directMembers: directCount, totalMembers: totalCount });
  } catch (err) {
    next(err);
  }
};
