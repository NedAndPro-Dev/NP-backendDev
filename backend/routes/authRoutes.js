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

// Réinitialisation par code à 6 chiffres (mot de passe oublié / expiré)
router.post('/password/request-code', loginLimiter, authController.requestResetCode);
router.post('/password/verify-code', authController.verifyResetCode);
router.post('/password/reset', authController.resetPassword);

module.exports = router;