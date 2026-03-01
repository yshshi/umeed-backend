const express = require('express');
const { updateProfile, getUserById } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.put('/profile', updateProfile);
router.get('/:id', getUserById);

module.exports = router;
