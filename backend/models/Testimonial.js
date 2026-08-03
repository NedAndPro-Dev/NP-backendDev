const pool = require('../config/database');

const LIFE_MONTHS = 3;

class Testimonial {
    // Création publique : arrive en modération
    static async create({ clientName, clientEmail, comment, rating, eventId }) {
        const note = Number(rating);
        const [result] = await pool.execute(`
            INSERT INTO testimonials (client_name, client_email, comment, rating, event_id, status)
            VALUES (?, ?, ?, ?, ?, 'en_attente')
        `, [
            clientName,
            clientEmail || null,
            comment,
            Number.isInteger(note) && note >= 1 && note <= 5 ? note : null,
            eventId ? Number(eventId) : null
        ]);
        return result.insertId;
    }

    // Site public : publiés, non expirés (ou conservés), mis en avant d'abord
    static async getPublic() {
        const [rows] = await pool.execute(`
            SELECT t.id, t.client_name, t.comment, t.rating, t.is_featured, t.created_at
            FROM testimonials t
            WHERE t.status = 'publie'
              AND (t.keep_forever = TRUE OR t.created_at >= DATE_SUB(NOW(), INTERVAL ${LIFE_MONTHS} MONTH))
            ORDER BY t.is_featured DESC, t.created_at DESC
        `);
        return rows;
    }

    // Compatibilité avec l'ancien endpoint
    static async getRecent() {
        return this.getPublic();
    }

    // Liste admin : statut + recherche + tri
    static async list({ status = 'all', q = '', sort = 'recent', limit = 100, offset = 0 } = {}) {
        const where = [];
        const params = [];

        if (['en_attente', 'publie', 'masque'].includes(status)) {
            where.push('t.status = ?');
            params.push(status);
        }
        if (q) {
            where.push('(t.client_name LIKE ? OR t.comment LIKE ?)');
            params.push(`%${q}%`, `%${q}%`);
        }

        // LIMIT/OFFSET jamais en placeholders : MySQL renvoie ER_WRONG_ARGUMENTS
        const lim = Math.min(300, Math.max(1, parseInt(limit, 10) || 100));
        const off = Math.max(0, parseInt(offset, 10) || 0);
        const order = sort === 'note'
            ? 't.rating DESC, t.created_at DESC'
            : 't.created_at DESC';

        const [rows] = await pool.execute(`
            SELECT t.*,
                   e.client_name AS event_client,
                   CONCAT(
                       COALESCE((SELECT name FROM locations WHERE id = l.parent_id), ''),
                       IF(l.parent_id IS NOT NULL, ' - ', ''), l.name
                   ) AS event_location,
                   GREATEST(0, ${LIFE_MONTHS * 30} - DATEDIFF(CURDATE(), DATE(t.created_at))) AS days_left
            FROM testimonials t
            LEFT JOIN events e    ON e.id = t.event_id
            LEFT JOIN locations l ON l.id = e.location_id
            ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
            ORDER BY ${order}
            LIMIT ${lim} OFFSET ${off}
        `, params);

        return rows.map(r => ({
            ...r,
            is_featured: !!r.is_featured,
            keep_forever: !!r.keep_forever,
            days_left: Number(r.days_left)
        }));
    }

    static async counts() {
        const [rows] = await pool.execute(`
            SELECT
                COUNT(*)                    AS total,
                SUM(status = 'en_attente')  AS en_attente,
                SUM(status = 'publie')      AS publie,
                SUM(status = 'masque')      AS masque,
                ROUND(AVG(rating), 1)       AS avg_rating
            FROM testimonials
        `);
        const r = rows[0] || {};
        return {
            total: Number(r.total) || 0,
            en_attente: Number(r.en_attente) || 0,
            publie: Number(r.publie) || 0,
            masque: Number(r.masque) || 0,
            avgRating: Number(r.avg_rating) || 0
        };
    }

    static async getById(id) {
        const [rows] = await pool.execute('SELECT * FROM testimonials WHERE id = ?', [Number(id)]);
        if (!rows.length) return null;
        return { ...rows[0], is_featured: !!rows[0].is_featured, keep_forever: !!rows[0].keep_forever };
    }

    static async setStatus(id, status, adminId = null) {
        await pool.execute(`
            UPDATE testimonials
            SET status = ?, moderated_at = CURRENT_TIMESTAMP, moderated_by = ?
            WHERE id = ?
        `, [status, adminId, Number(id)]);
        return this.getById(id);
    }

    // Publie tous les témoignages en attente
    static async publishAllPending(adminId = null) {
        const [r] = await pool.execute(`
            UPDATE testimonials
            SET status = 'publie', moderated_at = CURRENT_TIMESTAMP, moderated_by = ?
            WHERE status = 'en_attente'
        `, [adminId]);
        return r.affectedRows;
    }

    // Bascule mise en avant / conservation
    static async setFlag(id, field, value) {
        if (!['is_featured', 'keep_forever'].includes(field)) throw new Error('Champ non autorisé');
        await pool.execute(`UPDATE testimonials SET ${field} = ? WHERE id = ?`, [value ? 1 : 0, Number(id)]);
        return this.getById(id);
    }

    static async delete(id) {
        const [r] = await pool.execute('DELETE FROM testimonials WHERE id = ?', [Number(id)]);
        return r.affectedRows > 0;
    }

    // Purge : ne touche ni aux conservés ni aux mis en avant
    static async deleteOld() {
        const [result] = await pool.execute(`
            DELETE FROM testimonials
            WHERE created_at < DATE_SUB(NOW(), INTERVAL ${LIFE_MONTHS} MONTH)
              AND keep_forever = FALSE
              AND is_featured = FALSE
        `);
        return result.affectedRows;
    }
}

module.exports = Testimonial;