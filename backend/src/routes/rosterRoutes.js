const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const rc = require('../controllers/rosterController');

// ─── Shifts (Manager, HR, Admin can create) ──────────────────────────────────
router.get('/shifts', protect, rc.getShifts);
router.post('/shifts', protect, authorize('MANAGER', 'HR', 'ADMIN', 'OWNER', 'DIRECTOR'), rc.createShift);
router.put('/shifts/:id', protect, authorize('MANAGER', 'HR', 'ADMIN', 'OWNER', 'DIRECTOR'), rc.updateShift);
router.delete('/shifts/:id', protect, authorize('HR', 'ADMIN', 'OWNER', 'DIRECTOR'), rc.deleteShift);

// ─── Roster ──────────────────────────────────────────────────────────────────
router.post('/assign', protect, authorize('MANAGER', 'HR', 'ADMIN', 'OWNER', 'DIRECTOR'), rc.assignRoster);
router.post('/bulk-assign', protect, authorize('MANAGER', 'HR', 'ADMIN', 'OWNER', 'DIRECTOR'), rc.bulkAssignRoster);
router.get('/team', protect, authorize('MANAGER', 'HR', 'ADMIN', 'OWNER', 'DIRECTOR'), rc.getTeamRoster);
router.get('/my', protect, rc.getMyRoster);
router.delete('/:id', protect, authorize('MANAGER', 'HR', 'ADMIN', 'OWNER', 'DIRECTOR'), rc.deleteRoster);

module.exports = router;
