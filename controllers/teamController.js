const User = require('../models/User');

/**
 * Map user doc to tree node: id, name, memberId, deposit, level, children.
 * deposit = depositAmount ?? walletBalance (for backward compatibility).
 */
function toTreeNode(doc) {
  const deposit = doc.depositAmount != null ? doc.depositAmount : (doc.walletBalance ?? 0);
  return {
    id: doc._id.toString(),
    name: doc.name,
    memberId: doc.memberId,
    deposit,
    level: doc.level,
    children: doc.children || [],
  };
}

/**
 * Fetch only direct referrals (Level 1) for the given userId.
 * Returns array of tree nodes with empty children (for lazy loading).
 */
async function getDirectReferrals(userId) {
  const children = await User.find({ parentId: userId, isActive: true })
    .select('name memberId level depositAmount walletBalance')
    .sort({ registrationDate: 1 })
    .lean();
  return children.map((c) => ({
    ...toTreeNode(c),
    children: [],
  }));
}

/**
 * GET /api/team/tree/:userId
 * Returns tree node for userId with direct referrals only (children loaded lazily by frontend).
 * Response: { id, name, memberId, deposit, level, children[] }
 */
exports.getTree = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const requestingUser = req.user;
    if (requestingUser.role !== 'admin' && requestingUser.id !== userId) {
      const target = await User.findById(userId).select('ancestors').lean();
      const isDescendant = target && target.ancestors && target.ancestors.some((a) => a.toString() === requestingUser.id);
      if (!isDescendant) return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const root = await User.findById(userId)
      .select('name memberId level depositAmount walletBalance')
      .lean();
    if (!root) return res.status(404).json({ success: false, message: 'User not found.' });
    const children = await getDirectReferrals(userId);
    const tree = {
      ...toTreeNode(root),
      children,
    };
    res.json({ success: true, tree });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/team/search?q=UM10001
 * Search full team (all descendants) by Member ID (case-insensitive contains).
 * Returns matches with pathIds so frontend can load path and expand to node.
 */
exports.searchByMemberId = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json({ success: true, matches: [] });
    }
    const rootId = req.user.id;
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const descendants = await User.find({
      ancestors: rootId,
      isActive: true,
      memberId: regex,
    })
      .select('name memberId level depositAmount walletBalance ancestors')
      .lean();

    const matches = [];
    const rootIdStr = rootId.toString();
    for (const doc of descendants) {
      const deposit = doc.depositAmount != null ? doc.depositAmount : (doc.walletBalance ?? 0);
      const ancestorIds = (doc.ancestors || []).map((a) => a.toString()).filter((id) => id !== rootIdStr);
      const pathIds = [rootIdStr, ...ancestorIds, doc._id.toString()];
      matches.push({
        id: doc._id.toString(),
        name: doc.name,
        memberId: doc.memberId,
        deposit,
        level: doc.level,
        pathIds,
      });
    }
    res.json({ success: true, matches });
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
