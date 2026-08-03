const pool = require('../config/database');

class Event {
    // Créer un événement
    static async create(eventData) {
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
            notes,
            conditionsAccepted
        } = eventData;

        // S'assurer que services est un tableau
        const servicesArray = Array.isArray(services) ? services : [];

        const query = `
            INSERT INTO events (
                client_name, client_email, client_phone, company_name,
                date_start, date_end, location_id, services,
                payment_method, notes, conditions_accepted, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'En attente')
        `;

        const [result] = await pool.execute(query, [
            clientName,
            clientEmail,
            clientPhone,
            companyName || null,
            dateStart,
            dateEnd,
            locationId,
            JSON.stringify(servicesArray), // Toujours convertir en JSON
            paymentMethod,
            notes || null,
            conditionsAccepted ? 1 : 0
        ]);

        return result.insertId;
    }

    // Récupérer tous les événements
    static async getAll() {
        const query = `
            SELECT 
                e.*,
                CONCAT(
                    COALESCE((SELECT name FROM locations WHERE id = l.parent_id), ''),
                    IF(l.parent_id IS NOT NULL, ' - ', ''),
                    l.name
                ) as location_name
            FROM events e
            LEFT JOIN locations l ON e.location_id = l.id
            ORDER BY e.date_start DESC
        `;

        const [rows] = await pool.execute(query);

        // Parser les services JSON avec gestion d'erreurs ROBUSTE
        return rows.map(event => {
            let parsedServices = [];

            try {
                if (event.services && typeof event.services === 'string') {
                    if (event.services.trim().startsWith('[')) {
                        parsedServices = JSON.parse(event.services);
                    } else {
                        console.warn(`⚠️ Services non-JSON pour événement ${event.id}: ${event.services}`);
                        parsedServices = [event.services];
                    }
                } else if (Array.isArray(event.services)) {
                    parsedServices = event.services;
                }
            } catch (error) {
                console.error(`❌ Erreur parsing services pour événement ${event.id}:`, error.message);
                console.error(`   Données brutes: ${event.services}`);
                parsedServices = [];
            }

            return {
                ...event,
                services: parsedServices
            };
        });
    }

    // Récupérer les événements publics (pour le calendrier)
    // Projection sans donnée identifiante : ni nom du client, ni email, ni téléphone.
    static async getPublicEvents() {
        const query = `
            SELECT 
                e.id,
                e.date_start,
                e.date_end,
                e.status,
                CONCAT(
                    COALESCE((SELECT name FROM locations WHERE id = l.parent_id), ''),
                    IF(l.parent_id IS NOT NULL, ' - ', ''),
                    l.name
                ) as location_name
            FROM events e
            LEFT JOIN locations l ON e.location_id = l.id
            WHERE e.status != 'Annulé'
            ORDER BY e.date_start ASC
        `;

        const [rows] = await pool.execute(query);
        return rows;
    }

    // Récupérer un événement par ID
    static async getById(id) {
        const query = `
            SELECT 
                e.*,
                CONCAT(
                    COALESCE((SELECT name FROM locations WHERE id = l.parent_id), ''),
                    IF(l.parent_id IS NOT NULL, ' - ', ''),
                    l.name
                ) as location_name
            FROM events e
            LEFT JOIN locations l ON e.location_id = l.id
            WHERE e.id = ?
        `;

        const [rows] = await pool.execute(query, [id]);

        if (rows.length === 0) return null;

        let parsedServices = [];
        try {
            if (rows[0].services && typeof rows[0].services === 'string') {
                if (rows[0].services.trim().startsWith('[')) {
                    parsedServices = JSON.parse(rows[0].services);
                } else {
                    parsedServices = [rows[0].services];
                }
            }
        } catch (error) {
            console.error(`Erreur parsing services pour événement ${id}:`, error);
            parsedServices = [];
        }

        return {
            ...rows[0],
            services: parsedServices
        };
    }

    // Mettre à jour le statut
    static async updateStatus(id, status) {
        const query = 'UPDATE events SET status = ? WHERE id = ?';
        const [result] = await pool.execute(query, [status, id]);
        return result.affectedRows > 0;
    }

    // Supprimer un événement
    static async delete(id) {
        const query = 'DELETE FROM events WHERE id = ?';
        const [result] = await pool.execute(query, [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Event;