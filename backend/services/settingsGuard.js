const Setting = require('../models/Setting');
const pool = require('../config/database');

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const DAY = 86400000;
const HOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const iso = (d) => new Date(d).toISOString().split('T')[0];

/**
 * Valide une demande de réservation contre les paramètres.
 * Renvoie { ok: true } ou { ok: false, reason, waitlist?, message }.
 * waitlist = true : la date est prise mais resa.waitlist_enabled autorise
 * une inscription en attente (le contrôleur propose l'option au client).
 */
const checkBookingRules = async ({ date_start, date_end, location_id, attendees }) => {
    const s = await Setting.all();
    const start = new Date(date_start);
    const end = new Date(date_end || date_start);

    // Préavis minimum
    const leadDays = Math.round((startOfDay(start) - startOfDay(new Date())) / DAY);
    const minLead = Number(s.min_lead_days) || 0;
    if (leadDays < minLead) {
        return { ok: false, reason: 'lead', message: `Les réservations doivent être faites au moins ${minLead} jour(s) à l'avance.` };
    }

    // Durée maximale
    const duration = Math.round((startOfDay(end) - startOfDay(start)) / DAY) + 1;
    const maxDur = Number(s.max_duration_days) || 0;
    if (maxDur && duration > maxDur) {
        return { ok: false, reason: 'duration', message: `La durée maximale est de ${maxDur} jour(s). Contactez-nous pour un événement plus long.` };
    }

    // Jour de fermeture hebdomadaire
    const [hours] = await pool.execute('SELECT weekday, is_open FROM business_hours');
    const closedDays = new Set(hours.filter(h => !h.is_open).map(h => h.weekday));
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (closedDays.has(d.getDay())) {
            return { ok: false, reason: 'closed_day', message: `Nous sommes fermés le ${HOURS[d.getDay()]}. Choisissez une autre date.` };
        }
    }

    // Fermeture exceptionnelle
    const [clo] = await pool.execute(
        'SELECT label FROM closures WHERE date_to >= ? AND date_from <= ? LIMIT 1',
        [iso(start), iso(end)]
    );
    if (clo.length) {
        return { ok: false, reason: 'closure', message: `Période indisponible : ${clo[0].label}.` };
    }

    const waitlistOn = !!s.waitlist_enabled;

    // Chevauchement et battement (horaires.buffer_hours)
    if (location_id) {
        const bufferH = Number(s.buffer_hours) || 0;
        const [rows] = await pool.execute(`
            SELECT id, date_start, date_end FROM events
            WHERE location_id = ? AND status <> 'Annulé' AND is_waitlisted = 0
              AND date_end   >= DATE_SUB(?, INTERVAL ? HOUR)
              AND date_start <= DATE_ADD(?, INTERVAL ? HOUR)
        `, [location_id, start, bufferH, end, bufferH]);

        const overlap = rows.some(r => new Date(r.date_start) <= end && new Date(r.date_end) >= start);
        if (overlap && !s.allow_overlap) {
            return {
                ok: false, reason: 'overlap', waitlist: waitlistOn,
                message: waitlistOn
                    ? 'Cette salle est déjà réservée sur la période demandée. Nous pouvons vous inscrire en liste d\'attente.'
                    : 'Cette salle est déjà réservée sur la période demandée.'
            };
        }
        if (!overlap && bufferH && rows.length) {
            return {
                ok: false, reason: 'buffer',
                message: `Un battement de ${bufferH} h est requis entre deux événements dans cette salle. Décalez la date ou choisissez une autre salle.`
            };
        }
    }

    // Quota journalier par salle
    const perDay = Number(s.max_bookings_per_day) || 0;
    if (perDay && location_id) {
        const [[{ n }]] = await pool.execute(`
            SELECT COUNT(*) AS n FROM events
            WHERE location_id = ? AND status <> 'Annulé' AND is_waitlisted = 0 AND DATE(date_start) = ?
        `, [location_id, iso(start)]);
        if (Number(n) >= perDay) {
            return {
                ok: false, reason: 'quota', waitlist: waitlistOn,
                message: `Cette salle atteint déjà son maximum de ${perDay} réservation(s) ce jour-là.`
            };
        }
    }

    // Capacité
    if (!s.allow_over_capacity && location_id && attendees) {
        const [[loc]] = await pool.execute('SELECT capacity, name FROM locations WHERE id = ?', [location_id]);
        if (loc && loc.capacity && Number(attendees) > Number(loc.capacity)) {
            return { ok: false, reason: 'capacity', message: `${loc.name} accueille au maximum ${loc.capacity} personnes.` };
        }
    }

    return { ok: true };
};

/**
 * Champs obligatoires configurés.
 * Le back-office propose la clé « message », que l'API nomme « notes » :
 * sans cet alias, cocher « Message libre » refusait toute demande.
 */
const FIELD_ALIASES = { message: 'notes', people: 'attendees', phone: 'client_phone' };
const LABELS = {
    client_name: 'nom du client', client_email: 'email', client_phone: 'téléphone',
    attendees: 'nombre de personnes', services: 'services souhaités', notes: 'message'
};

const checkRequiredFields = async (payload) => {
    const required = await Setting.get('required_fields', []);
    const missing = (Array.isArray(required) ? required : [])
        .map(f => FIELD_ALIASES[f] || f)
        .filter(f => {
            const v = payload[f];
            if (Array.isArray(v)) return v.length === 0;
            return v === undefined || v === null || String(v).trim() === '';
        });
    return missing.length
        ? { ok: false, message: `Champs obligatoires manquants : ${missing.map(f => LABELS[f] || f).join(', ')}.` }
        : { ok: true };
};

/**
 * Applique resa.cancel_lead_days au moment de l'annulation :
 * en dessous du préavis, l'acompte (services.deposit_rate) est retenu.
 */
const checkCancellation = async (event) => {
    const s = await Setting.all();
    const need = Number(s.cancel_lead_days) || 0;
    const rate = Number(s.deposit_rate) || 0;
    const days = Math.round((startOfDay(new Date(event.date_start)) - startOfDay(new Date())) / DAY);
    const late = days < need;
    return {
        late, days, requiredDays: need,
        depositRetained: late ? rate : 0,
        message: late
            ? `Annulation à ${days} jour(s) de l'événement : moins de ${need} jour(s) de préavis, l'acompte de ${rate} % est retenu.`
            : `Annulation dans les délais (${days} jour(s), préavis requis ${need}) : acompte remboursable intégralement.`
    };
};

const defaultStatus = () => Setting.get('default_status', 'En attente');
const autoConfirm = () => Setting.get('auto_confirm', false);
const waitlistEnabled = () => Setting.get('waitlist_enabled', false);
const cancelPolicy = () => Setting.get('cancel_policy', '');

module.exports = {
    checkBookingRules, checkRequiredFields, checkCancellation,
    defaultStatus, autoConfirm, waitlistEnabled, cancelPolicy
};