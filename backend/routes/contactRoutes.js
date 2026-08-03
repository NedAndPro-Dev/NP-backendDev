const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);   // espace admin uniquement

router.get('/', contactController.list);
router.get('/counts', contactController.counts);
router.get('/:id', contactController.getOne);
router.patch('/read-all', contactController.markAllRead);
router.patch('/:id/status', contactController.updateStatus);
router.post('/:id/reply', contactController.reply);
router.delete('/:id', contactController.remove);

module.exports = router;