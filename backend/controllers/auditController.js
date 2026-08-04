const AuditLog = require('../models/AuditLog');
const Setting = require('../models/Setting');

exports.list = async (req, res) => {
    try {
        const { category = 'all', status = 'all', userId, q = '', days = 7, limit = 60, offset = 0 } = req.query;
        const data = await AuditLog.list({ category, status, userId, q, days, limit, offset });
        res.json({ ...data, retentionDays: Number(await Setting.get('log_retention_days', 90)) });
    } catch (error) {
        console.error('Erreur liste audit:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.stats = async (req, res) => {
    try { res.json(await AuditLog.stats(req.query.days || 7)); }
    catch (error) { console.error('Erreur stats audit:', error); res.status(500).json({ message: 'Erreur serveur' }); }
};

// GET /api/audit/export?days=30 — CSV pour archivage
exports.exportCsv = async (req, res) => {
    try {
        const { items } = await AuditLog.list({
            days: req.query.days || 30, category: req.query.category || 'all', limit: 300
        });

        const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const head = ['Horodatage', 'Catégorie', 'Action', 'Cible', 'Détail', 'Résultat', 'Acteur', 'Email', 'Rôle', 'IP', 'Modifications'];
        const lines = items.map(r => [
            new Date(r.created_at).toISOString(),
            r.category, r.action, r.target, r.detail, r.status,
            r.actor_name, r.actor_email, r.actor_role, r.ip,
            (r.changes || []).map(c => `${c.key}: ${c.before} -> ${c.after}`).join(' | ')
        ].map(esc).join(';'));

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition',
            `attachment; filename="netandpro-audit-${new Date().toISOString().slice(0, 10)}.csv"`);
        res.send('\ufeff' + [head.map(esc).join(';'), ...lines].join('\r\n'));
    } catch (error) {
        console.error('Erreur export audit:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};