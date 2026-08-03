#!/usr/bin/env node
/**
 * Applique les migrations SQL en attente.
 *
 * Une migration est un fichier .sql de database/migrations/. Le nom du
 * fichier fait office d'identifiant : il est enregistré dans la table
 * schema_migrations dès que le fichier a été joué avec succès. Un fichier
 * déjà enregistré n'est plus rejoué, ce qui rend la commande sûre à
 * relancer autant de fois que nécessaire.
 *
 * L'ordre d'exécution est l'ordre alphabétique des noms de fichiers.
 * D'où la convention de préfixe par date : 2026_08_locations_extend.sql.
 *
 * Attention : MySQL valide implicitement toute instruction DDL. Un
 * ALTER TABLE ne peut pas être annulé par un ROLLBACK. Si une migration
 * échoue à mi-parcours, les instructions déjà passées restent en base et
 * le fichier n'est pas marqué comme appliqué : il faut corriger l'état à
 * la main avant de relancer.
 *
 * Les blocs DELIMITER (triggers, procédures stockées) ne sont pas
 * supportés : ils sont interprétés par le client mysql, pas par le serveur.
 *
 * Usage : npm run migrate
 * Sortie : 0 si tout est appliqué, 1 en cas d'échec.
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const BACKEND_DIR = path.join(__dirname, '..');
const MIGRATIONS_DIR = path.join(BACKEND_DIR, '..', 'database', 'migrations');

require('dotenv').config({ path: path.join(BACKEND_DIR, '.env') });

const CREATE_TABLE = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
        filename   VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (filename)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`;

async function main() {
    if (!fs.existsSync(MIGRATIONS_DIR)) {
        console.log(`Aucun dossier ${MIGRATIONS_DIR}, rien à faire.`);
        return;
    }

    const files = fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql'))
        .sort();

    if (files.length === 0) {
        console.log('Aucune migration trouvée.');
        return;
    }

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3307,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ...(process.env.DB_SSL === 'true'
            ? { ssl: { rejectUnauthorized: false } }
            : {}),
        charset: 'utf8mb4',
        // Une migration contient plusieurs instructions séparées par ';'.
        // Les découper ici casserait sur les ';' présents dans les chaînes
        // ou les blocs JSON : on laisse le serveur faire le travail.
        multipleStatements: true
    });

    try {
        await connection.query(CREATE_TABLE);

        const [rows] = await connection.query(
            'SELECT filename FROM schema_migrations'
        );
        const applied = new Set(rows.map((r) => r.filename));

        const pending = files.filter((f) => !applied.has(f));

        if (pending.length === 0) {
            console.log(`✅ Base à jour (${applied.size} migration(s) appliquée(s)).`);
            return;
        }

        for (const filename of pending) {
            const sql = fs.readFileSync(
                path.join(MIGRATIONS_DIR, filename),
                'utf8'
            );

            console.log(`⏳ ${filename}`);
            await connection.query(sql);
            await connection.query(
                'INSERT INTO schema_migrations (filename) VALUES (?)',
                [filename]
            );
            console.log(`✅ ${filename}`);
        }

        console.log(`\n${pending.length} migration(s) appliquée(s).`);
    } finally {
        await connection.end();
    }
}

main().catch((err) => {
    console.error(`\n❌ Migration interrompue : ${err.message}`);
    if (err.sql) {
        console.error(`   Instruction : ${err.sql.slice(0, 200)}`);
    }
    process.exit(1);
});
