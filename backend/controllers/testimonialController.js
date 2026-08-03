const Testimonial = require('../models/Testimonial');

// ── Public ─────────────────────────────────────────────────────────────
exports.createTestimonial = async (req, res) => {
    try {
        const { clientName, clientEmail, comment, rating, eventId } = req.body;

        if (!clientName || !comment) {
            return res.status(400).json({ success: false, message: 'Nom et commentaire requis' });
        }
        if (comment.trim().length < 10) {
            return res.status(400).json({ success: false, message: 'Le commentaire doit contenir au moins 10 caractères' });
        }
        if (rating !== undefined && rating !== null && ![1, 2, 3, 4, 5].includes(Number(rating))) {
            return res.status(400).json({ success: false, message: 'La note doit être comprise entre 1 et 5' });
        }

        const id = await Testimonial.create({ clientName, clientEmail, comment, rating, eventId });

        res.status(201).json({
            success: true,
            message: 'Merci pour votre témoignage ! Il sera publié après validation.',
            testimonialId: id
        });
    } catch (error) {
        console.error('Erreur création témoignage:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

exports.getRecentTestimonials = async (req, res) => {
    try { res.json(await Testimonial.getPublic()); }
    catch (e) { console.error(e); res.status(500).json({ message: 'Erreur serveur' }); }
};

// ── Admin ──────────────────────────────────────────────────────────────
exports.list = async (req, res) => {
    try {
        const { status = 'all', q = '', sort = 'recent' } = req.query;
        const [items, counts] = await Promise.all([
            Testimonial.list({ status, q, sort }),
            Testimonial.counts()
        ]);
        res.json({ items, counts });
    } catch (error) {
        console.error('Erreur liste témoignages:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.counts = async (req, res) => {
    try { res.json(await Testimonial.counts()); }
    catch (e) { console.error(e); res.status(500).json({ message: 'Erreur serveur' }); }
};

exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['en_attente', 'publie', 'masque'].includes(status)) {
            return res.status(422).json({ message: 'Statut invalide.' });
        }
        const updated = await Testimonial.setStatus(req.params.id, status, req.user?.id || null);
        if (!updated) return res.status(404).json({ message: 'Témoignage introuvable' });

        const labels = { publie: 'Témoignage publié sur le site', masque: 'Témoignage masqué', en_attente: 'Remis en modération' };
        res.json({ success: true, message: labels[status], data: updated });
    } catch (error) {
        console.error('Erreur maj statut témoignage:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.publishAll = async (req, res) => {
    try {
        const n = await Testimonial.publishAllPending(req.user?.id || null);
        res.json({ success: true, message: `${n} témoignage(s) publié(s)` });
    } catch (error) {
        console.error('Erreur publication en masse:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// PATCH /:id/flag  { field: 'is_featured' | 'keep_forever', value: bool }
exports.setFlag = async (req, res) => {
    try {
        const { field, value } = req.body;
        if (!['is_featured', 'keep_forever'].includes(field)) {
            return res.status(422).json({ message: 'Champ non autorisé.' });
        }

        // Un témoignage mis en avant doit être publié
        if (field === 'is_featured' && value) {
            await Testimonial.setStatus(req.params.id, 'publie', req.user?.id || null);
        }
        const updated = await Testimonial.setFlag(req.params.id, field, value);
        if (!updated) return res.status(404).json({ message: 'Témoignage introuvable' });

        const msg = field === 'is_featured'
            ? (value ? "Mis en avant sur la page d'accueil" : 'Retiré de la mise en avant')
            : (value ? 'Conservé au-delà de 3 mois' : 'Purge automatique réactivée');
        res.json({ success: true, message: msg, data: updated });
    } catch (error) {
        console.error('Erreur flag témoignage:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.remove = async (req, res) => {
    try {
        const ok = await Testimonial.delete(req.params.id);
        if (!ok) return res.status(404).json({ message: 'Témoignage introuvable' });
        res.json({ success: true, message: 'Témoignage supprimé' });
    } catch (error) {
        console.error('Erreur suppression témoignage:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.cleanOldTestimonials = async (req, res) => {
    try {
        const deleted = await Testimonial.deleteOld();
        res.json({ success: true, message: `${deleted} témoignage(s) supprimé(s)` });
    } catch (error) {
        console.error('Erreur nettoyage témoignages:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};