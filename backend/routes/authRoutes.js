const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { loginLimiter } = require('../middleware/rateLimiter');

// Connexion (avec rate limiting)
router.post('/login', loginLimiter, authController.login);

// Changer mot de passe (protégé)
router.post('/change-password', authMiddleware, authController.changePassword);

// Vérifier token (protégé)
router.get('/verify', authMiddleware, authController.verifyToken);

module.exports = router;