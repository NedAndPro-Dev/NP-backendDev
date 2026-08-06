const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Projection publique : jamais password_hash.
 * Remplace l'ancienne constante PUBLIC_FIELDS de la requête SQL.
 */
const PUBLIC_SELECT = {
    id: true, name: true, email: true, phone: true, role: true,
    is_active: true, twofa_enabled: true, must_change_password: true,
    password_expiration: true, last_login_at: true, created_at: true
};

const ROLE_ORDER = ['super_admin', 'superviseur'];

/**
 * Équivalent de DATEDIFF(date, CURDATE()) : nombre de jours calendaires.
 *
 * PostgreSQL rend une colonne DATE à minuit UTC, alors que « aujourd'hui »
 * s'entend dans le fuseau du serveur. Comparer les deux directement
 * décalerait le résultat d'un jour selon l'heure. On ramène donc chaque
 * date à ses composantes Y/M/J avant de soustraire.
 */
const joursRestants = (date) => {
    if (!date) return 0;
    const d = new Date(date);
    const cible = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((cible - today) / 86400000);
};

const dateDansNMois = (n) => {
    const d = new Date();
    d.setMonth(d.getMonth() + n);
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};

const dateDansNJours = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};

class User {
    static async findByEmail(email) {
        return prisma.user.findUnique({ where: { email } });
    }

    static async findById(id) {
        return prisma.user.findUnique({
            where: { id: Number(id) },
            select: PUBLIC_SELECT
        });
    }

    static isPasswordExpired(user) {
        return new Date(user.password_expiration) < new Date();
    }

    // Liste admin
    static async list({ role = 'all', q = '' } = {}) {
        const where = {};
        if (ROLE_ORDER.includes(role)) where.role = role;
        if (q) {
            // MySQL comparait en utf8mb4_unicode_ci : la recherche était
            // insensible à la casse. PostgreSQL est sensible par défaut,
            // d'où le mode explicite — sans lui, « FELIX » ne trouverait rien.
            where.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } }
            ];
        }

        const rows = await prisma.user.findMany({ where, select: PUBLIC_SELECT });

        // ORDER BY FIELD(role, …) n'existe pas hors MySQL : on ordonne par
        // rang explicite plutôt que de dépendre de l'ordre alphabétique.
        return rows
            .map(r => ({ ...r, pwd_days_left: joursRestants(r.password_expiration) }))
            .sort((a, b) => {
                const ra = ROLE_ORDER.indexOf(a.role);
                const rb = ROLE_ORDER.indexOf(b.role);
                if (ra !== rb) return ra - rb;
                return String(a.name || '').localeCompare(String(b.name || ''), 'fr');
            });
    }

    static async counts() {
        const dans15Jours = new Date();
        dans15Jours.setDate(dans15Jours.getDate() + 15);

        const [total, actifs, superAdmin, superviseur, expiring, derniere] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { is_active: true } }),
            prisma.user.count({ where: { role: 'super_admin' } }),
            prisma.user.count({ where: { role: 'superviseur' } }),
            prisma.user.count({ where: { password_expiration: { lte: dans15Jours } } }),
            prisma.user.aggregate({ _max: { last_login_at: true } })
        ]);

        return {
            total, actifs,
            super_admin: superAdmin,
            superviseur,
            expiring,
            lastActivity: derniere._max.last_login_at || null
        };
    }

    // Création par un super admin : mot de passe provisoire renvoyé en clair une seule fois
    static async create({ name, email, phone, role, createdBy }) {
        const tempPassword = crypto.randomBytes(6).toString('base64url'); // 8 caractères

        const user = await prisma.user.create({
            data: {
                name,
                email,
                phone: phone || null,
                role,
                password_hash: await bcrypt.hash(tempPassword, 10),
                password_expiration: dateDansNMois(3),
                must_change_password: true,
                created_by: createdBy || null
            },
            select: PUBLIC_SELECT
        });

        return { user, tempPassword };
    }

    static async updateProfile(id, { name, phone }) {
        return prisma.user.update({
            where: { id: Number(id) },
            // COALESCE(?, name) : un nom vide ne devait pas effacer l'existant,
            // contrairement au téléphone qui pouvait être remis à NULL.
            data: { ...(name ? { name } : {}), phone: phone || null },
            select: PUBLIC_SELECT
        });
    }

    static async setRole(id, role) {
        return prisma.user.update({
            where: { id: Number(id) }, data: { role }, select: PUBLIC_SELECT
        });
    }

    static async setActive(id, active) {
        return prisma.user.update({
            where: { id: Number(id) }, data: { is_active: Boolean(active) }, select: PUBLIC_SELECT
        });
    }

    static async setTwofa(id, enabled) {
        return prisma.user.update({
            where: { id: Number(id) }, data: { twofa_enabled: Boolean(enabled) }, select: PUBLIC_SELECT
        });
    }

    static async touchLogin(id) {
        await prisma.user.update({
            where: { id: Number(id) }, data: { last_login_at: new Date() }
        });
    }

    // Réinitialisation par un super admin
    static async resetPassword(id) {
        const tempPassword = crypto.randomBytes(6).toString('base64url');

        await prisma.user.update({
            where: { id: Number(id) },
            data: {
                password_hash: await bcrypt.hash(tempPassword, 10),
                password_expiration: dateDansNJours(7),   // provisoire : 7 jours pour le changer
                must_change_password: true
            }
        });

        return tempPassword;
    }

    // Changement par l'utilisateur : +3 mois (règle non désactivable)
    static async updatePassword(email, newPassword) {
        const r = await prisma.user.updateMany({
            where: { email },
            data: {
                password_hash: await bcrypt.hash(newPassword, 10),
                password_expiration: dateDansNMois(3),
                must_change_password: false
            }
        });
        return r.count > 0;
    }

    static async delete(id) {
        const r = await prisma.user.deleteMany({ where: { id: Number(id) } });
        return r.count > 0;
    }

    static async countSuperAdmins(exceptId = null) {
        return prisma.user.count({
            where: {
                role: 'super_admin',
                is_active: true,
                ...(exceptId ? { id: { not: Number(exceptId) } } : {})
            }
        });
    }

    static async verifyPassword(plain, hash) {
        return bcrypt.compare(plain, hash);
    }
}

module.exports = User;
