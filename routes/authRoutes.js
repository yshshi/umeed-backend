const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validate');
const rateLimiter = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register', rateLimiter, validateRegister, register);
router.post('/login', rateLimiter, validateLogin, login);
router.get('/me', protect, getMe);

module.exports = router;
