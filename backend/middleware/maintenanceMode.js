const Setting = require('../models/Setting');

// Bloque les écritures publiques quand le mode maintenance est actif.
// Les routes /api/auth, /api/users et /api/settings restent ouvertes
// pour que l'admin puisse désactiver le mode.
const EXEMPT = ['/api/auth', '/api/users', '/api/settings', '/api/health'];

const maintenanceMode = async (req, res, next) => {
    if (EXEMPT.some(p => req.path.startsWith(p))) return next();
    if (req.method === 'GET') return next();

    try {
        const on = await Setting.get('maintenance_mode', false);
        if (!on) return next();
        // Un admin authentifié n'est pas bloqué
        if (req.headers.authorization) return next();

        const message = await Setting.get('maintenance_message', 'Site en maintenance.');
        return res.status(503).json({ success: false, maintenance: true, message });
    } catch {
        next();
    }
};

module.exports = maintenanceMode;