const express = require('express');
const { getTree, getTeamStats, searchByMemberId } = require('../controllers/teamController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/search', searchByMemberId);
router.get('/tree/:userId', getTree);
router.get('/stats', getTeamStats);

module.exports = router;
