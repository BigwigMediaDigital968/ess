const express = require('express');
const { login, register, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const { updateStatus } = require('../controllers/statusController');

const router = express.Router();

router.post('/login', login);
router.post('/register', register); // Ideally protected or for initial setup
router.get('/me', protect, getMe);
router.put('/status', protect, updateStatus);

module.exports = router;
