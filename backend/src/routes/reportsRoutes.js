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

// PDF Export - generates a branded PDF for any report type
router.get('/export-pdf', protect, authorize('HR', 'ADMIN', 'OWNER', 'DIRECTOR'), reportsController.exportReportPDF);

// Asset report
router.get('/assets', protect, authorize('HR', 'ADMIN', 'OWNER', 'DIRECTOR'), reportsController.getAssetsReport);

// Leave report
router.get('/leaves', protect, authorize('HR', 'ADMIN', 'OWNER', 'DIRECTOR'), reportsController.getLeavesReport);

// Service Desk report
router.get('/servicedesk', protect, authorize('HR', 'ADMIN', 'OWNER', 'DIRECTOR', 'SD_ADMIN', 'SD_MANAGER'), reportsController.getServiceDeskReport);

module.exports = router;
