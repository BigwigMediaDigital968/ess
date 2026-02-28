const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const kedb = require('../controllers/kedbController');

router.use(protect);

router.get('/', kedb.getEntries);
router.get('/:id', kedb.getEntryById);
router.post('/', kedb.createEntry);
router.put('/:id', kedb.updateEntry);
router.delete('/:id', kedb.deleteEntry);

module.exports = router;
