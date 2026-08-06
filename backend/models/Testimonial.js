const prisma = require('../config/prisma');

const LIFE_MONTHS = 3;

const dateLimite = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - LIFE_MONTHS);
    return d;
};

// Reproduit le CONCAT SQL de la salle : « Site - Salle », ou « Site » seul.
const nomLieu = (location) => {
    if (!location) return null;
    return location.parent ? `${location.parent.name} - ${location.name}` : location.name;
};

// GREATEST(0, 90 - DATEDIFF(CURDATE(), DATE(created_at)))
const joursRestants = (created_at) => {
    if (!created_at) return LIFE_MONTHS * 30;
    const d = new Date(created_at);
    const cree = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const ecoules = Math.round((today - cree) / 86400000);
    return Math.max(0, LIFE_MONTHS * 30 - ecoules);
};

class Testimonial {
    // Création publique : arrive en modération
    static async create({ clientName, clientEmail, comment, rating, eventId }) {
        const note = Number(rating);
        const t = await prisma.testimonial.create({
            data: {
                client_name: clientName,
                client_email: clientEmail || null,
                comment,
                rating: Number.isInteger(note) && note >= 1 && note <= 5 ? note : null,
                event_id: eventId ? Number(eventId) : null,
                status: 'en_attente'
            },
            select: { id: true }
        });
        return t.id;
    }

    // Site public : publiés, non expirés (ou conservés), filtrés par les
    // paramètres Site public (note minimale, nombre affiché).
    static async getPublic({ minRating = 0, limit = 0 } = {}) {
        const min = Math.min(5, Math.max(0, Number(minRating) || 0));
        const lim = Math.min(50, Math.max(0, parseInt(limit, 10) || 0));

        return prisma.testimonial.findMany({
            where: {
                status: 'publie',
                OR: [
                    { keep_forever: true },
                    { created_at: { gte: dateLimite() } }
                ],
                // Une note minimale exclut aussi les témoignages sans note,
                // comme le faisait « rating IS NOT NULL AND rating >= ? ».
                ...(min ? { rating: { not: null, gte: min } } : {})
            },
            select: {
                id: true, client_name: true, comment: true,
                rating: true, is_featured: true, created_at: true
            },
            orderBy: [{ is_featured: 'desc' }, { created_at: 'desc' }],
            ...(lim ? { take: lim } : {})
        });
    }

    static async getRecent(opts) {
        return this.getPublic(opts);
    }

    // Liste admin : statut + recherche + tri
    static async list({ status = 'all', q = '', sort = 'recent', limit = 100, offset = 0 } = {}) {
        const where = {};
        if (['en_attente', 'publie', 'masque'].includes(status)) where.status = status;
        if (q) {
            // Recherche insensible à la casse, comme l'était LIKE en
            // collation utf8mb4_unicode_ci côté MySQL.
            where.OR = [
                { client_name: { contains: q, mode: 'insensitive' } },
                { comment: { contains: q, mode: 'insensitive' } }
            ];
        }

        const lim = Math.min(300, Math.max(1, parseInt(limit, 10) || 100));
        const off = Math.max(0, parseInt(offset, 10) || 0);
        const orderBy = sort === 'note'
            ? [{ rating: 'desc' }, { created_at: 'desc' }]
            : [{ created_at: 'desc' }];

        const rows = await prisma.testimonial.findMany({
            where,
            include: {
                event: {
                    select: {
                        client_name: true,
                        location: { include: { parent: true } }
                    }
                }
            },
            orderBy,
            take: lim,
            skip: off
        });

        return rows.map(({ event, ...t }) => ({
            ...t,
            event_client: event ? event.client_name : null,
            event_location: event ? nomLieu(event.location) : null,
            days_left: joursRestants(t.created_at)
        }));
    }

    static async counts() {
        const [total, en_attente, publie, masque, moyenne] = await Promise.all([
            prisma.testimonial.count(),
            prisma.testimonial.count({ where: { status: 'en_attente' } }),
            prisma.testimonial.count({ where: { status: 'publie' } }),
            prisma.testimonial.count({ where: { status: 'masque' } }),
            prisma.testimonial.aggregate({ _avg: { rating: true } })
        ]);

        const avg = moyenne._avg.rating;
        return {
            total, en_attente, publie, masque,
            // ROUND(AVG(rating), 1) : une décimale, 0 si aucune note
            avgRating: avg === null || avg === undefined ? 0 : Math.round(Number(avg) * 10) / 10
        };
    }

    static async getById(id) {
        return prisma.testimonial.findUnique({ where: { id: Number(id) } });
    }

    static async setStatus(id, status, adminId = null) {
        const existe = await prisma.testimonial.count({ where: { id: Number(id) } });
        if (!existe) return null;

        return prisma.testimonial.update({
            where: { id: Number(id) },
            data: { status, moderated_at: new Date(), moderated_by: adminId }
        });
    }

    // Publie tous les témoignages en attente
    static async publishAllPending(adminId = null) {
        const r = await prisma.testimonial.updateMany({
            where: { status: 'en_attente' },
            data: { status: 'publie', moderated_at: new Date(), moderated_by: adminId }
        });
        return r.count;
    }

    // Bascule mise en avant / conservation
    static async setFlag(id, field, value) {
        if (!['is_featured', 'keep_forever'].includes(field)) throw new Error('Champ non autorisé');
        const existe = await prisma.testimonial.count({ where: { id: Number(id) } });
        if (!existe) return null;

        return prisma.testimonial.update({
            where: { id: Number(id) },
            data: { [field]: Boolean(value) }
        });
    }

    static async delete(id) {
        const r = await prisma.testimonial.deleteMany({ where: { id: Number(id) } });
        return r.count > 0;
    }

    // Purge : ne touche ni aux conservés ni aux mis en avant
    static async deleteOld() {
        const r = await prisma.testimonial.deleteMany({
            where: {
                created_at: { lt: dateLimite() },
                keep_forever: false,
                is_featured: false
            }
        });
        return r.count;
    }
}

module.exports = Testimonial;
