const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const cmdb = require('../controllers/cmdbController');

router.use(protect);

router.get('/', cmdb.getCIs);
router.get('/:id', cmdb.getCIById);
router.post('/', cmdb.createCI);
router.put('/:id', cmdb.updateCI);
router.delete('/:id', cmdb.deleteCI);
router.post('/:id/relationships', cmdb.addRelationship);
router.delete('/relationships/:id', cmdb.deleteRelationship);

module.exports = router;
