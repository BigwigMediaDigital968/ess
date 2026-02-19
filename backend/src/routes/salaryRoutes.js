const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');
const salarySlipController = require('../controllers/salarySlipController');
const { protect, authorize } = require('../middleware/authMiddleware');

// HR, Director, and Owner can manage salary structures
router.post('/structure', protect, authorize('HR', 'ADMIN', 'OWNER', 'DIRECTOR'), salaryController.upsertSalaryStructure);
router.get('/structure/:userId', protect, authorize('HR', 'ADMIN', 'OWNER', 'DIRECTOR'), salaryController.getSalaryStructure);
router.get('/all', protect, authorize('HR', 'ADMIN', 'OWNER', 'DIRECTOR'), salaryController.getAllEmployeeSalaries);
router.get('/preview/:userId', protect, authorize('HR', 'ADMIN', 'OWNER', 'DIRECTOR'), salaryController.computeSalaryPreview);

// Payroll generation and records
router.post('/payroll/generate', protect, authorize('HR', 'ADMIN', 'OWNER', 'DIRECTOR'), salaryController.generatePayrollForEmployee);
router.get('/payroll/my', protect, salaryController.getMyPayrollRecords);
router.get('/payroll/:userId', protect, authorize('HR', 'ADMIN', 'OWNER', 'DIRECTOR'), salaryController.getPayrollRecords);

// ─── Salary Slip (PDF data + chat delivery) ───────────────────────────────────
router.get('/slip-data', protect, salarySlipController.getSalarySlipData);
router.post('/slip-send', protect, salarySlipController.sendSalarySlipToChat);

module.exports = router;

