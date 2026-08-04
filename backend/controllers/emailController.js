const ContactMessage = require('../models/ContactMessage');
const Setting = require('../models/Setting');
const {
    sendRaw, sendTemplate, internalRecipients, verifyTransport,
    describeMailError, logMail
} = require('../utils/mailer');

// POST /api/email/contact
exports.sendContactMessage = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ success: false, message: 'Tous les champs obligatoires doivent être remplis' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'Format d\'email invalide' });
        }

        // Le message est conservé même si l'envoi SMTP échoue
        const saved = await ContactMessage.create({ name, email, phone: phone || null, subject, message });

        const team = await internalRecipients();
        const results = { admin: null, client: null };

        try {
            if (team.length) {
                await sendRaw({
                    to: team,
                    subject: `[Contact] ${subject}`,
                    title: 'Nouveau message de contact',
                    subtitle: `Message #${saved.id}`,
                    html: `<table style="font-size:14px">
                        <tr><td style="padding:4px 14px 4px 0">Nom</td><td><strong>${name}</strong></td></tr>
                        <tr><td style="padding:4px 14px 4px 0">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
                        <tr><td style="padding:4px 14px 4px 0">Téléphone</td><td>${phone || 'Non renseigné'}</td></tr>
                        <tr><td style="padding:4px 14px 4px 0">Sujet</td><td>${subject}</td></tr>
                    </table>
                    <div style="margin-top:18px;padding:16px;background:#f8fafd;border-radius:10px">
                        ${String(message).replace(/\n/g, '<br>')}
                    </div>`
                });
                results.admin = 'envoyé';
                await logMail('contact_internal', null, team.join(','), 'envoye');
            }

            // Accusé de réception : le modèle « ack » et sa bascule pilotent l'envoi
            const s = await Setting.all();
            const r = await sendTemplate('ack', {
                client_name: name,
                event_title: subject,
                date_start: new Date().toLocaleDateString('fr-FR'),
                site_name: s.site_name
            }, { to: email });
            results.client = r.sent ? 'envoyé' : `ignoré (${r.reason})`;
            await logMail('contact_ack', null, email, r.sent ? 'envoye' : 'ignore', r.reason || null);
        } catch (mailErr) {
            const { message: msg } = describeMailError(mailErr);
            console.error('Contact — envoi email:', mailErr.code || '', mailErr.message);
            await logMail('contact_ack', null, email, 'echec', mailErr.message);
            return res.status(202).json({
                success: true,
                stored: true,
                message: 'Votre message a bien été enregistré, mais la confirmation par email n\'a pas pu être envoyée. Notre équipe le traitera.',
                mailError: msg
            });
        }

        res.json({ success: true, message: 'Message envoyé avec succès', id: saved.id, results });
    } catch (error) {
        console.error('Erreur envoi message de contact:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi du message. Veuillez réessayer.' });
    }
};

// GET /api/email/test — diagnostic, sans envoi
exports.testEmailConfig = async (req, res) => {
    try {
        const cfg = await verifyTransport();
        res.json({ success: true, message: 'Configuration email OK', config: cfg });
    } catch (error) {
        const { status, message } = describeMailError(error);
        res.status(status).json({ success: false, code: error.code || null, message });
    }
};