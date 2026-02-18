const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getStats, getSignInStats } = require('../controllers/dashboardController');

router.get('/stats', protect, getStats);
router.get('/sign-in-stats', protect, authorize('HR', 'ADMIN', 'OWNER', 'DIRECTOR', 'MANAGER'), getSignInStats);

module.exports = router;

