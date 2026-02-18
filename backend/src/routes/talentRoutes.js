const express = require('express');
const router = express.Router();
const talentController = require('../controllers/talentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const mult = require('multer');
const path = require('path');

// Multer Config
const storage = mult.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/resumes/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
const upload = mult({
    storage,
    fileFilter: (req, file, cb) => {
        const extname = /\.(pdf|doc|docx)$/i.test(path.extname(file.originalname));
        const mimetype = ALLOWED_MIME_TYPES.includes(file.mimetype);
        if (extname || mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Error: Resumes Only (PDF/DOC/DOCX)!'));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Jobs
router.get('/test', (req, res) => res.json({ message: "Talent API is working" }));
router.post('/jobs', protect, authorize('HR', 'ADMIN', 'OWNER', 'MANAGER', 'DIRECTOR'), talentController.createJob);
router.get('/jobs', protect, talentController.getJobs);
router.get('/jobs/:id', protect, talentController.getJobById);
router.get('/candidates', protect, talentController.getCandidates);

// Application (Public/Private mix - usually public for candidates, but here internal portal for now or HR adding candidates)
// For this MVP, assume HR adds candidates or "Apply" is public but requires no auth? 
// The prompt says "shortlist resumes... generate online test". 
// Let's protect "apply" for now (internal application) or allow open access. 
// "create a separate app" -> likely means a separate view.
// We'll protect basic actions.

router.post('/apply', upload.single('resume'), talentController.applyToJob); // Open endpoint for candidates? Or use protect if internal. Let's keep open for simulation or protect if needed. Removing protect for easier curl test.
router.put('/applications/:id/status', protect, authorize('HR', 'ADMIN', 'OWNER', 'MANAGER'), talentController.updateApplicationStatus);

// Assessment
router.post('/assessments/generate', protect, authorize('HR', 'ADMIN', 'OWNER', 'DIRECTOR'), talentController.generateAssessment);
router.get('/assessments/:id', talentController.getAssessment); // Public/Candidate access?
router.post('/assessments/:id/submit', talentController.submitAssessment);

// Interviews
router.post('/interviews', protect, authorize('HR', 'ADMIN', 'OWNER', 'DIRECTOR'), talentController.scheduleInterview);

// Offers
router.post('/offers', protect, authorize('HR', 'ADMIN', 'OWNER', 'DIRECTOR'), talentController.generateOffer);
router.get('/offers/:applicationId', protect, talentController.getOfferByApplication);
router.put('/offers/:id/status', protect, authorize('HR', 'ADMIN', 'OWNER', 'DIRECTOR'), talentController.updateOfferStatus);

module.exports = router;
