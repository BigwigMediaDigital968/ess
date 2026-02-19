const express = require('express');
const { createEmployee, getEmployees, getEmployeeById, updateProfile, uploadDocument } = require('../controllers/employeeController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.put('/profile', protect, upload.single('profilePicture'), updateProfile);
router.post('/upload', protect, upload.single('document'), uploadDocument);

router.post('/', protect, admin, createEmployee);
router.get('/', protect, getEmployees);
router.get('/:id', protect, getEmployeeById);
router.put('/:id', protect, admin, require('../controllers/employeeController').updateEmployee);

router.post('/:id/upload', protect, admin, upload.single('file'), require('../controllers/employeeController').uploadEmployeeFile);

// Off-boarding
const { offboardEmployee, reactivateEmployee } = require('../controllers/offboardingController');
router.post('/:id/offboard', protect, admin, offboardEmployee);
router.post('/:id/reactivate', protect, admin, reactivateEmployee);

module.exports = router;
