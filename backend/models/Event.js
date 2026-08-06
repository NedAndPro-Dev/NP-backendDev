const prisma = require('../config/prisma');

/**
 * Reproduit le CONCAT SQL qui composait `location_name` :
 * « Site - Salle » pour une salle, « Site » seul pour un site racine.
 */
const nomLieu = (location) => {
    if (!location) return null;
    return location.parent ? `${location.parent.name} - ${location.name}` : location.name;
};

// La relation ne sert qu'à calculer location_name : elle est retirée de la
// sortie, sinon la réponse JSON gagnerait un objet `location` que le
// frontend ne connaît pas.
const aplatir = (event, extra = {}) => {
    const { location, ...reste } = event;
    return { ...reste, location_name: nomLieu(location), ...extra };
};

const AVEC_LIEU = { location: { include: { parent: true } } };

// Les services ont toujours été stockés en JSON, mais d'anciennes lignes
// contiennent une chaîne simple : on conserve la tolérance d'origine.
const normaliserServices = (valeur, id) => {
    if (Array.isArray(valeur)) return valeur;
    if (valeur === null || valeur === undefined) return [];
    if (typeof valeur === 'string') {
        if (!valeur.trim().startsWith('[')) {
            console.warn(`⚠️ Services non-JSON pour événement ${id}: ${valeur}`);
            return [valeur];
        }
        try {
            return JSON.parse(valeur);
        } catch (error) {
            console.error(`❌ Erreur parsing services pour événement ${id}:`, error.message);
            return [];
        }
    }
    return [];
};

class Event {
    // Créer un événement
    static async create(eventData) {
        const {
            clientName, clientEmail, clientPhone, companyName,
            dateStart, dateEnd, locationId, services, paymentMethod,
            notes, conditionsAccepted, attendees, status, isWaitlisted,
            title
        } = eventData;

        const event = await prisma.event.create({
            data: {
                client_name: clientName,
                title: title || null,
                client_email: clientEmail,
                client_phone: clientPhone,
                company_name: companyName || null,
                date_start: new Date(dateStart),
                date_end: new Date(dateEnd),
                location_id: Number(locationId),
                // S'assurer que services est un tableau
                services: Array.isArray(services) ? services : [],
                payment_method: paymentMethod,
                notes: notes || null,
                conditions_accepted: Boolean(conditionsAccepted),
                attendees: attendees ?? null,
                status: status || 'En attente',
                is_waitlisted: Boolean(isWaitlisted)
            },
            select: { id: true }
        });

        return event.id;
    }

    // Récupérer tous les événements
    static async getAll() {
        const rows = await prisma.event.findMany({
            include: AVEC_LIEU,
            orderBy: { date_start: 'desc' }
        });
        return rows.map(e => aplatir(e, { services: normaliserServices(e.services, e.id) }));
    }

    // Récupérer les événements publics (pour le calendrier)
    // Projection sans donnée identifiante : ni nom du client, ni email, ni téléphone.
    static async getPublicEvents() {
        const rows = await prisma.event.findMany({
            where: { status: { not: 'Annulé' } },
            select: {
                id: true, date_start: true, date_end: true, status: true,
                location: { include: { parent: true } }
            },
            orderBy: { date_start: 'asc' }
        });
        return rows.map(e => aplatir(e));
    }

    // Récupérer un événement par ID
    static async getById(id) {
        const event = await prisma.event.findUnique({
            where: { id: Number(id) },
            include: AVEC_LIEU
        });
        if (!event) return null;
        return aplatir(event, { services: normaliserServices(event.services, event.id) });
    }

    // Mettre à jour le statut. Confirmer une demande la sort de la liste d'attente.
    static async updateStatus(id, status, { clearWaitlist = false } = {}) {
        const r = await prisma.event.updateMany({
            where: { id: Number(id) },
            data: { status, ...(clearWaitlist ? { is_waitlisted: false } : {}) }
        });
        return r.count > 0;
    }

    // Supprimer un événement
    static async delete(id) {
        const r = await prisma.event.deleteMany({ where: { id: Number(id) } });
        return r.count > 0;
    }

    // Salles rendues indisponibles par un événement CONFIRMÉ chevauchant la plage
    static async getUnavailableLocations(from, to) {
        const rows = await prisma.event.findMany({
            where: {
                status: 'Confirmé',
                is_waitlisted: false,
                date_start: { lt: new Date(to) },
                date_end: { gt: new Date(from) }
            },
            select: { location_id: true },
            distinct: ['location_id']
        });
        return rows.map(r => r.location_id);
    }

    // Événements d'une plage de dates, pour le calendrier admin
    static async getForCalendar(from, to) {
        // Le SQL comparait DATE(date_end) >= from et DATE(date_start) <= to,
        // donc à la journée entière : on borne aux extrémités des journées.
        const debut = new Date(`${from}T00:00:00`);
        const fin = new Date(`${to}T23:59:59.999`);

        const rows = await prisma.event.findMany({
            where: {
                status: { not: 'Annulé' },
                date_end: { gte: debut },
                date_start: { lte: fin }
            },
            select: {
                id: true, client_name: true, client_email: true,
                date_start: true, date_end: true, status: true,
                location: { include: { parent: true } }
            },
            orderBy: { date_start: 'asc' }
        });

        return rows.map(e => ({
            ...aplatir(e),
            location_capacity: e.location ? e.location.capacity : null
        }));
    }
}

module.exports = Event;
