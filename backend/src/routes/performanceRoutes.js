const express = require('express');
const { createPerformanceReview, getMyReviews, getTeamReviews } = require('../controllers/performanceController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createPerformanceReview); // Manager creates review
router.get('/my', protect, getMyReviews);
router.get('/team', protect, getTeamReviews);

module.exports = router;
