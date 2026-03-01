const express = require('express');
const { getTree, getTeamStats } = require('../controllers/teamController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/tree/:userId', getTree);
router.get('/stats', getTeamStats);

module.exports = router;
