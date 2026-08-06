const prisma = require('../config/prisma');

const CATEGORIES = ['param', 'resa', 'moder', 'systeme', 'email', 'acces', 'contenu', 'users'];
const STATUSES = ['succes', 'echec', 'attention'];

/**
 * Équivalent de DATE_SUB(CURDATE(), INTERVAL n DAY) : minuit, il y a n jours.
 * Le seuil part bien du début de journée, sinon une fenêtre « 7 jours »
 * glisserait au fil des heures et le total changerait à chaque appel.
 */
const depuisNJours = (n) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - n);
    return d;
};

class AuditLog {
    static get CATEGORIES() { return CATEGORIES; }

    static async create(entry) {
        const {
            category, action, target = null, detail = null, status = 'succes', changes = null,
            userId = null, actorName = null, actorEmail = null, actorRole = null,
            ip = null, userAgent = null, method = null, path = null, httpStatus = null
        } = entry;

        const r = await prisma.auditLog.create({
            data: {
                category: CATEGORIES.includes(category) ? category : 'systeme',
                action: String(action).slice(0, 120),
                target: target ? String(target).slice(0, 190) : null,
                detail: detail ? String(detail).slice(0, 500) : null,
                status: STATUSES.includes(status) ? status : 'succes',
                changes: changes && changes.length ? changes : null,
                user_id: userId,
                actor_name: actorName,
                actor_email: actorEmail,
                actor_role: actorRole,
                ip: ip ? String(ip).slice(0, 64) : null,
                user_agent: userAgent ? String(userAgent).slice(0, 255) : null,
                method,
                path: path ? String(path).slice(0, 190) : null,
                http_status: httpStatus
            },
            select: { id: true }
        });
        return r.id;
    }

    // Liste filtrée + paginée
    static async list({ category = 'all', status = 'all', userId = null, q = '', days = 7, limit = 60, offset = 0 } = {}) {
        const d = Math.min(365, Math.max(1, parseInt(days, 10) || 7));

        const where = { created_at: { gte: depuisNJours(d - 1) } };
        if (CATEGORIES.includes(category)) where.category = category;
        if (STATUSES.includes(status)) where.status = status;
        if (userId) where.user_id = Number(userId);
        if (q) {
            const contains = { contains: q, mode: 'insensitive' };
            where.OR = [
                { action: contains }, { target: contains }, { detail: contains },
                { actor_name: contains }, { actor_email: contains }
            ];
        }

        const lim = Math.min(300, Math.max(1, parseInt(limit, 10) || 60));
        const off = Math.max(0, parseInt(offset, 10) || 0);

        const [rows, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: { user: { select: { name: true } } },
                orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
                take: lim,
                skip: off
            }),
            prisma.auditLog.count({ where })
        ]);

        return {
            items: rows.map(({ user, ...r }) => ({
                ...r,
                current_name: user ? user.name : null,
                // actor_name est figé à l'écriture ; on retombe sur le nom
                // actuel du compte, puis sur une mention explicite.
                actor_name: r.actor_name || (user && user.name) || 'Compte supprimé'
            })),
            total,
            hasMore: off + rows.length < total
        };
    }

    static async stats(days = 7) {
        const d = Math.min(365, Math.max(1, parseInt(days, 10) || 7));
        const where = { created_at: { gte: depuisNJours(d - 1) } };

        const [total, echecs, sensibles, parCategorie, lignes] = await Promise.all([
            prisma.auditLog.count({ where }),
            prisma.auditLog.count({ where: { ...where, status: 'echec' } }),
            prisma.auditLog.count({ where: { ...where, status: 'attention' } }),
            prisma.auditLog.groupBy({ by: ['category'], where, _count: { _all: true } }),
            prisma.auditLog.findMany({
                where, select: { user_id: true, actor_email: true, actor_name: true }
            })
        ]);

        // COUNT(DISTINCT COALESCE(user_id, actor_email)) : un acteur est
        // identifié par son compte, ou à défaut par son email — ce qui
        // compte aussi les actions système et les connexions refusées.
        const acteurs = new Set(
            lignes.map(r => (r.user_id !== null ? `u:${r.user_id}` : `e:${r.actor_email || ''}`))
        );

        // Regroupement par compte, nom le plus « grand » comme le faisait MAX()
        const parCompte = new Map();
        lignes.filter(r => r.user_id !== null).forEach(r => {
            const cur = parCompte.get(r.user_id) || { id: r.user_id, name: null, count: 0 };
            cur.count += 1;
            if (r.actor_name && (cur.name === null || r.actor_name > cur.name)) cur.name = r.actor_name;
            parCompte.set(r.user_id, cur);
        });

        return {
            total,
            actors: acteurs.size,
            echecs,
            sensibles,
            byCategory: parCategorie.reduce((acc, r) => ({ ...acc, [r.category]: r._count._all }), {}),
            actorList: [...parCompte.values()].sort((a, b) => b.count - a.count)
        };
    }

    static async purge(days) {
        const d = Math.min(3650, Math.max(7, parseInt(days, 10) || 90));
        const limite = new Date(Date.now() - d * 86400000);
        const r = await prisma.auditLog.deleteMany({ where: { created_at: { lt: limite } } });
        return r.count;
    }
}

module.exports = AuditLog;
