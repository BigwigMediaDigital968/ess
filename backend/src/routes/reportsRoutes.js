const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const reportsController = require('../controllers/reportsController');

// All reports accessible to HR, Admin, Owner, Director
router.get('/recruitment', protect, authorize('HR', 'ADMIN', 'OWNER', 'DIRECTOR'), reportsController.getRecruitmentReport);
router.get('/ess', protect, authorize('HR', 'ADMIN', 'OWNER', 'DIRECTOR'), reportsController.getESSReport);
router.get('/attendance', protect, authorize('HR', 'ADMIN', 'OWNER', 'DIRECTOR'), reportsController.getAttendanceReport);

module.exports = router;
