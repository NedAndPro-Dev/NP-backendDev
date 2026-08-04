const pool = require('../config/database');
const Setting = require('../models/Setting');
const { sendTemplate, logMail, alreadySent } = require('../utils/mailer');
const { eventVars } = require('./mailEvents');

const HOUR = 3600000;

const withLocation = `
    SELECT e.*, CONCAT(
        COALESCE((SELECT name FROM locations WHERE id = l.parent_id), ''),
        IF(l.parent_id IS NOT NULL, ' - ', ''), l.name
    ) AS location_name
    FROM events e LEFT JOIN locations l ON l.id = e.location_id
`;

/** notif.reminder_days : rappel avant l'événement */
const runReminders = async () => {
    const days = Number(await Setting.get('reminder_days', 0)) || 0;
    if (!days) return 0;
    const [rows] = await pool.execute(
        `${withLocation} WHERE e.status = 'Confirmé' AND e.is_waitlisted = 0
           AND DATE(e.date_start) = DATE_ADD(CURDATE(), INTERVAL ? DAY)`, [days]
    );
    let n = 0;
    for (const ev of rows) {
        if (await alreadySent('remind', ev.id)) continue;
        try {
            const r = await sendTemplate('remind', eventVars(ev), { to: ev.client_email });
            await logMail('remind', ev.id, ev.client_email, r.sent ? 'envoye' : 'ignore', r.reason || null);
            if (r.sent) n++;
        } catch (e) {
            await logMail('remind', ev.id, ev.client_email, 'echec', e.message);
        }
    }
    return n;
};

/** notif.review_request_days : demande d'avis après l'événement */
const runReviewRequests = async () => {
    const days = Number(await Setting.get('review_request_days', 0)) || 0;
    if (!days) return 0;
    const base = process.env.PUBLIC_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';
    const [rows] = await pool.execute(
        `${withLocation} WHERE e.status = 'Confirmé'
           AND DATE(e.date_end) = DATE_SUB(CURDATE(), INTERVAL ? DAY)`, [days]
    );
    let n = 0;
    for (const ev of rows) {
        if (await alreadySent('review', ev.id)) continue;
        try {
            const r = await sendTemplate('review', {
                ...eventVars(ev),
                review_link: `${String(base).split(',')[0].trim()}/temoignages?event=${ev.id}`
            }, { to: ev.client_email });
            await logMail('review', ev.id, ev.client_email, r.sent ? 'envoye' : 'ignore', r.reason || null);
            if (r.sent) n++;
        } catch (e) {
            await logMail('review', ev.id, ev.client_email, 'echec', e.message);
        }
    }
    return n;
};

const tick = async () => {
    try {
        const [a, b] = [await runReminders(), await runReviewRequests()];
        if (a || b) console.log(`📧 Automatismes : ${a} rappel(s), ${b} demande(s) d'avis`);
    } catch (e) {
        console.error('mailScheduler:', e.message);
    }
};

// Passage horaire : une seule exécution utile par jour grâce à email_log
const start = () => {
    setTimeout(tick, 60000);
    setInterval(tick, HOUR);
};

module.exports = { start, runReminders, runReviewRequests };