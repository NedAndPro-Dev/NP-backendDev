const nodemailer = require('nodemailer');
const pool = require('../config/database');
const Setting = require('../models/Setting');

const MASK = '••••••••';

// Google affiche le mot de passe d'application en 4 groupes de 4 : les espaces
// collés à l'authentification SMTP provoquent un EAUTH.
const cleanPass = (v) => String(v || '').replace(/[\s\u00a0]/g, '');

let cached = null;
let cachedKey = '';

const smtpConfig = async () => {
    const s = await Setting.all().catch(() => ({}));
    const host = s.smtp_host || process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = Number(s.smtp_port) || 587;
    const user = s.smtp_user || process.env.EMAIL_USER;
    let pass = cleanPass(s.smtp_pass);
    // Une valeur masquée en base signifie que le champ a été enregistré par erreur
    if (!pass || pass === cleanPass(MASK)) pass = cleanPass(process.env.EMAIL_PASSWORD);
    return { host, port, user, pass };
};

const getTransporter = async () => {
    const { host, port, user, pass } = await smtpConfig();

    if (!user || !pass) {
        const err = new Error('Identifiants SMTP absents : renseignez l\'identifiant et le mot de passe d\'application dans Paramètres › Notifications.');
        err.code = 'ENOCREDS';
        throw err;
    }

    const key = `${host}:${port}:${user}:${pass.length}`;
    if (cached && cachedKey === key) return cached;

    cached = nodemailer.createTransport({
        host, port,
        secure: port === 465,
        requireTLS: port === 587,
        auth: { user, pass },
        connectionTimeout: 12000,
        greetingTimeout: 8000
    });
    cachedKey = key;
    return cached;
};

const resetTransporter = () => { cached = null; cachedKey = ''; };

// Vérifie la connexion sans envoyer d'email
const verifyTransport = async () => {
    const t = await getTransporter();
    await t.verify();
    const { host, port, user } = await smtpConfig();
    return { host, port, user };
};

// Traduit les codes nodemailer en message actionnable
const describeMailError = (e) => {
    const raw = e && (e.response || e.message) || '';
    switch (e && e.code) {
        case 'ENOCREDS':
            return { status: 422, message: e.message };
        case 'EAUTH':
            return {
                status: 422,
                message: 'Authentification refusée par le serveur. Pour Gmail, utilisez un mot de passe d\'application (16 caractères, sans espaces) avec la validation en deux étapes activée.'
            };
        case 'ESOCKET':
        case 'ECONNECTION':
            return { status: 502, message: `Connexion SMTP impossible sur ce port. Essayez 587 (TLS) ou 465 (SSL). Détail : ${raw}` };
        case 'ETIMEDOUT':
        case 'ECONNRESET':
            return { status: 504, message: 'Le serveur SMTP n\'a pas répondu à temps. Vérifiez l\'hôte, le port et le pare-feu du serveur.' };
        case 'ENOTFOUND':
        case 'EDNS':
            return { status: 422, message: 'Hôte SMTP introuvable : vérifiez l\'orthographe du nom de serveur.' };
        case 'EENVELOPE':
            return { status: 422, message: `Adresse destinataire refusée. Détail : ${raw}` };
        default:
            return { status: 502, message: `Échec de l'envoi : ${raw || 'erreur SMTP inconnue'}` };
    }
};

const getFrom = async () => {
    const s = await Setting.all().catch(() => ({}));
    const name = s.smtp_from_name || 'NetandProEvents';
    const addr = s.smtp_user || process.env.EMAIL_USER;
    return `"${name}" <${addr}>`;
};

const getReplyTo = async () => {
    const s = await Setting.all().catch(() => ({}));
    return s.smtp_reply_to || undefined;
};

// Destinataires internes configurés, avec repli sur les emails de la rubrique Coordonnées
const internalRecipients = async () => {
    const s = await Setting.all().catch(() => ({}));
    const list = Array.isArray(s.internal_recipients) ? s.internal_recipients.filter(Boolean) : [];
    if (list.length) return list;
    return [s.email_bookings, s.email_contact, process.env.EMAIL_RECEIVE].filter(Boolean).slice(0, 1);
};

