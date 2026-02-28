const express = require('express');
const { login, register, getMe, changePassword, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const { updateStatus } = require('../controllers/statusController');

const router = express.Router();

router.post('/login', login);
router.post('/register', register); // Ideally protected or for initial setup
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/me', protect, getMe);
router.put('/status', protect, updateStatus);
router.post('/change-password', protect, changePassword);

module.exports = router;
