const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const sla = require('../controllers/slaController');

router.use(protect);

router.get('/compliance', sla.getSLACompliance);
router.post('/check-breaches', sla.checkAndMarkBreaches);
router.get('/', sla.getPolicies);
router.post('/', sla.createPolicy);
router.put('/:id', sla.updatePolicy);
router.delete('/:id', sla.deletePolicy);

module.exports = router;