// Enveloppe HTML commune, teintée par l'accent configuré
const wrap = async (title, subtitle, inner) => {
    const s = await Setting.all().catch(() => ({}));
    const accent = s.accent_color || '#1e40af';
    const siteName = s.site_name || 'NetandProEvents';
    const contact = s.email_contact || s.smtp_user || process.env.EMAIL_USER || '';

    return `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#0f1b33;margin:0;padding:0;background:#eef1f7">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <div style="background:${accent};color:#fff;padding:26px;text-align:center;border-radius:14px 14px 0 0">
      <h2 style="margin:0;font-size:20px">${siteName}</h2>
      ${subtitle ? `<p style="margin:6px 0 0;opacity:.85;font-size:13px">${subtitle}</p>` : ''}
    </div>
    <div style="background:#fff;padding:30px;border:1px solid #e6eaf2">
      ${title ? `<h3 style="margin:0 0 14px;font-size:17px">${title}</h3>` : ''}
      ${inner}
    </div>
    <div style="background:#0f1b33;color:#94a3b8;padding:22px;text-align:center;font-size:12px;border-radius:0 0 14px 14px">
      ${siteName} · ${s.address || 'Yaoundé, Cameroun'}<br>
      <a href="mailto:${contact}" style="color:#cbd5e1">${contact}</a>
    </div>
  </div>
</body></html>`;
};

const renderTemplate = (tpl, vars) => {
    let out = String(tpl || '');
    Object.entries(vars || {}).forEach(([k, v]) => {
        out = out.split(`{{${k}}}`).join(v === null || v === undefined ? '' : String(v));
    });
    return out.replace(/\{\{[a-z_]+\}\}/gi, '');
};

const paragraphs = (text) => String(text || '')
    .split(/\n{2,}/)
    .map(p => `<p style="margin:0 0 14px">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

/**
 * Envoi piloté par email_templates : la bascule « is_active » de la rubrique
 * Notifications coupe réellement l'envoi, et le corps vient du modèle éditable.
 * Renvoie { sent } ou { skipped, reason }.
 */
const sendTemplate = async (key, vars = {}, { to, cc, attachments } = {}) => {
    const [[tpl]] = await pool.execute('SELECT * FROM email_templates WHERE `key` = ?', [key]);
    if (!tpl) return { skipped: true, reason: `modèle « ${key} » introuvable` };
    if (!tpl.is_active) return { skipped: true, reason: 'modèle désactivé' };
    if (!to) return { skipped: true, reason: 'aucun destinataire' };

    const s = await Setting.all().catch(() => ({}));
    const all = { site_name: s.site_name || 'NetandProEvents', ...vars };

    const transporter = await getTransporter();
    const info = await transporter.sendMail({
        from: await getFrom(),
        to, cc, attachments,
        replyTo: await getReplyTo(),
        subject: renderTemplate(tpl.subject, all),
        html: await wrap(null, tpl.label, paragraphs(renderTemplate(tpl.body, all)))
    });
    return { sent: true, messageId: info.messageId, to };
};

// Envoi libre (notification interne, réponse admin)
const sendRaw = async ({ to, cc, subject, title, subtitle, html }) => {
    const transporter = await getTransporter();
    return transporter.sendMail({
        from: await getFrom(),
        to, cc,
        replyTo: await getReplyTo(),
        subject,
        html: await wrap(title, subtitle, html)
    });
};

// Journal des envois : sert aussi de garde anti-doublon pour les automatismes
const logMail = async (kind, eventId, recipient, status = 'envoye', detail = null) => {
    await pool.execute(
        `INSERT INTO email_log (kind, event_id, recipient, status, detail)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status), detail = VALUES(detail)`,
        [kind, eventId ?? null, String(recipient || '').slice(0, 190), status, detail]
    ).catch(e => console.error('email_log:', e.message));
};

const alreadySent = async (kind, eventId) => {
    const [rows] = await pool.execute(
        "SELECT id FROM email_log WHERE kind = ? AND event_id = ? AND status = 'envoye' LIMIT 1",
        [kind, eventId]
    );
    return rows.length > 0;
};

const replyTemplate = async ({ name, subject, body }) => wrap(
    null,
    'Réponse à votre message',
    `<p style="margin:0 0 8px">Bonjour <strong>${name}</strong>,</p>
     <p style="margin:0 0 18px;color:#64748b;font-size:14px">Objet : <strong>${subject}</strong></p>
     ${paragraphs(body)}`
);

module.exports = {
    getTransporter, resetTransporter, verifyTransport, describeMailError,
    getFrom, getReplyTo, internalRecipients,
    wrap, renderTemplate, sendTemplate, sendRaw,
    logMail, alreadySent, replyTemplate, MASK, cleanPass
};