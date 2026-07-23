const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { contactLimiter } = require('../middleware/rateLimiter');

// Envoyer un message de contact (avec rate limiting : 3 messages/heure)
router.post('/contact', contactLimiter, emailController.sendContactMessage);

// Tester la configuration email (optionnel, pour debug)
router.get('/test', emailController.testEmailConfig);

module.exports = router;