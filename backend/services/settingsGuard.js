const Setting = require('../models/Setting');
const pool = require('../config/database');

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const HOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

/**
 * Valide une demande de réservation contre les paramètres.
 * Renvoie { ok: true } ou { ok: false, message }.
 */
const checkBookingRules = async ({ date_start, date_end, location_id, attendees }) => {
    const s = await Setting.all();
    const start = new Date(date_start);
    const end = new Date(date_end || date_start);

    //  Préavis minimum
    const leadDays = Math.round((startOfDay(start) - startOfDay(new Date())) / 86400000);
    const minLead = Number(s.min_lead_days) || 0;
    if (leadDays < minLead) {
        return { ok: false, message: `Les réservations doivent être faites au moins ${minLead} jour(s) à l'avance.` };
    }

    // Durée maximale
    const duration = Math.round((startOfDay(end) - startOfDay(start)) / 86400000) + 1;
    const maxDur = Number(s.max_duration_days) || 0;
    if (maxDur && duration > maxDur) {
        return { ok: false, message: `La durée maximale est de ${maxDur} jour(s). Contactez-nous pour un événement plus long.` };
    }

    // Jour de fermeture hebdomadaire
    const [hours] = await pool.execute('SELECT weekday, is_open FROM business_hours');
    const closedDays = new Set(hours.filter(h => !h.is_open).map(h => h.weekday));
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (closedDays.has(d.getDay())) {
            return { ok: false, message: `Nous sommes fermés le ${HOURS[d.getDay()]}. Choisissez une autre date.` };
        }
    }

    // Fermeture exceptionnelle
    const iso = (d) => d.toISOString().split('T')[0];
    const [clo] = await pool.execute(
        'SELECT label FROM closures WHERE date_to >= ? AND date_from <= ? LIMIT 1',
        [iso(start), iso(end)]
    );
    if (clo.length) {
        return { ok: false, message: `Période indisponible : ${clo[0].label}.` };
    }

    // Chevauchement
    if (!s.allow_overlap && location_id) {
        const [clash] = await pool.execute(`
            SELECT id FROM events
            WHERE location_id = ? AND status <> 'Annulé'
              AND DATE(date_end) >= ? AND DATE(date_start) <= ?
            LIMIT 1
        `, [location_id, iso(start), iso(end)]);
        if (clash.length) {
            return { ok: false, message: 'Cette salle est déjà réservée sur la période demandée.' };
        }
    }

    // Quota journalier par salle
    const perDay = Number(s.max_bookings_per_day) || 0;
    if (perDay && location_id) {
        const [[{ n }]] = await pool.execute(`
            SELECT COUNT(*) AS n FROM events
            WHERE location_id = ? AND status <> 'Annulé' AND DATE(date_start) = ?
        `, [location_id, iso(start)]);
        if (Number(n) >= perDay) {
            return { ok: false, message: `Cette salle atteint déjà son maximum de ${perDay} réservation(s) ce jour-là.` };
        }
    }

    //  Capacité
    if (!s.allow_over_capacity && location_id && attendees) {
        const [[loc]] = await pool.execute('SELECT capacity, name FROM locations WHERE id = ?', [location_id]);
        if (loc && loc.capacity && Number(attendees) > Number(loc.capacity)) {
            return { ok: false, message: `${loc.name} accueille au maximum ${loc.capacity} personnes.` };
        }
    }

    return { ok: true };
};

// Champs obligatoires configurés
const checkRequiredFields = async (payload) => {
    const required = await Setting.get('required_fields', []);
    const missing = (Array.isArray(required) ? required : []).filter(f => {
        const v = payload[f];
        return v === undefined || v === null || String(v).trim() === '';
    });
    return missing.length
        ? { ok: false, message: `Champs obligatoires manquants : ${missing.join(', ')}.` }
        : { ok: true };
};

const defaultStatus = () => Setting.get('default_status', 'En attente');
const autoConfirm = () => Setting.get('auto_confirm', false);

module.exports = { checkBookingRules, checkRequiredFields, defaultStatus, autoConfirm };