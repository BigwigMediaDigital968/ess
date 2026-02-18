const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/appraisalController');

// All authenticated users
router.get('/current', protect, ctrl.getCurrentCycle);
router.get('/annual', protect, ctrl.getAnnualSummary);
router.post('/self-assessment', protect, ctrl.submitSelfAssessment);

// Manager + HR + Owner
router.post('/goals', protect, authorize('MANAGER', 'HR', 'ADMIN', 'OWNER', 'DIRECTOR'), ctrl.setGoals);
router.put('/goals/:id/status', protect, authorize('MANAGER', 'HR', 'ADMIN', 'OWNER', 'DIRECTOR'), ctrl.updateGoalStatus);
router.post('/manager-review', protect, authorize('MANAGER', 'HR', 'ADMIN', 'OWNER', 'DIRECTOR'), ctrl.submitManagerReview);
router.get('/team/:cycleId', protect, authorize('MANAGER', 'HR', 'ADMIN', 'OWNER', 'DIRECTOR'), ctrl.getTeamReviews);

// HR + Owner only
router.get('/cycles', protect, authorize('HR', 'ADMIN', 'OWNER'), ctrl.listCycles);
router.put('/cycles/:id/status', protect, authorize('HR', 'ADMIN', 'OWNER'), ctrl.updateCycleStatus);
router.post('/hr-approve', protect, authorize('HR', 'ADMIN', 'OWNER'), ctrl.hrApproveAndSetHike);
router.post('/publish/:cycleId', protect, authorize('HR', 'ADMIN', 'OWNER'), ctrl.publishCycle);

module.exports = router;
