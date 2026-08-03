const nodemailer = require('nodemailer');

let cached = null;

const getTransporter = () => {
    if (cached) return cached;
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        throw new Error('Variables EMAIL_USER ou EMAIL_PASSWORD manquantes dans .env');
    }
    cached = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
    });
    return cached;
};

// Gabarit de réponse admin → client
const replyTemplate = ({ name, subject, body }) => `
<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#0f1b33;margin:0;padding:0;background:#eef1f7">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <div style="background:linear-gradient(135deg,#d81a45,#c4143e);color:#fff;padding:26px;text-align:center;border-radius:14px 14px 0 0">
      <h2 style="margin:0;font-size:20px">NetandProEvents</h2>
      <p style="margin:6px 0 0;opacity:.85;font-size:13px">Réponse à votre message</p>
    </div>
    <div style="background:#fff;padding:30px;border:1px solid #e6eaf2">
      <p style="margin:0 0 8px">Bonjour <strong>${name}</strong>,</p>
      <p style="margin:0 0 18px;color:#64748b;font-size:14px">Objet : <strong>${subject}</strong></p>
      <div style="padding:18px;background:#f8fafd;border-left:4px solid #c4143e;border-radius:8px">
        ${String(body).replace(/\n/g, '<br>')}
      </div>
    </div>
    <div style="background:#0f1b33;color:#94a3b8;padding:22px;text-align:center;font-size:12px;border-radius:0 0 14px 14px">
      NetandProEvents · Yaoundé, Cameroun<br>
      <a href="mailto:${process.env.EMAIL_USER}" style="color:#f6c6d4">${process.env.EMAIL_USER}</a>
    </div>
  </div>
</body></html>`;

module.exports = { getTransporter, replyTemplate };