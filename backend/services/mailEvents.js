const Setting = require('../models/Setting');
const { sendTemplate, sendRaw, internalRecipients, logMail } = require('../utils/mailer');

const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric'
}) : '';

const eventVars = (e) => ({
    client_name: e.client_name,
    client_email: e.client_email,
    event_title: e.company_name || `Réservation #${e.id}`,
    location_name: e.location_name || '',
    date_start: fmt(e.date_start),
    date_end: fmt(e.date_end),
    attendees: e.attendees ?? '',
    status: e.status
});

/** Accusé de réception au client + alerte aux destinataires internes */
const onBookingCreated = async (event, { waitlisted = false } = {}) => {
    try {
        const s = await Setting.all();
        const vars = { ...eventVars(event), cancel_policy: s.cancel_policy || '' };

        const r = await sendTemplate('ack', vars, { to: event.client_email });
        await logMail('ack', event.id, event.client_email, r.sent ? 'envoye' : 'ignore', r.reason || null);

        const team = await internalRecipients();
        if (team.length) {
            await sendRaw({
                to: team,
                subject: `${waitlisted ? '[Liste d\'attente]' : '[Nouvelle demande]'} ${vars.event_title} — ${vars.date_start}`,
                title: waitlisted ? 'Inscription en liste d\'attente' : 'Nouvelle demande de réservation',
                subtitle: 'Notification interne',
                html: `<table style="font-size:14px">
                    <tr><td style="padding:4px 14px 4px 0">Client</td><td><strong>${vars.client_name}</strong> — ${vars.client_email}</td></tr>
                    <tr><td style="padding:4px 14px 4px 0">Salle</td><td><strong>${vars.location_name || '—'}</strong></td></tr>
                    <tr><td style="padding:4px 14px 4px 0">Dates</td><td><strong>${vars.date_start}${vars.date_end ? ' → ' + vars.date_end : ''}</strong></td></tr>
                    <tr><td style="padding:4px 14px 4px 0">Personnes</td><td>${vars.attendees || '—'}</td></tr>
                    <tr><td style="padding:4px 14px 4px 0">Statut</td><td>${vars.status}</td></tr>
                </table>`
            });
            await logMail('internal_new', event.id, team.join(','), 'envoye');
        }
    } catch (e) {
        console.error('Email création réservation:', e.code || '', e.message);
        await logMail('ack', event.id, event.client_email, 'echec', e.message);
    }
};

/** Confirmation ou annulation, selon le nouveau statut */
const onStatusChanged = async (event, status, cancellation = null) => {
    const key = status === 'Confirmé' ? 'confirm' : status === 'Annulé' ? 'cancel' : null;
    if (!key) return { skipped: true, reason: 'statut sans email' };
    try {
        const s = await Setting.all();
        const vars = {
            ...eventVars(event), status,
            cancel_policy: s.cancel_policy || '',
            deposit_note: cancellation ? cancellation.message : ''
        };
        const r = await sendTemplate(key, vars, { to: event.client_email });
        await logMail(key, event.id, event.client_email, r.sent ? 'envoye' : 'ignore', r.reason || null);

        if (key === 'cancel') {
            const team = await internalRecipients();
            if (team.length) {
                await sendRaw({
                    to: team,
                    subject: `[Annulation] ${vars.event_title} — ${vars.date_start}`,
                    title: 'Réservation annulée',
                    subtitle: 'Notification interne',
                    html: `<p>${vars.client_name} (${vars.client_email}) — ${vars.location_name || 'salle non précisée'}, ${vars.date_start}.</p>
                           ${cancellation ? `<p style="color:#b45309"><strong>${cancellation.message}</strong></p>` : ''}`
                });
            }
        }
        return r;
    } catch (e) {
        console.error('Email changement de statut:', e.code || '', e.message);
        await logMail(key, event.id, event.client_email, 'echec', e.message);
        return { skipped: true, reason: e.message };
    }
};

module.exports = { onBookingCreated, onStatusChanged, eventVars };