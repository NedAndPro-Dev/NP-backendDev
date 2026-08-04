const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const PUBLIC_FIELDS = `id, name, email, phone, role, is_active, twofa_enabled,
                       must_change_password, password_expiration, last_login_at, created_at`;

class User {
    static async findByEmail(email) {
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0] || null;
    }

    static async findById(id) {
        const [rows] = await pool.execute(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`, [Number(id)]);
        if (!rows.length) return null;
        return { ...rows[0], is_active: !!rows[0].is_active, twofa_enabled: !!rows[0].twofa_enabled };
    }

    static isPasswordExpired(user) {
        return new Date(user.password_expiration) < new Date();
    }

    // Liste admin
    static async list({ role = 'all', q = '' } = {}) {
        const where = [];
        const params = [];

        if (['super_admin', 'superviseur'].includes(role)) {
            where.push('role = ?');
            params.push(role);
        }
        if (q) {
            where.push('(name LIKE ? OR email LIKE ?)');
            params.push(`%${q}%`, `%${q}%`);
        }

        const [rows] = await pool.execute(`
            SELECT ${PUBLIC_FIELDS},
                   DATEDIFF(password_expiration, CURDATE()) AS pwd_days_left
            FROM users
            ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
            ORDER BY FIELD(role, 'super_admin', 'superviseur'), name
        `, params);

        return rows.map(r => ({
            ...r,
            is_active: !!r.is_active,
            twofa_enabled: !!r.twofa_enabled,
            pwd_days_left: Number(r.pwd_days_left)
        }));
    }

    static async counts() {
        const [rows] = await pool.execute(`
            SELECT
                COUNT(*)                        AS total,
                SUM(is_active = 1)              AS actifs,
                SUM(role = 'super_admin')       AS super_admin,
                SUM(role = 'superviseur')       AS superviseur,
                SUM(DATEDIFF(password_expiration, CURDATE()) <= 15) AS expiring,
                MAX(last_login_at)              AS last_activity
            FROM users
        `);
        const r = rows[0] || {};
        return {
            total: Number(r.total) || 0,
            actifs: Number(r.actifs) || 0,
            super_admin: Number(r.super_admin) || 0,
            superviseur: Number(r.superviseur) || 0,
            expiring: Number(r.expiring) || 0,
            lastActivity: r.last_activity || null
        };
    }

    // Création par un super admin : mot de passe provisoire renvoyé en clair une seule fois
    static async create({ name, email, phone, role, createdBy }) {
        const tempPassword = crypto.randomBytes(6).toString('base64url'); // 8 caractères
        const hash = await bcrypt.hash(tempPassword, 10);
        const expiration = new Date();
        expiration.setMonth(expiration.getMonth() + 3);

        const [r] = await pool.execute(`
            INSERT INTO users (name, email, phone, role, password_hash, password_expiration,
                               must_change_password, created_by)
            VALUES (?, ?, ?, ?, ?, ?, TRUE, ?)
        `, [name, email, phone || null, role, hash,
            expiration.toISOString().split('T')[0], createdBy || null]);

        return { user: await this.findById(r.insertId), tempPassword };
    }

    static async updateProfile(id, { name, phone }) {
        await pool.execute('UPDATE users SET name = COALESCE(?, name), phone = ? WHERE id = ?',
            [name || null, phone || null, Number(id)]);
        return this.findById(id);
    }

    static async setRole(id, role) {
        await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, Number(id)]);
        return this.findById(id);
    }

    static async setActive(id, active) {
        await pool.execute('UPDATE users SET is_active = ? WHERE id = ?', [active ? 1 : 0, Number(id)]);
        return this.findById(id);
    }

    static async setTwofa(id, enabled) {
        await pool.execute('UPDATE users SET twofa_enabled = ? WHERE id = ?', [enabled ? 1 : 0, Number(id)]);
        return this.findById(id);
    }

    static async touchLogin(id) {
        await pool.execute('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [Number(id)]);
    }

    // Réinitialisation par un super admin
    static async resetPassword(id) {
        const tempPassword = crypto.randomBytes(6).toString('base64url');
        const hash = await bcrypt.hash(tempPassword, 10);
        const expiration = new Date();
        expiration.setDate(expiration.getDate() + 7); // provisoire : 7 jours pour le changer

        await pool.execute(`
            UPDATE users
            SET password_hash = ?, password_expiration = ?, must_change_password = TRUE
            WHERE id = ?
        `, [hash, expiration.toISOString().split('T')[0], Number(id)]);

        return tempPassword;
    }

    // Changement par l'utilisateur : +3 mois (règle non désactivable)
    static async updatePassword(email, newPassword) {
        const hash = await bcrypt.hash(newPassword, 10);
        const expiration = new Date();
        expiration.setMonth(expiration.getMonth() + 3);

        const [r] = await pool.execute(`
            UPDATE users
            SET password_hash = ?, password_expiration = ?, must_change_password = FALSE
            WHERE email = ?
        `, [hash, expiration.toISOString().split('T')[0], email]);

        return r.affectedRows > 0;
    }

    static async delete(id) {
        const [r] = await pool.execute('DELETE FROM users WHERE id = ?', [Number(id)]);
        return r.affectedRows > 0;
    }

    static async countSuperAdmins(exceptId = null) {
        const [rows] = await pool.execute(`
            SELECT COUNT(*) AS n FROM users
            WHERE role = 'super_admin' AND is_active = 1 AND (? IS NULL OR id <> ?)
        `, [exceptId, exceptId]);
        return Number(rows[0].n);
    }

    static async verifyPassword(plain, hash) {
        return bcrypt.compare(plain, hash);
    }
}

module.exports = User;