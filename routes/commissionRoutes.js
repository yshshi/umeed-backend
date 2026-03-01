const express = require('express');
const { getMyCommissions } = require('../controllers/commissionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/', getMyCommissions);

module.exports = router;
