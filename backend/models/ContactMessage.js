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
}

module.exports = ContactMessage;