const db = require('../config/database');

class ContactMessage {
    // Créer un nouveau message de contact
    static async create(messageData) {
        const { name, email, phone, subject, message } = messageData;

        const query = `
            INSERT INTO contact_messages (name, email, phone, subject, message, status)
            VALUES (?, ?, ?, ?, ?, 'nouveau')
        `;

        try {
            const [result] = await db.execute(query, [name, email, phone, subject, message]);
            return {
                id: result.insertId,
                ...messageData,
                status: 'nouveau',
                created_at: new Date()
            };
        } catch (error) {
            console.error('Erreur création message contact:', error);
            throw error;
        }
    }

    // Récupérer tous les messages (pour l'admin plus tard)
    static async getAll() {
        const query = `
            SELECT * FROM contact_messages
            ORDER BY created_at DESC
        `;

        try {
            const [rows] = await db.execute(query);
            return rows;
        } catch (error) {
            console.error('Erreur récupération messages:', error);
            throw error;
        }
    }

    // Récupérer un message par ID
    static async getById(id) {
        const query = `SELECT * FROM contact_messages WHERE id = ?`;

        try {
            const [rows] = await db.execute(query, [id]);
            return rows[0] || null;
        } catch (error) {
            console.error('Erreur récupération message:', error);
            throw error;
        }
    }

    // Mettre à jour le statut d'un message
    static async updateStatus(id, status) {
        const query = `
            UPDATE contact_messages
            SET status = ?
            WHERE id = ?
        `;

        try {
            await db.execute(query, [status, id]);
            return true;
        } catch (error) {
            console.error('Erreur mise à jour statut:', error);
            throw error;
        }
    }

    // Supprimer un message (optionnel)
    static async delete(id) {
        const query = `DELETE FROM contact_messages WHERE id = ?`;

        try {
            await db.execute(query, [id]);
            return true;
        } catch (error) {
            console.error('Erreur suppression message:', error);
            throw error;
        }
    }

    // Liste admin : filtre statut + recherche + pagination
    static async list({ status = 'all', q = '', limit = 50, offset = 0 } = {}) {
        const where = [];
        const params = [];

        if (['nouveau', 'lu', 'traite'].includes(status)) {
            where.push('m.status = ?');
            params.push(status);
        }
        if (q) {
            where.push('(m.name LIKE ? OR m.email LIKE ? OR m.subject LIKE ? OR m.message LIKE ?)');
            const like = `%${q}%`;
            params.push(like, like, like, like);
        }

        // MySQL refuse les placeholders sur LIMIT/OFFSET dans une requête préparée
        // (ER_WRONG_ARGUMENTS) : on borne les valeurs et on les injecte comme entiers.
        const lim = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
        const off = Math.max(0, parseInt(offset, 10) || 0);

        const query = `
            SELECT m.*,
                   (SELECT COUNT(*) FROM message_replies r WHERE r.message_id = m.id) AS replies_count
            FROM contact_messages m
            ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
            ORDER BY m.created_at DESC
            LIMIT ${lim} OFFSET ${off}
        `;
        const [rows] = await db.execute(query, params);
        return rows;
    }

    // Compteurs pour les cartes et le badge de la sidebar
    static async counts() {
        const [rows] = await db.execute(`
            SELECT
                COUNT(*)                     AS total,
                SUM(status = 'nouveau')      AS nouveau,
                SUM(status = 'lu')           AS lu,
                SUM(status = 'traite')       AS traite
            FROM contact_messages
        `);
        const r = rows[0] || {};
        return {
            total: Number(r.total) || 0,
            nouveau: Number(r.nouveau) || 0,
            lu: Number(r.lu) || 0,
            traite: Number(r.traite) || 0
        };
    }

    // Statut + horodatage associé
    static async setStatus(id, status) {
        const stamp = status === 'lu' ? ', read_at = COALESCE(read_at, CURRENT_TIMESTAMP)'
                    : status === 'traite' ? ', replied_at = COALESCE(replied_at, CURRENT_TIMESTAMP)'
                    : '';
        await db.execute(`UPDATE contact_messages SET status = ?${stamp} WHERE id = ?`, [status, id]);
        return this.getById(id);
    }

    static async markAllRead() {
        const [r] = await db.execute(`
            UPDATE contact_messages
            SET status = 'lu', read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
            WHERE status = 'nouveau'
        `);
        return r.affectedRows;
    }

    // Historique des réponses
    static async getReplies(messageId) {
        const [rows] = await db.execute(
            'SELECT * FROM message_replies WHERE message_id = ? ORDER BY sent_at ASC', [messageId]);
        return rows;
    }

    static async addReply({ messageId, adminId, adminEmail, body }) {
        const [r] = await db.execute(`
            INSERT INTO message_replies (message_id, admin_id, admin_email, body)
            VALUES (?, ?, ?, ?)
        `, [messageId, adminId || null, adminEmail || null, body]);
        return r.insertId;
    }
}

module.exports = ContactMessage;