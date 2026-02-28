const express = require('express');
const router = express.Router();
const officeController = require('../controllers/officeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('HR', 'DIRECTOR', 'ADMIN', 'OWNER'), officeController.createOffice);
router.get('/', protect, officeController.getOffices);
router.put('/:id', protect, authorize('HR', 'DIRECTOR', 'ADMIN', 'OWNER'), officeController.updateOffice);
router.delete('/:id', protect, authorize('HR', 'DIRECTOR', 'ADMIN', 'OWNER'), officeController.deleteOffice);

module.exports = router;
