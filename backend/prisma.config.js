// Configuration de la CLI Prisma (migrate, studio, db push).
//
// Depuis Prisma 7, l'URL de connexion ne peut plus figurer dans
// schema.prisma : la CLI la lit ici, l'application la passe par un
// adaptateur (voir config/prisma.js). Les deux pointent sur DATABASE_URL,
// qui reste la seule source de vérité.

require('dotenv').config();

/** @type {import('prisma').PrismaConfig} */
module.exports = {
    schema: 'prisma/schema.prisma',
    migrations: {
        seed: 'node prisma/seed.js'
    },
    datasource: {
        url: process.env.DATABASE_URL
    }
};
