const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboardingController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/fileUpload');

// Only HR and ADMIN can onboard
router.post('/', protect, authorize('HR', 'ADMIN', 'OWNER'), upload.fields([
    { name: 'profilePic', maxCount: 1 },
    { name: 'certBadges', maxCount: 10 },
    { name: 'expDocs', maxCount: 10 }
]), onboardingController.onboardEmployee);

module.exports = router;
