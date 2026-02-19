const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const reportsController = require('../controllers/reportsController');

// All reports accessible to HR, Admin, Owner, Director
router.get('/recruitment', protect, authorize('HR', 'ADMIN', 'OWNER', 'DIRECTOR'), reportsController.getRecruitmentReport);
router.get('/ess', protect, authorize('HR', 'ADMIN', 'OWNER', 'DIRECTOR'), reportsController.getESSReport);
router.get('/attendance', protect, authorize('HR', 'ADMIN', 'OWNER', 'DIRECTOR'), reportsController.getAttendanceReport);

// Team attendance (Manager can see their own team)
router.get('/team-attendance', protect, authorize('MANAGER', 'HR', 'ADMIN', 'OWNER', 'DIRECTOR'), reportsController.getTeamAttendanceReport);

// Individual employee report
router.get('/individual/:userId', protect, authorize('HR', 'ADMIN', 'OWNER', 'DIRECTOR'), reportsController.getIndividualReport);

// Monthly summary (annual view)
router.get('/monthly-summary', protect, authorize('HR', 'ADMIN', 'OWNER', 'DIRECTOR'), reportsController.getMonthlySummary);

module.exports = router;
