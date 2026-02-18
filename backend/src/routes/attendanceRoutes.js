const express = require('express');
const { markAttendance, clockOut, getMyAttendance } = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/mark', protect, markAttendance);
router.put('/clockout', protect, clockOut);
router.get('/my', protect, getMyAttendance);

module.exports = router;
