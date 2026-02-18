const express = require('express');
const { applyLeave, updateLeaveStatus, getMyLeaves, getPendingLeaves } = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, applyLeave);
router.get('/my', protect, getMyLeaves);
router.get('/pending', protect, getPendingLeaves); // For managers
router.get('/stats', protect, require('../controllers/leaveController').getLeaveStats); // New Stats
router.get('/approved', protect, require('../controllers/leaveController').getApprovedLeaves); // Public/Calendar
router.put('/:id', protect, updateLeaveStatus);

module.exports = router;
