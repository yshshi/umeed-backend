const express = require('express');
const { getAllUsers, toggleUserActive, getStats, addDeposit, updateTotalAmount } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect, adminOnly);
router.get('/users', getAllUsers);
router.put('/users/:id/active', toggleUserActive);
router.post('/users/:id/deposit', addDeposit);
router.put('/users/:id/total-amount', updateTotalAmount);
router.get('/stats', getStats);

module.exports = router;
