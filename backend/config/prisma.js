const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

/**
 * Client Prisma partagé par toute l'application.
 *
 * Depuis Prisma 7, la connexion passe par un « driver adapter » : c'est le
 * pilote `pg` qui parle à PostgreSQL, Prisma ne gère plus le pool lui-même.
 * Les options de pool sont donc celles de pg, pas celles de Prisma.
 *
 * Un seul client pour tout le processus : en instancier plusieurs ouvrirait
 * autant de pools, et nodemon finirait par saturer les connexions du serveur.
 */

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000
});

const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development'
        ? [{ level: 'warn', emit: 'stdout' }, { level: 'error', emit: 'stdout' }]
        : [{ level: 'error', emit: 'stdout' }]
});

// Vérification au démarrage, à l'image de l'ancien pool MySQL
prisma.$connect()
    .then(() => console.log('✅ Connexion PostgreSQL réussie'))
    .catch((err) => console.error('❌ Erreur connexion PostgreSQL:', err.message));

// Fermeture propre : sans cela, un arrêt de nodemon laisse des connexions
// ouvertes côté PostgreSQL jusqu'au timeout.
const shutdown = async () => {
    await prisma.$disconnect().catch(() => {});
    process.exit(0);
};
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

module.exports = prisma;
