/**
 * Contrôle d'accès par rôle.
 *
 * S'appuie sur req.user, renseigné par authMiddleware à partir du token.
 * Le rôle doit donc être signé dans le JWT à la connexion : un token
 * émis sans champ `role` fera échouer tous ces gardes.
 *
 * À monter systématiquement APRÈS authMiddleware.
 */

// Réservé aux super admins
const requireSuperAdmin = (req, res, next) => {
    if (req.user?.role !== 'super_admin') {
        return res.status(403).json({
            success: false,
            message: 'Action réservée aux super admins'
        });
    }
    next();
};

module.exports = { requireSuperAdmin };
