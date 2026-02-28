const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const tc = require('../controllers/ticketController');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.get('/mine', tc.getMyTickets);
router.get('/stats', tc.getDashboardStats);
router.get('/', tc.getTickets);
router.get('/:id', tc.getTicketById);
router.post('/', upload.array('attachments', 5), tc.createTicket);
router.put('/:id', tc.updateTicket);
router.post('/:id/comments', upload.array('attachments', 5), tc.addComment);

module.exports = router;
