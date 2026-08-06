/**
 * Seed : garantit qu'un compte super administrateur et un compte superviseur
 * existent au lancement de l'application.
 *
 * Idempotent — fondé sur `upsert` par email. Relancer le seed ne duplique
 * rien et n'écrase JAMAIS le mot de passe d'un compte déjà présent : seul
 * un compte créé par ce script reçoit le mot de passe du .env.
 *
 * Les identifiants viennent de l'environnement pour ne pas figer de secret
 * dans le dépôt. Valeurs par défaut en développement uniquement ; en
 * production, renseigner les quatre variables SEED_*.
 *
 *   npm run seed          lancement manuel
 *   prisma migrate reset  déclenché automatiquement (voir prisma.config.js)
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

const PASSWORD_VALIDITY_DAYS = 90;

const COMPTES = [
    {
        email: process.env.SEED_ADMIN_EMAIL || 'admin@netandpro.cm',
        password: process.env.SEED_ADMIN_PASSWORD || 'ChangeMoi!2026',
        name: process.env.SEED_ADMIN_NAME || 'Administrateur NetandPro',
        role: 'super_admin'
    },
    {
        email: process.env.SEED_SUPERVISOR_EMAIL || 'superviseur@netandpro.cm',
        password: process.env.SEED_SUPERVISOR_PASSWORD || 'ChangeMoi!2026',
        name: process.env.SEED_SUPERVISOR_NAME || 'Superviseur NetandPro',
        role: 'superviseur'
    }
];

const expirationDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + PASSWORD_VALIDITY_DAYS);
    d.setHours(0, 0, 0, 0);
    return d;
};

async function main() {
    for (const c of COMPTES) {
        const existant = await prisma.user.findUnique({ where: { email: c.email } });

        if (existant) {
            // Le compte existe : on ne touche ni au mot de passe ni au rôle,
            // qu'un administrateur a pu changer depuis le back-office.
            console.log(`   = ${c.email} déjà présent (rôle ${existant.role}) — inchangé`);
            continue;
        }

        await prisma.user.create({
            data: {
                email: c.email,
                name: c.name,
                role: c.role,
                password_hash: await bcrypt.hash(c.password, 10),
                password_expiration: expirationDate(),
                // Le mot de passe vient d'un fichier de configuration :
                // on impose son changement à la première connexion.
                must_change_password: true,
                is_active: true
            }
        });
        console.log(`   + ${c.email} créé (rôle ${c.role})`);
    }

    const total = await prisma.user.count();
    console.log(`\n👤 Seed terminé — ${total} compte(s) en base.`);
}

main()
    .catch((e) => {
        console.error('❌ Seed échoué :', e.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
