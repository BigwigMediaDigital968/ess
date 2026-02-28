const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/appraisalController');

// ── All authenticated users ───────────────────────────────────────────────────
router.get('/current', protect, ctrl.getCurrentCycle);
router.get('/annual', protect, ctrl.getAnnualSummary);
router.post('/self-assessment', protect, ctrl.submitSelfAssessment);

// ── Employee: Accept / raise concern on a goal ───────────────────────────────
router.post('/goals/:id/accept', protect, ctrl.acceptGoal);
// ── Employee: Self-review a specific goal ────────────────────────────────────
router.post('/goals/:id/self-review', protect, ctrl.submitGoalSelfReview);

// ── Manager + HR + Owner ──────────────────────────────────────────────────────
router.post('/goals', protect, authorize('MANAGER', 'HR', 'ADMIN', 'OWNER', 'DIRECTOR'), ctrl.setGoals);
router.put('/goals/:id/status', protect, authorize('MANAGER', 'HR', 'ADMIN', 'OWNER', 'DIRECTOR'), ctrl.updateGoalStatus);
// Manager rates individual goal
router.post('/goals/:id/review', protect, authorize('MANAGER', 'HR', 'ADMIN', 'OWNER', 'DIRECTOR'), ctrl.reviewGoal);
// Legacy manager review (overall)
router.post('/manager-review', protect, authorize('MANAGER', 'HR', 'ADMIN', 'OWNER', 'DIRECTOR'), ctrl.submitManagerReview);
// Team reviews — open to any user; controller scopes by actual managerId relationships
router.get('/team/:cycleId', protect, ctrl.getTeamReviews);
// Check if current user has any direct reports
router.get('/has-team', protect, ctrl.checkHasTeam);
// Get actual direct report user objects for the current manager
router.get('/team-members', protect, ctrl.getMyTeamMembers);

// ── Step 1: Manager initiates Team KRA ──────────────────────────────────────
router.post('/kra', protect, authorize('MANAGER', 'HR', 'ADMIN', 'OWNER', 'DIRECTOR'), ctrl.initiateKRA);

// ── Step 8/9: Annual console + Final rating ───────────────────────────────────
router.get('/annual-console', protect, authorize('MANAGER', 'HR', 'ADMIN', 'OWNER', 'DIRECTOR'), ctrl.getAnnualConsole);
router.post('/final-rating', protect, authorize('MANAGER', 'HR', 'ADMIN', 'OWNER', 'DIRECTOR'), ctrl.submitFinalRating);

// ── Step 12: Budget for manager's team ────────────────────────────────────────
router.get('/budget/:cycleId/my-team', protect, authorize('MANAGER', 'HR', 'ADMIN', 'OWNER', 'DIRECTOR'), ctrl.getMyTeamBudget);
router.post('/budget/distribute', protect, authorize('MANAGER', 'HR', 'ADMIN', 'OWNER', 'DIRECTOR'), ctrl.distributeBudget);

// ── HR + Owner + Admin only ───────────────────────────────────────────────────
router.get('/cycles', protect, authorize('HR', 'ADMIN', 'OWNER'), ctrl.listCycles);
router.post('/cycles', protect, authorize('HR', 'ADMIN', 'OWNER'), ctrl.createCycle);
router.put('/cycles/:id/status', protect, authorize('HR', 'ADMIN', 'OWNER'), ctrl.updateCycleStatus);
router.post('/hr-approve', protect, authorize('HR', 'ADMIN', 'OWNER'), ctrl.hrApproveAndSetHike);
router.post('/publish/:cycleId', protect, authorize('HR', 'ADMIN', 'OWNER'), ctrl.publishCycle);

// ── Step 2: KRA approval by Owner/Admin ──────────────────────────────────────
router.get('/kra/pending', protect, authorize('HR', 'ADMIN', 'OWNER'), ctrl.getPendingKRAs);
router.post('/kra/:id/approve', protect, authorize('HR', 'ADMIN', 'OWNER'), ctrl.approveKRA);

// ── Step 10: Final rating approval/revision by Owner/Admin/HR ────────────────
router.post('/final-rating/approve', protect, authorize('HR', 'ADMIN', 'OWNER'), ctrl.approveFinalRating);

// ── Step 11: Budget allocation by Owner/Admin ─────────────────────────────────
router.post('/budget', protect, authorize('ADMIN', 'OWNER'), ctrl.allocateBudget);
router.get('/budget/:cycleId', protect, authorize('HR', 'ADMIN', 'OWNER'), ctrl.listBudgets);

// ── Step 13: Generate letters & apply CTC ─────────────────────────────────────
router.post('/generate-letters/:cycleId', protect, authorize('ADMIN', 'OWNER'), ctrl.generateLetters);

module.exports = router;
