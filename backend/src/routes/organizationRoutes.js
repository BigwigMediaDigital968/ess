const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use((req, res, next) => {
    // console.log('Organization Route Hit:', req.path);
    next();
});

router.get('/public', organizationController.getPublicOrganization);
router.get('/departments', protect, organizationController.getDepartments);
router.get('/', protect, organizationController.getOrganization);
router.put('/', protect, authorize('ADMIN', 'HR', 'EXECUTIVE', 'OWNER'), organizationController.updateOrganization);
router.post('/login-background', protect, authorize('ADMIN', 'HR', 'EXECUTIVE', 'OWNER'), organizationController.uploadLoginBackground);

module.exports = router;
