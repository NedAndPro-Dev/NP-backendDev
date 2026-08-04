const pool = require('../config/database');
const Event = require('../models/Event');
const { checkBookingRules, checkRequiredFields, defaultStatus, autoConfirm } = require('../services/settingsGuard');

/**
 * L'API publique reçoit du camelCase (dateStart, locationId...), tandis que
 * settingsGuard et le paramètre required_fields raisonnent en noms de
 * colonnes (date_start, location_id...). Sans cette traduction, les gardes
 * ne voient que des undefined et rejettent toute demande valide.
 */
const toColumnNames = (b) => ({
    client_name: b.clientName,
    client_email: b.clientEmail,
    client_phone: b.clientPhone,
    company_name: b.companyName,
    date_start: b.dateStart,
    date_end: b.dateEnd,
    location_id: b.locationId,
    payment_method: b.paymentMethod,
    conditions_accepted: b.conditionsAccepted,
    attendees: b.attendees,
    services: b.services,
    notes: b.notes
});

// Créer un événement
const createEvent = async (req, res) => {
    try {
        const payload = toColumnNames(req.body);

        // Champs obligatoires configurés en back-office
        const fieldsCheck = await checkRequiredFields(payload);
        if (!fieldsCheck.ok) {
            return res.status(422).json({ success: false, message: fieldsCheck.message });
        }

        // Règles de réservation : préavis, durée, fermetures, quotas, capacité
        const rules = await checkBookingRules(payload);
        if (!rules.ok) {
            return res.status(422).json({ success: false, message: rules.message });
        }

        // Statut initial piloté par les paramètres. La route étant publique,
        // le statut envoyé par le client est ignoré : sinon n'importe quel
        // visiteur confirmerait lui-même sa réservation.
        const status = (await autoConfirm()) ? 'Confirmé' : await defaultStatus();

        const eventId = await Event.create({ ...req.body, status });

        res.status(201).json({
            success: true,
            message: 'Événement créé avec succès',
            eventId
        });
    } catch (error) {
        console.error('Erreur création événement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de l\'événement'
        });
    }
};

// Récupérer tous les événements
const getAllEvents = async (req, res) => {
    try {
        const events = await Event.getAll();
        res.json(events);
    } catch (error) {
        console.error('Erreur récupération événements:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Récupérer les événements publics
const getPublicEvents = async (req, res) => {
    try {
        const events = await Event.getPublicEvents();
        res.json(events);
    } catch (error) {
        console.error('Erreur récupération événements publics:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Récupérer un événement par ID
const getEventById = async (req, res) => {
    try {
        const event = await Event.getById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Événement non trouvé' });
        }

        res.json(event);
    } catch (error) {
        console.error('Erreur récupération événement:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Mettre à jour un événement complet
const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            clientName,
            clientEmail,
            clientPhone,
            companyName,
            dateStart,
            dateEnd,
            locationId,
            numberOfPeople,
            services,
            paymentMethod,
            notes
        } = req.body;

        const query = `
            UPDATE events SET
                client_name = ?,
                client_email = ?,
                client_phone = ?,
                company_name = ?,
                date_start = ?,
                date_end = ?,
                location_id = ?,
                number_of_people = ?,
                services = ?,
                payment_method = ?,
                notes = ?
            WHERE id = ?
        `;

        const [result] = await pool.execute(query, [
            clientName,
            clientEmail,
            clientPhone,
            companyName || null,
            dateStart,
            dateEnd,
            locationId,
            numberOfPeople || null,
            JSON.stringify(services),
            paymentMethod,
            notes || null,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Événement non trouvé' });
        }

        res.json({ success: true, message: 'Événement mis à jour avec succès' });
    } catch (error) {
        console.error('Erreur mise à jour événement:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Mettre à jour le statut d'un événement
const updateEventStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const updated = await Event.updateStatus(req.params.id, status);

        if (!updated) {
            return res.status(404).json({ message: 'Événement non trouvé' });
        }

        res.json({ success: true, message: 'Statut mis à jour' });
    } catch (error) {
        console.error('Erreur mise à jour statut:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Supprimer un événement
const deleteEvent = async (req, res) => {
    try {
        const deleted = await Event.delete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ message: 'Événement non trouvé' });
        }

        res.json({ success: true, message: 'Événement supprimé' });
    } catch (error) {
        console.error('Erreur suppression événement:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// GET /api/events/calendar?from=2026-08-01&to=2026-09-06
const getCalendar = async (req, res) => {
    try {
        const { from, to } = req.query;
        const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || '');
        if (!isDate(from) || !isDate(to)) {
            return res.status(422).json({ message: 'Paramètres from/to requis au format YYYY-MM-DD.' });
        }
        res.json(await Event.getForCalendar(from, to));
    } catch (error) {
        console.error('Erreur getCalendar:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

//  Exporter les fonctions
module.exports = {
    createEvent,
    getAllEvents,
    getPublicEvents,
    getEventById,
    updateEvent,
    updateEventStatus,
    deleteEvent,
    getCalendar
};