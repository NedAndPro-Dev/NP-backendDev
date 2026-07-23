const Testimonial = require('../models/Testimonial');

// Fonction de nettoyage des témoignages de plus de 3 mois
async function cleanupOldTestimonials() {
    try {
        const deleted = await Testimonial.deleteOld();
        console.log(`🧹 Nettoyage automatique: ${deleted} témoignage(s) supprimé(s)`);
    } catch (error) {
        console.error('❌ Erreur nettoyage témoignages:', error);
    }
}

// Exécuter le nettoyage toutes les 24 heures
setInterval(cleanupOldTestimonials, 24 * 60 * 60 * 1000);

// Exécuter au démarrage
cleanupOldTestimonials();

module.exports = { cleanupOldTestimonials };