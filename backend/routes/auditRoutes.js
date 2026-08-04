const express = require('express');
const router = express.Router();
const c = require('../controllers/auditController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireSuperAdmin } = require('../middleware/roleMiddleware');

// Le journal d'audit est réservé au super administrateur
router.use(authMiddleware, requireSuperAdmin);

router.get('/', c.list);
router.get('/stats', c.stats);
router.get('/export', c.exportCsv);

module.exports = router;