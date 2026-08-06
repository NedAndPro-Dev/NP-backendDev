const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

class PasswordResetCode {
    // Générer et enregistrer un nouveau code (invalide les précédents)
    static async create(email) {
        await pool.execute(
            'UPDATE password_reset_codes SET used = TRUE WHERE email = ? AND used = FALSE',
            [email]
        );

        const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 chiffres
        const codeHash = await bcrypt.hash(code, 10);
        const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

        await pool.execute(
            'INSERT INTO password_reset_codes (email, code_hash, expires_at) VALUES (?, ?, ?)',
            [email, codeHash, expiresAt]
        );

        return code; // uniquement pour l'envoi email
    }

    // Vérifier un code saisi
    static async verify(email, code) {
        const [rows] = await pool.execute(
            'SELECT * FROM password_reset_codes WHERE email = ? AND used = FALSE ORDER BY created_at DESC LIMIT 1',
            [email]
        );
        const row = rows[0];

        if (!row) return { ok: false, reason: 'invalid' };
        if (new Date(row.expires_at) < new Date()) return { ok: false, reason: 'expired' };
        if (row.attempts >= MAX_ATTEMPTS) return { ok: false, reason: 'locked' };

        const match = await bcrypt.compare(code, row.code_hash);
        if (!match) {
            await pool.execute(
                'UPDATE password_reset_codes SET attempts = attempts + 1 WHERE id = ?',
                [row.id]
            );
            return { ok: false, reason: 'invalid' };
        }

        return { ok: true, id: row.id };
    }

    static async markUsed(id) {
        await pool.execute('UPDATE password_reset_codes SET used = TRUE WHERE id = ?', [id]);
    }
}

module.exports = PasswordResetCode;