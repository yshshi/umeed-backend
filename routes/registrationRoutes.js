const express = require('express');
const { registerUnderUser } = require('../controllers/registrationController');
const { protect } = require('../middleware/auth');
const { validateRegister } = require('../middleware/validate');

const router = express.Router();

router.use(protect);
router.post('/', validateRegister, registerUnderUser);

module.exports = router;
