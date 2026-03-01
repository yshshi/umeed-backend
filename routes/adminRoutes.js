const express = require('express');
const { getAllUsers, toggleUserActive, getStats } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect, adminOnly);
router.get('/users', getAllUsers);
router.put('/users/:id/active', toggleUserActive);
router.get('/stats', getStats);

module.exports = router;
