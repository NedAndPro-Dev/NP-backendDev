#!/usr/bin/env node
/**
 * Transfert unique des données MySQL → PostgreSQL.
 *
 * Script de bascule, pas de code applicatif : c'est le seul endroit du
 * dépôt qui parle encore aux deux bases. Il lit MySQL via mysql2 (source
 * en lecture seule, jamais modifiée) et écrit dans PostgreSQL via Prisma.
 *
 * Trois précautions structurantes :
 *
 *   1. Les identifiants sont préservés. Tout le contenu — événements liés
 *      à des lieux, témoignages liés à des événements, journaux liés à des
 *      comptes — repose sur ces clés. Les séquences PostgreSQL sont donc
 *      recalées à la fin, sans quoi le prochain INSERT réutiliserait l'id 1.
 *
 *   2. Les auto-références (users.created_by, locations.parent_id) sont
 *      insérées à NULL puis rétablies en seconde passe. Insérer dans l'ordre
 *      des id ne suffirait pas : rien ne garantit qu'un parent précède son
 *      enfant.
 *
 *   3. Les conversions de type sont explicites. MySQL rend 0/1 là où
 *      PostgreSQL attend un booléen, une chaîne « 08:00:00 » là où il attend
 *      un TIME, une chaîne pour les DECIMAL. Une conversion implicite
 *      passerait silencieusement et corromprait les valeurs.
 *
 * Idempotent : chaque table est vidée avant réinsertion. Relancer le script
 * remet PostgreSQL dans l'état exact de MySQL.
 *
 * Usage : npm run db:transfer
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const prisma = require('../config/prisma');

/* ── Conversions ──────────────────────────────────────────────────────── */

const bool = (v) => v === null || v === undefined ? null : Boolean(v);

// MySQL rend un TIME sous forme « HH:MM:SS ». PostgreSQL attend un Date dont
// seule la partie horaire compte ; on l'ancre à l'époque en UTC pour éviter
// tout décalage de fuseau.
const time = (v) => {
    if (v === null || v === undefined) return null;
    const [h, m, s] = String(v).split(':');
    return new Date(Date.UTC(1970, 0, 1, Number(h), Number(m), Number(s || 0)));
};

// mysql2 rend déjà un objet pour les colonnes JSON, mais renvoie parfois une
// chaîne selon la version du pilote : on couvre les deux cas.
const json = (v) => {
    if (v === null || v === undefined) return null;
    if (typeof v !== 'string') return v;
    try { return JSON.parse(v); } catch { return null; }
};

/* ── Description des tables ───────────────────────────────────────────── */
// booleans : colonnes tinyint(1)   times : colonnes TIME   jsons : colonnes JSON
// selfRef  : colonne d'auto-référence, insérée à NULL puis rétablie

const TABLES = [
    { table: 'users', model: 'user',
      booleans: ['is_active', 'twofa_enabled', 'must_change_password'],
      selfRef: 'created_by' },

    { table: 'locations', model: 'location',
      booleans: ['is_bookable'], jsons: ['layouts', 'equipment'],
      selfRef: 'parent_id' },

    { table: 'contact_messages', model: 'contactMessage' },

    { table: 'events', model: 'event',
      booleans: ['conditions_accepted', 'is_waitlisted'], jsons: ['services'] },

    { table: 'testimonials', model: 'testimonial',
      booleans: ['is_featured', 'keep_forever'] },

    { table: 'message_replies', model: 'messageReply' },

    { table: 'app_settings', model: 'appSetting', booleans: ['is_secret'], noId: true },

    { table: 'audit_log', model: 'auditLog', jsons: ['changes'] },

    { table: 'maintenance_log', model: 'maintenanceLog' },

    { table: 'email_log', model: 'emailLog' },

    { table: 'email_templates', model: 'emailTemplate', booleans: ['is_active'], noId: true },

    { table: 'business_hours', model: 'businessHour',
      booleans: ['is_open'], times: ['open_at', 'close_at'], noId: true },

    { table: 'closures', model: 'closure' },

    { table: 'service_catalog', model: 'serviceCatalog', booleans: ['is_active'] },

    { table: 'password_reset_codes', model: 'passwordResetCode', booleans: ['used'] }
];

const transform = (row, spec) => {
    const out = { ...row };
    (spec.booleans || []).forEach(c => { if (c in out) out[c] = bool(out[c]); });
    (spec.times || []).forEach(c => { if (c in out) out[c] = time(out[c]); });
    (spec.jsons || []).forEach(c => { if (c in out) out[c] = json(out[c]); });
    if (spec.selfRef) out[spec.selfRef] = null;          // rétabli en 2e passe
    return out;
};

async function main() {
    const source = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3307,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        dateStrings: false
    });
    console.log(`Source MySQL : ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(`Cible Prisma : ${String(process.env.DATABASE_URL).replace(/:[^:@]*@/, ':***@')}\n`);

    // Purge dans l'ordre inverse des dépendances
    for (const spec of [...TABLES].reverse()) {
        await prisma[spec.model].deleteMany({});
    }

    const differed = [];
    let total = 0;

    for (const spec of TABLES) {
        const [rows] = await source.query(`SELECT * FROM \`${spec.table}\``);
        if (!rows.length) {
            console.log(`   ${spec.table.padEnd(22)} 0`);
            continue;
        }

        const data = rows.map(r => transform(r, spec));
        await prisma[spec.model].createMany({ data });

        if (spec.selfRef) {
            rows.filter(r => r[spec.selfRef] !== null)
                .forEach(r => differed.push({ spec, id: r.id, value: r[spec.selfRef] }));
        }

        console.log(`   ${spec.table.padEnd(22)} ${rows.length}`);
        total += rows.length;
    }

    // Seconde passe : auto-références
    for (const d of differed) {
        await prisma[d.spec.model].update({
            where: { id: d.id },
            data: { [d.spec.selfRef]: d.value }
        });
    }
    if (differed.length) console.log(`\n   ${differed.length} auto-référence(s) rétablie(s)`);

    // Recalage des séquences : sans cela le prochain INSERT repartirait de 1
    for (const spec of TABLES.filter(s => !s.noId)) {
        await prisma.$executeRawUnsafe(
            `SELECT setval(pg_get_serial_sequence('"${spec.table}"', 'id'),
                           GREATEST(COALESCE((SELECT MAX(id) FROM "${spec.table}"), 0), 1),
                           (SELECT COUNT(*) FROM "${spec.table}") > 0)`
        );
    }
    console.log(`   séquences recalées sur ${TABLES.filter(s => !s.noId).length} table(s)`);

    await source.end();
    console.log(`\n✅ ${total} ligne(s) transférée(s).`);
}

main()
    .catch((e) => {
        console.error(`\n❌ Transfert interrompu : ${e.message}`);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
