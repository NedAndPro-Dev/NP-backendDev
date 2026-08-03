const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, statsController.getStats);
router.get('/overview', authMiddleware, statsController.getOverview);

module.exports = router;