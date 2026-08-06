const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

class PasswordResetCode {
    // Générer et enregistrer un nouveau code (invalide les précédents)
    static async create(email) {
        await prisma.passwordResetCode.updateMany({
            where: { email, used: false },
            data: { used: true }
        });

        const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 chiffres

        await prisma.passwordResetCode.create({
            data: {
                email,
                code_hash: await bcrypt.hash(code, 10),
                expires_at: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000)
            }
        });

        return code; // uniquement pour l'envoi email
    }

    // Vérifier un code saisi
    static async verify(email, code) {
        const row = await prisma.passwordResetCode.findFirst({
            where: { email, used: false },
            orderBy: { created_at: 'desc' }
        });

        if (!row) return { ok: false, reason: 'invalid' };
        if (new Date(row.expires_at) < new Date()) return { ok: false, reason: 'expired' };
        if (row.attempts >= MAX_ATTEMPTS) return { ok: false, reason: 'locked' };

        const match = await bcrypt.compare(code, row.code_hash);
        if (!match) {
            await prisma.passwordResetCode.update({
                where: { id: row.id },
                data: { attempts: { increment: 1 } }
            });
            return { ok: false, reason: 'invalid' };
        }

        return { ok: true, id: row.id };
    }

    static async markUsed(id) {
        await prisma.passwordResetCode.update({
            where: { id: Number(id) },
            data: { used: true }
        });
    }
}

module.exports = PasswordResetCode;
