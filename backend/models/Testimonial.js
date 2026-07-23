const pool = require('../config/database');

class Testimonial {
    // Créer un témoignage
    static async create(testimonialData) {
        const { clientName, comment } = testimonialData;
        
        const query = `
            INSERT INTO testimonials (client_name, comment)
            VALUES (?, ?)
        `;

        const [result] = await pool.execute(query, [clientName, comment]);
        return result.insertId;
    }

    // Récupérer les témoignages récents (< 3 mois)
    static async getRecent() {
        const query = `
            SELECT * FROM testimonials
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
            ORDER BY created_at DESC
        `;

        const [rows] = await pool.execute(query);
        return rows;
    }

    // Supprimer les témoignages de plus de 3 mois (nettoyage automatique)
    static async deleteOld() {
        const query = `
            DELETE FROM testimonials
            WHERE created_at < DATE_SUB(NOW(), INTERVAL 3 MONTH)
        `;

        const [result] = await pool.execute(query);
        return result.affectedRows;
    }
}

module.exports = Testimonial;