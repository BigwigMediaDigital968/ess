const express = require('express');
const router = express.Router();
const officeVisitController = require('../controllers/officeVisitController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, officeVisitController.createVisitRequest);
router.get('/my-requests', protect, officeVisitController.getMyVisitRequests);
router.get('/pending', protect, authorize('MANAGER', 'HR', 'ADMIN', 'OWNER', 'DIRECTOR'), officeVisitController.getPendingRequests);
router.put('/:id/status', protect, authorize('MANAGER', 'HR', 'ADMIN', 'OWNER', 'DIRECTOR'), officeVisitController.updateVisitRequestStatus);

module.exports = router;
