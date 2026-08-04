const nodemailer = require('nodemailer');
const Setting = require('../models/Setting');

let cached = null;
let cachedKey = '';

/**
 * Le transporteur est construit depuis app_settings, avec repli sur le .env.
 * Il est reconstruit dès qu'un paramètre SMTP change (la clé de cache est
 * la concaténation hôte/port/utilisateur).
 */
const getTransporter = async () => {
    const s = await Setting.all().catch(() => ({}));

    const host = s.smtp_host || 'smtp.gmail.com';
    const port = Number(s.smtp_port) || 587;
    const user = s.smtp_user || process.env.EMAIL_USER;
    const pass = s.smtp_pass || process.env.EMAIL_PASSWORD;

    if (!user || !pass) {
        throw new Error('Identifiants SMTP absents : renseignez-les dans Paramètres › Notifications, ou dans .env');
    }

    const key = `${host}:${port}:${user}`;
    if (cached && cachedKey === key) return cached;

    cached = nodemailer.createTransport({
        host, port,
        secure: port === 465,
        auth: { user, pass }
    });
    cachedKey = key;
    return cached;
};

const resetTransporter = () => { cached = null; cachedKey = ''; };

// Expéditeur formaté « Nom <adresse> »
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

// Enveloppe HTML commune, teintée par l'accent configuré
const wrap = async (title, subtitle, inner) => {
    const s = await Setting.all().catch(() => ({}));
    const accent = s.accent_color || '#c4143e';
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
      <a href="mailto:${contact}" style="color:#f6c6d4">${contact}</a>
    </div>
  </div>
</body></html>`;
};

// Rendu d'un modèle stocké : remplace {{variable}} par sa valeur
const renderTemplate = (tpl, vars) => {
    let out = String(tpl || '');
    Object.entries(vars || {}).forEach(([k, v]) => {
        out = out.split(`{{${k}}}`).join(v === null || v === undefined ? '' : String(v));
    });
    return out.replace(/\{\{[a-z_]+\}\}/gi, '');
};

// Gabarit de réponse admin → client (conservé, désormais teinté par l'accent)
const replyTemplate = async ({ name, subject, body }) => wrap(
    null,
    'Réponse à votre message',
    `<p style="margin:0 0 8px">Bonjour <strong>${name}</strong>,</p>
     <p style="margin:0 0 18px;color:#64748b;font-size:14px">Objet : <strong>${subject}</strong></p>
     <div style="padding:18px;background:#f8fafd;border-left:4px solid #c4143e;border-radius:8px">
       ${String(body).replace(/\n/g, '<br>')}
     </div>`
);

module.exports = { getTransporter, resetTransporter, getFrom, getReplyTo, wrap, renderTemplate, replyTemplate };