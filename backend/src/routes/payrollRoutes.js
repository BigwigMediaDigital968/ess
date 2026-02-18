const express = require('express');
const { generatePayroll, getMyPayroll } = require('../controllers/payrollController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/generate', protect, admin, generatePayroll);
router.get('/my', protect, getMyPayroll);

module.exports = router;
