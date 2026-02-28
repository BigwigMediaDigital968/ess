const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const pc = require('../controllers/problemController');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.get('/', pc.getProblems);
router.get('/:id', pc.getProblemById);
router.post('/', upload.array('attachments', 10), pc.createProblem);
router.put('/:id', upload.array('attachments', 10), pc.updateProblem);
router.post('/:id/link-incident', pc.linkIncident);
router.post('/:id/convert-to-known-error', pc.convertToKnownError);

module.exports = router;
