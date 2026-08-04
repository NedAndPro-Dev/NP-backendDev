const pool = require('../config/database');

const CATEGORIES = ['param', 'resa', 'moder', 'systeme', 'email', 'acces', 'contenu', 'users'];

class AuditLog {
    static get CATEGORIES() { return CATEGORIES; }

    static async create(entry) {
        const {
            category, action, target = null, detail = null, status = 'succes', changes = null,
            userId = null, actorName = null, actorEmail = null, actorRole = null,
            ip = null, userAgent = null, method = null, path = null, httpStatus = null
        } = entry;

        const [r] = await pool.execute(`
            INSERT INTO audit_log
                (category, action, target, detail, status, changes, user_id,
                 actor_name, actor_email, actor_role, ip, user_agent, method, path, http_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            CATEGORIES.includes(category) ? category : 'systeme',
            String(action).slice(0, 120),
            target ? String(target).slice(0, 190) : null,
            detail ? String(detail).slice(0, 500) : null,
            ['succes', 'echec', 'attention'].includes(status) ? status : 'succes',
            changes && changes.length ? JSON.stringify(changes) : null,
            userId, actorName, actorEmail, actorRole,
            ip ? String(ip).slice(0, 64) : null,
            userAgent ? String(userAgent).slice(0, 255) : null,
            method, path ? String(path).slice(0, 190) : null, httpStatus
        ]);
        return r.insertId;
    }

    // Liste filtrée + paginée
    static async list({ category = 'all', status = 'all', userId = null, q = '', days = 7, limit = 60, offset = 0 } = {}) {
        const where = [];
        const params = [];

        const d = Math.min(365, Math.max(1, parseInt(days, 10) || 7));
        where.push('a.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)');
        params.push(d - 1);

        if (CATEGORIES.includes(category)) { where.push('a.category = ?'); params.push(category); }
        if (['succes', 'echec', 'attention'].includes(status)) { where.push('a.status = ?'); params.push(status); }
        if (userId) { where.push('a.user_id = ?'); params.push(Number(userId)); }
        if (q) {
            where.push('(a.action LIKE ? OR a.target LIKE ? OR a.detail LIKE ? OR a.actor_name LIKE ? OR a.actor_email LIKE ?)');
            const like = `%${q}%`;
            params.push(like, like, like, like, like);
        }

        // LIMIT/OFFSET jamais en placeholders : MySQL renvoie ER_WRONG_ARGUMENTS
        const lim = Math.min(300, Math.max(1, parseInt(limit, 10) || 60));
        const off = Math.max(0, parseInt(offset, 10) || 0);
        const clause = 'WHERE ' + where.join(' AND ');

        const [rows] = await pool.execute(`
            SELECT a.*, u.name AS current_name
            FROM audit_log a LEFT JOIN users u ON u.id = a.user_id
            ${clause}
            ORDER BY a.created_at DESC, a.id DESC
            LIMIT ${lim} OFFSET ${off}
        `, params);

        const [[{ n }]] = await pool.execute(`SELECT COUNT(*) AS n FROM audit_log a ${clause}`, params);

        return {
            items: rows.map(r => ({
                ...r,
                changes: typeof r.changes === 'string' ? JSON.parse(r.changes || 'null') : r.changes,
                actor_name: r.actor_name || r.current_name || 'Compte supprimé'
            })),
            total: Number(n),
            hasMore: off + rows.length < Number(n)
        };
    }

    static async stats(days = 7) {
        const d = Math.min(365, Math.max(1, parseInt(days, 10) || 7));
        const [[row]] = await pool.execute(`
            SELECT COUNT(*) AS total,
                   COUNT(DISTINCT COALESCE(a.user_id, a.actor_email)) AS actors,
                   SUM(a.status = 'echec')     AS echecs,
                   SUM(a.status = 'attention') AS sensibles
            FROM audit_log a
            WHERE a.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        `, [d - 1]);

        const [byCat] = await pool.execute(`
            SELECT category, COUNT(*) AS n FROM audit_log
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY category
        `, [d - 1]);

        const [actors] = await pool.execute(`
            SELECT a.user_id, MAX(a.actor_name) AS name, COUNT(*) AS n
            FROM audit_log a
            WHERE a.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND a.user_id IS NOT NULL
            GROUP BY a.user_id ORDER BY n DESC
        `, [d - 1]);

        return {
            total: Number(row.total) || 0,
            actors: Number(row.actors) || 0,
            echecs: Number(row.echecs) || 0,
            sensibles: Number(row.sensibles) || 0,
            byCategory: byCat.reduce((acc, r) => ({ ...acc, [r.category]: Number(r.n) }), {}),
            actorList: actors.map(a => ({ id: a.user_id, name: a.name, count: Number(a.n) }))
        };
    }

    static async purge(days) {
        const d = Math.min(3650, Math.max(7, parseInt(days, 10) || 90));
        const [r] = await pool.execute(
            'DELETE FROM audit_log WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)', [d]
        );
        return r.affectedRows;
    }
}

module.exports = AuditLog;