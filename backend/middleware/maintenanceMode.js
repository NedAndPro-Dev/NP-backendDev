const jwt = require('jsonwebtoken');
const Setting = require('../models/Setting');

// Bloque les écritures publiques quand le mode maintenance est actif.
// Les routes d'authentification, d'utilisateurs et de paramètres restent
// ouvertes pour que l'admin puisse désactiver le mode.
const EXEMPT = ['/api/auth', '/api/users', '/api/settings', '/api/health'];

// Un jeton valide fait passer ; la simple présence d'un en-tête ne suffit pas.
const isAdmin = (req) => {
    const raw = req.headers.authorization || '';
    const token = raw.startsWith('Bearer ') ? raw.slice(7) : null;
    if (!token) return false;
    try {
        jwt.verify(token, process.env.JWT_SECRET);
        return true;
    } catch {
        return false;
    }
};

const maintenanceMode = async (req, res, next) => {
    if (EXEMPT.some(p => req.path.startsWith(p))) return next();

    try {
        const on = await Setting.get('maintenance_mode', false);
        if (!on) return next();
        if (isAdmin(req)) return next();

        // Les lectures restent servies : le site affiche l'écran de maintenance
        if (req.method === 'GET') return next();

        const message = await Setting.get('maintenance_message', 'Site en maintenance.');
        return res.status(503).json({ success: false, maintenance: true, message });
    } catch {
        next();
    }
};

module.exports = maintenanceMode;