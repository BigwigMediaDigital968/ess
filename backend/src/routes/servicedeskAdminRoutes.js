const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const admin = require('../controllers/servicedeskAdminController');

router.use(protect);

// Teams
router.get('/teams', admin.getTeams);
router.post('/teams', admin.createTeam);
router.put('/teams/:id', admin.updateTeam);
router.delete('/teams/:id', admin.deleteTeam);

// Categories
router.get('/categories', admin.getCategories);
router.post('/categories', admin.createCategory);
router.put('/categories/:id', admin.updateCategory);
router.delete('/categories/:id', admin.deleteCategory);

module.exports = router;
