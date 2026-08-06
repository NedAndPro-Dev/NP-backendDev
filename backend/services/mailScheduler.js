const prisma = require('../config/prisma');
const Setting = require('../models/Setting');
const { sendTemplate, logMail, alreadySent } = require('../utils/mailer');
const { eventVars } = require('./mailEvents');

const HOUR = 3600000;

/**
 * Événements d'un jour donné, avec le nom composé de la salle.
 *
 * Remplace le SELECT … CONCAT partagé : `champ` vaut date_start pour les
 * rappels, date_end pour les demandes d'avis. Les comparaisons portaient
 * sur DATE(...) côté MySQL, donc sur la journée entière — d'où les bornes.
 */
const evenementsDuJour = async (champ, date, filtres = {}) => {
    const jour = date.toISOString().split('T')[0];
    const rows = await prisma.event.findMany({
        where: {
            status: 'Confirmé',
            ...filtres,
            [champ]: {
                gte: new Date(`${jour}T00:00:00`),
                lte: new Date(`${jour}T23:59:59.999`)
            }
        },
        include: { location: { include: { parent: true } } }
    });
    return rows.map(({ location, ...e }) => ({
        ...e,
        location_name: location
            ? (location.parent ? `${location.parent.name} - ${location.name}` : location.name)
            : null
    }));
};

const dans = (jours) => {
    const d = new Date();
    d.setDate(d.getDate() + jours);
    return d;
};

/** notif.reminder_days : rappel avant l'événement */
const runReminders = async () => {
    const days = Number(await Setting.get('reminder_days', 0)) || 0;
    if (!days) return 0;
    const rows = await evenementsDuJour('date_start', dans(days), { is_waitlisted: false });
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
    const rows = await evenementsDuJour('date_end', dans(-days));
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

        if (a) {
            // reminder_days est relu ici : il n'est pas dans la portée de tick()
            const days = Number(await Setting.get('reminder_days', 0)) || 0;
            require('./audit').recordSystem({
                category: 'email', action: 'Rappels envoyés', target: `${a} destinataire(s)`,
                detail: `Rappel J-${days} pour les événements à venir`
            });
        }

        // systeme.log_retention_days : purge du journal d'audit
        const AuditLog = require('../models/AuditLog');
        const keep = Number(await Setting.get('log_retention_days', 90)) || 90;
        const purged = await AuditLog.purge(keep);
        if (purged) console.log(`🧾 Journal d'audit : ${purged} entrée(s) au-delà de ${keep} jours supprimée(s)`);
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