const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonialController');

// Routes publiques
router.post('/', testimonialController.createTestimonial);
router.get('/recent', testimonialController.getRecentTestimonials);

// Route de nettoyage (peut être appelée par un cron job)
router.delete('/cleanup', testimonialController.cleanOldTestimonials);

module.exports = router;