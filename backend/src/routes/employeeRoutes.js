const express = require('express');
const {
    createEmployee, getEmployees, getEmployeeById, updateProfile, uploadDocument,
    updateEmployee, uploadEmployeeFile,
    blockUser, unblockUser, deleteEmployee,
    getDepartments, createDepartment, updateDepartment, deleteDepartment
} = require('../controllers/employeeController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Profile & Documents (self)
router.put('/profile', protect, upload.single('profilePicture'), updateProfile);
router.post('/upload', protect, upload.single('document'), uploadDocument);

// Department CRUD
router.get('/departments', protect, getDepartments);
router.post('/departments', protect, admin, createDepartment);
router.put('/departments/:id', protect, admin, updateDepartment);
router.delete('/departments/:id', protect, admin, deleteDepartment);

// Employee CRUD (admin)
router.post('/', protect, admin, createEmployee);
router.get('/', protect, getEmployees);
router.get('/:id', protect, getEmployeeById);
router.put('/:id', protect, admin, updateEmployee);
router.post('/:id/upload', protect, admin, upload.single('file'), uploadEmployeeFile);

// Block / Unblock / Delete
router.put('/:id/block', protect, admin, blockUser);
router.put('/:id/unblock', protect, admin, unblockUser);
router.delete('/:id', protect, admin, deleteEmployee);

// Off-boarding
const { offboardEmployee, reactivateEmployee } = require('../controllers/offboardingController');
router.post('/:id/offboard', protect, admin, offboardEmployee);
router.post('/:id/reactivate', protect, admin, reactivateEmployee);

module.exports = router;

