const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonialController');
const authMiddleware = require('../middleware/authMiddleware');

// Public
router.get('/', testimonialController.getRecentTestimonials);
router.post('/', testimonialController.createTestimonial);

// Admin — les routes littérales avant /:id
router.get('/admin', authMiddleware, testimonialController.list);
router.get('/admin/counts', authMiddleware, testimonialController.counts);
router.patch('/admin/publish-all', authMiddleware, testimonialController.publishAll);
router.post('/admin/clean', authMiddleware, testimonialController.cleanOldTestimonials);
router.patch('/:id/status', authMiddleware, testimonialController.updateStatus);
router.patch('/:id/flag', authMiddleware, testimonialController.setFlag);
router.delete('/:id', authMiddleware, testimonialController.remove);

module.exports = router;