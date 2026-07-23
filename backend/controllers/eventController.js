const pool = require('../config/database');
const Event = require('../models/Event');

// Créer un événement
const createEvent = async (req, res) => {
    try {
        const eventId = await Event.create(req.body);
        
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

//  Exporter les fonctions
module.exports = {
    createEvent,
    getAllEvents,
    getPublicEvents,
    getEventById,
    updateEvent,          
    updateEventStatus,
    deleteEvent
};