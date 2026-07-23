const rateLimit = require('express-rate-limit');

// Rate limiter pour login (10 tentatives par 15 minutes)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 tentatives max
    message: {
        success: false,
        message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter pour contact (3 messages par heure par IP)
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 10, // 3 messages max par heure
    message: {
        success: false,
        message: 'Vous avez atteint la limite de messages. Réessayez dans 1 heure.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Personnalisation du message pour l'utilisateur
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Trop de messages envoyés. Veuillez patienter avant de réessayer.',
            retryAfter: '1 heure'
        });
    }
});

module.exports = { loginLimiter, contactLimiter };