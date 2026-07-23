const Testimonial = require('../models/Testimonial');

// Créer un témoignage
exports.createTestimonial = async (req, res) => {
    try {
        const { clientName, comment } = req.body;

        // Validation
        if (!clientName || !comment) {
            return res.status(400).json({
                success: false,
                message: 'Nom et commentaire requis'
            });
        }

        if (comment.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Le commentaire doit contenir au moins 10 caractères'
            });
        }

        const testimonialId = await Testimonial.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Merci pour votre témoignage !',
            testimonialId
        });

    } catch (error) {
        console.error('Erreur création témoignage:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// Récupérer les témoignages récents (< 3 mois)
exports.getRecentTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.getRecent();
        res.json(testimonials);
    } catch (error) {
        console.error('Erreur récupération témoignages:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Nettoyer les anciens témoignages (tâche automatique)
exports.cleanOldTestimonials = async (req, res) => {
    try {
        const deleted = await Testimonial.deleteOld();
        res.json({
            success: true,
            message: `${deleted} témoignage(s) supprimé(s)`
        });
    } catch (error) {
        console.error('Erreur nettoyage témoignages:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};