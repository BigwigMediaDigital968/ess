const express = require('express');
const { getConversations, getMessages, createConversation, uploadFile } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/conversations', protect, getConversations);
router.post('/conversations', protect, createConversation);
router.get('/conversations/:conversationId/messages', protect, getMessages);
router.post('/upload', protect, upload.single('file'), uploadFile);

module.exports = router;
