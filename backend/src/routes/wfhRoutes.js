const express = require('express');
const { requestWFHLocation, approveWFHLocation, getMyWFHLocations, getPendingWFHRequests } = require('../controllers/wfhController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, requestWFHLocation);
router.get('/my', protect, getMyWFHLocations);
router.get('/pending', protect, getPendingWFHRequests);
router.get('/approved', protect, require('../controllers/wfhController').getApprovedWFHRequests);
router.put('/:id', protect, approveWFHLocation);

module.exports = router;
