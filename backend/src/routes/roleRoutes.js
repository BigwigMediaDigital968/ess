const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Roles
router.get('/', protect, roleController.getRoles);
router.post('/', protect, authorize('ADMIN'), roleController.createRole);
router.put('/:id', protect, authorize('ADMIN'), roleController.updateRole);
router.delete('/:id', protect, authorize('ADMIN'), roleController.deleteRole);

// Bands
router.get('/bands', protect, roleController.getBands);
router.post('/bands', protect, authorize('ADMIN'), roleController.createBand);
router.put('/bands/:id', protect, authorize('ADMIN'), roleController.updateBand);
router.delete('/bands/:id', protect, authorize('ADMIN'), roleController.deleteBand);

module.exports = router;
