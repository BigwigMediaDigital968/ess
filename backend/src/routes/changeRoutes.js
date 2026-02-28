const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const cc = require('../controllers/changeController');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.get('/', cc.getChanges);
router.get('/:id', cc.getChangeById);
router.get('/:id/pdf', cc.exportChangePDF);
router.post('/', upload.array('attachments', 10), cc.createChangeRequest);
router.put('/:id', upload.array('attachments', 10), cc.updateChange);
router.post('/:id/approve', cc.approveChange);
router.post('/:id/comments', cc.addChangeComment);
router.post('/:id/link-ci', cc.linkCI);

module.exports = router;
