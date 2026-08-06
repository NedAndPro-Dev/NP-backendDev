const prisma = require('../config/prisma');

class ContactMessage {
    // Créer un nouveau message de contact
    static async create(messageData) {
        const { name, email, phone, subject, message } = messageData;

        try {
            const created = await prisma.contactMessage.create({
                data: { name, email, phone, subject, message, status: 'nouveau' },
                select: { id: true }
            });
            return {
                id: created.id,
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
        try {
            return await prisma.contactMessage.findMany({ orderBy: { created_at: 'desc' } });
        } catch (error) {
            console.error('Erreur récupération messages:', error);
            throw error;
        }
    }

    // Récupérer un message par ID
    static async getById(id) {
        try {
            return await prisma.contactMessage.findUnique({ where: { id: Number(id) } });
        } catch (error) {
            console.error('Erreur récupération message:', error);
            throw error;
        }
    }

    // Mettre à jour le statut d'un message
    static async updateStatus(id, status) {
        try {
            await prisma.contactMessage.updateMany({
                where: { id: Number(id) }, data: { status }
            });
            return true;
        } catch (error) {
            console.error('Erreur mise à jour statut:', error);
            throw error;
        }
    }

    // Supprimer un message (optionnel)
    static async delete(id) {
        try {
            await prisma.contactMessage.deleteMany({ where: { id: Number(id) } });
            return true;
        } catch (error) {
            console.error('Erreur suppression message:', error);
            throw error;
        }
    }

    // Liste admin : filtre statut + recherche + pagination
    static async list({ status = 'all', q = '', limit = 50, offset = 0 } = {}) {
        const where = {};
        if (['nouveau', 'lu', 'traite'].includes(status)) where.status = status;
        if (q) {
            // Insensible à la casse, comme LIKE en collation utf8mb4_unicode_ci
            const contains = { contains: q, mode: 'insensitive' };
            where.OR = [
                { name: contains }, { email: contains },
                { subject: contains }, { message: contains }
            ];
        }

        const lim = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
        const off = Math.max(0, parseInt(offset, 10) || 0);

        const rows = await prisma.contactMessage.findMany({
            where,
            include: { _count: { select: { replies: true } } },
            orderBy: { created_at: 'desc' },
            take: lim,
            skip: off
        });

        // Le sous-select COUNT devient une agrégation de relation : on
        // remet la clé à plat pour ne pas exposer l'objet _count.
        return rows.map(({ _count, ...m }) => ({ ...m, replies_count: _count.replies }));
    }

    // Compteurs pour les cartes et le badge de la sidebar
    static async counts() {
        const [total, nouveau, lu, traite] = await Promise.all([
            prisma.contactMessage.count(),
            prisma.contactMessage.count({ where: { status: 'nouveau' } }),
            prisma.contactMessage.count({ where: { status: 'lu' } }),
            prisma.contactMessage.count({ where: { status: 'traite' } })
        ]);
        return { total, nouveau, lu, traite };
    }

    // Statut + horodatage associé
    static async setStatus(id, status) {
        const message = await this.getById(id);
        if (!message) return null;

        // COALESCE(read_at, CURRENT_TIMESTAMP) : le premier horodatage fait
        // foi, relire un message ne réécrit pas la date de première lecture.
        const data = { status };
        if (status === 'lu' && !message.read_at) data.read_at = new Date();
        if (status === 'traite' && !message.replied_at) data.replied_at = new Date();

        return prisma.contactMessage.update({ where: { id: Number(id) }, data });
    }

    static async markAllRead() {
        const maintenant = new Date();
        const [sansDate, avecDate] = await Promise.all([
            prisma.contactMessage.updateMany({
                where: { status: 'nouveau', read_at: null },
                data: { status: 'lu', read_at: maintenant }
            }),
            prisma.contactMessage.updateMany({
                where: { status: 'nouveau', read_at: { not: null } },
                data: { status: 'lu' }
            })
        ]);
        return sansDate.count + avecDate.count;
    }

    // Historique des réponses
    static async getReplies(messageId) {
        return prisma.messageReply.findMany({
            where: { message_id: Number(messageId) },
            orderBy: { sent_at: 'asc' }
        });
    }

    static async addReply({ messageId, adminId, adminEmail, body }) {
        const r = await prisma.messageReply.create({
            data: {
                message_id: Number(messageId),
                admin_id: adminId || null,
                admin_email: adminEmail || null,
                body
            },
            select: { id: true }
        });
        return r.id;
    }
}

module.exports = ContactMessage;
