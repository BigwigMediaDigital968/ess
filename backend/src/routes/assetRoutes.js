const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { protect } = require('../middleware/authMiddleware');

// All authenticated users can read (controller scopes by role)
router.use(protect);

router.get('/', assetController.getAssets);
router.post('/', assetController.createAsset);           // Admin/Owner/HR only (checked in controller)
router.put('/:id/status', assetController.updateAssetStatus);
router.delete('/:id', assetController.deleteAsset);      // Admin/Owner/HR only (checked in controller)

module.exports = router;
