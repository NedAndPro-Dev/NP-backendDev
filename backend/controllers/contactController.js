const ContactMessage = require('../models/ContactMessage');
const { getTransporter, replyTemplate } = require('../utils/mailer');

// GET /api/contact-messages?status=all&q=&limit=&offset=
exports.list = async (req, res) => {
    try {
        const { status = 'all', q = '', limit = 50, offset = 0 } = req.query;
        const [items, counts] = await Promise.all([
            ContactMessage.list({ status, q, limit, offset }),
            ContactMessage.counts()
        ]);
        res.json({ items, counts });
    } catch (error) {
        console.error('Erreur liste messages:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// GET /api/contact-messages/counts — badge de la sidebar
exports.counts = async (req, res) => {
    try { res.json(await ContactMessage.counts()); }
    catch (e) { console.error(e); res.status(500).json({ message: 'Erreur serveur' }); }
};

// GET /api/contact-messages/:id — passe automatiquement 'nouveau' → 'lu'
exports.getOne = async (req, res) => {
    try {
        const message = await ContactMessage.getById(req.params.id);
        if (!message) return res.status(404).json({ message: 'Message introuvable' });

        if (message.status === 'nouveau') {
            await ContactMessage.setStatus(message.id, 'lu');
            message.status = 'lu';
        }
        res.json({ ...message, replies: await ContactMessage.getReplies(message.id) });
    } catch (error) {
        console.error('Erreur lecture message:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// PATCH /api/contact-messages/:id/status
exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['nouveau', 'lu', 'traite'].includes(status)) {
            return res.status(422).json({ message: 'Statut invalide.' });
        }
        const updated = await ContactMessage.setStatus(req.params.id, status);
        if (!updated) return res.status(404).json({ message: 'Message introuvable' });
        res.json({ success: true, message: 'Statut mis à jour', data: updated });
    } catch (error) {
        console.error('Erreur maj statut message:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// PATCH /api/contact-messages/read-all
exports.markAllRead = async (req, res) => {
    try {
        const n = await ContactMessage.markAllRead();
        res.json({ success: true, message: `${n} message(s) marqué(s) lu(s)` });
    } catch (error) {
        console.error('Erreur markAllRead:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// POST /api/contact-messages/:id/reply — envoie l'email ET historise
exports.reply = async (req, res) => {
    try {
        const { body } = req.body;
        if (!body || String(body).trim().length < 5) {
            return res.status(422).json({ message: 'La réponse est trop courte.' });
        }

        const message = await ContactMessage.getById(req.params.id);
        if (!message) return res.status(404).json({ message: 'Message introuvable' });

        await getTransporter().sendMail({
            from: process.env.EMAIL_USER,
            to: message.email,
            replyTo: process.env.EMAIL_RECEIVE || process.env.EMAIL_USER,
            subject: `Re: ${message.subject}`,
            html: replyTemplate({ name: message.name, subject: message.subject, body })
        });

        await ContactMessage.addReply({
            messageId: message.id,
            adminId: req.user?.id || null,
            adminEmail: req.user?.email || null,
            body
        });
        await ContactMessage.setStatus(message.id, 'traite');

        res.json({
            success: true,
            message: `Réponse envoyée à ${message.email}`,
            data: { ...message, status: 'traite', replies: await ContactMessage.getReplies(message.id) }
        });
    } catch (error) {
        console.error('Erreur envoi réponse:', error);
        res.status(500).json({ message: "Échec de l'envoi de la réponse", error: error.message });
    }
};

// DELETE /api/contact-messages/:id
exports.remove = async (req, res) => {
    try {
        const message = await ContactMessage.getById(req.params.id);
        if (!message) return res.status(404).json({ message: 'Message introuvable' });
        await ContactMessage.delete(req.params.id);   // les réponses tombent en CASCADE
        res.json({ success: true, message: 'Message supprimé' });
    } catch (error) {
        console.error('Erreur suppression message:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};