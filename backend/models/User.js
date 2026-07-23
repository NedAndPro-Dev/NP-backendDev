const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    // Trouver un utilisateur par email
    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = ?';
        const [rows] = await pool.execute(query, [email]);
        return rows[0] || null;
    }

    // Vérifier si le mot de passe a expiré
    static isPasswordExpired(user) {
        const expirationDate = new Date(user.password_expiration);
        const today = new Date();
        return expirationDate < today;
    }

    // Mettre à jour le mot de passe
    static async updatePassword(email, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const newExpiration = new Date();
        newExpiration.setMonth(newExpiration.getMonth() + 3); // +3 mois

        const query = `
            UPDATE users 
            SET password_hash = ?, password_expiration = ?
            WHERE email = ?
        `;

        const [result] = await pool.execute(query, [
            hashedPassword,
            newExpiration.toISOString().split('T')[0],
            email
        ]);

        return result.affectedRows > 0;
    }

    // Vérifier le mot de passe
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
}

module.exports = User;