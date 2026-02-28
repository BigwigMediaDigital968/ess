const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/offboardingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, ctrl.createOffboarding);               // Self or HR initiate
router.get('/my', protect, ctrl.getMyOffboarding);               // Employee own status
router.get('/team', protect, ctrl.getTeamOffboarding);           // Manager / HR view
router.patch('/:id/step', protect, ctrl.updateStep);             // Approve a step
router.delete('/:id', protect, ctrl.cancelOffboarding);          // Cancel / withdraw

module.exports = router;
