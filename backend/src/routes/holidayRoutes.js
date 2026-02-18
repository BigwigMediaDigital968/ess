const express = require('express');
const router = express.Router();
const holidayController = require('../controllers/holidayController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, holidayController.getHolidays);
router.post('/sync', protect, authorize('ADMIN', 'HR'), holidayController.syncHolidays);
router.post('/', protect, authorize('ADMIN', 'HR'), holidayController.createHoliday);
router.delete('/:id', protect, authorize('ADMIN', 'HR'), holidayController.deleteHoliday);

module.exports = router;
