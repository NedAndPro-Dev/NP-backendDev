const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const prisma = require('../config/prisma');

const BACKUP_DIR = path.join(__dirname, '..', '..', 'database', 'backups');

const ensureDir = () => { if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true }); };

/**
 * Décompose DATABASE_URL : pg_dump ne lit pas cette variable, il attend
 * des options et PGPASSWORD dans l'environnement.
 */
const connexion = () => {
    const u = new URL(process.env.DATABASE_URL);
    return {
        host: u.hostname,
        port: u.port || '5432',
        user: decodeURIComponent(u.username),
        password: decodeURIComponent(u.password),
        database: u.pathname.replace(/^\//, '')
    };
};

/**
 * Dump complet via pg_dump.
 *
 * Deux modes, dans cet ordre :
 *
 *   1. PG_DUMP_PATH renseigné → binaire local. À privilégier si PostgreSQL
 *      est installé sur la machine, ou en production hors conteneur.
 *   2. Sinon → pg_dump exécuté DANS le conteneur (PG_CONTAINER, par défaut
 *      netandpro_postgres). C'est le mode par défaut ici : la base tourne
 *      dans Docker, et le binaire du conteneur a forcément la même version
 *      que le serveur. Un pg_dump plus ancien que le serveur refuse de
 *      travailler — panne classique et déroutante.
 *
 * Le dump sort sur la sortie standard et non via --file : en mode conteneur,
 * le fichier serait écrit dans le conteneur, pas sur l'hôte.
 */
const runBackup = () => new Promise((resolve, reject) => {
    ensureDir();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const file = path.join(BACKUP_DIR, `netandpro-${stamp}.sql`);
    const c = connexion();

    const dumpArgs = ['-h', c.host, '-p', String(c.port), '-U', c.user, '-d', c.database,
        '--no-owner', '--no-privileges', '--encoding=UTF8'];

    let bin, args, env = { ...process.env, PGPASSWORD: c.password };

    if (process.env.PG_DUMP_PATH) {
        bin = process.env.PG_DUMP_PATH;
        args = dumpArgs;
    } else {
        const conteneur = process.env.PG_CONTAINER || 'netandpro_postgres';
        bin = 'docker';
        // Depuis le conteneur, le serveur est sur localhost:5432
        args = ['exec', '-e', `PGPASSWORD=${c.password}`, conteneur, 'pg_dump',
            '-h', 'localhost', '-p', '5432', '-U', c.user, '-d', c.database,
            '--no-owner', '--no-privileges', '--encoding=UTF8'];
        env = process.env;
    }

    const out = fs.createWriteStream(file);
    const child = spawn(bin, args, { env });

    child.stdout.pipe(out);
    let err = '';
    child.stderr.on('data', (d) => { err += d.toString(); });

    child.on('error', (e) => reject(new Error(
        e.code === 'ENOENT'
            ? (process.env.PG_DUMP_PATH
                ? `pg_dump introuvable à ${process.env.PG_DUMP_PATH}. Corrigez PG_DUMP_PATH dans .env.`
                : 'docker introuvable. Renseignez PG_DUMP_PATH dans .env pour utiliser un pg_dump local.')
            : e.message
    )));

    child.on('close', (code) => {
        out.end();
        if (code !== 0) {
            fs.existsSync(file) && fs.unlinkSync(file);   // pas de dump tronqué sur le disque
            return reject(new Error(err.trim() || `pg_dump a échoué (code ${code})`));
        }
        const { size } = fs.statSync(file);
        resolve({ file: path.basename(file), size, path: file });
    });
});

const listBackups = () => {
    ensureDir();
    return fs.readdirSync(BACKUP_DIR)
        .filter(f => f.endsWith('.sql'))
        .map(f => {
            const st = fs.statSync(path.join(BACKUP_DIR, f));
            return { file: f, size: st.size, created_at: st.mtime };
        })
        .sort((a, b) => b.created_at - a.created_at);
};

// Taille réelle de la base et volumétrie
const dbStats = async () => {
    // Seul appel SQL restant du projet, et il est assumé : la taille d'une
    // base est une donnée d'administration, pas un modèle métier — Prisma
    // n'expose aucune API pour l'obtenir. Requête paramétrée, sans entrée
    // utilisateur.
    const [{ bytes }] = await prisma.$queryRaw`SELECT pg_database_size(current_database()) AS bytes`;

    const [events, locations, messages, testimonials] = await Promise.all([
        prisma.event.count(),
        prisma.location.count(),
        prisma.contactMessage.count(),
        prisma.testimonial.count()
    ]);

    const counts = { events, locations, messages, testimonials };
    return {
        bytes: Number(bytes),
        records: events + locations + messages + testimonials,
        counts
    };
};

const uploadsSize = () => {
    const dir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(dir)) return 0;
    let total = 0;
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p); else total += fs.statSync(p).size;
    });
    walk(dir);
    return total;
};

// Purges
const purgeLogs = async (days) => {
    const limite = new Date(Date.now() - (Number(days) || 90) * 86400000);
    const r = await prisma.maintenanceLog.deleteMany({ where: { created_at: { lt: limite } } });
    return r.count;
};

const purgeCancelledEvents = async () => {
    // DATE_SUB(CURDATE(), INTERVAL 1 YEAR) : minuit, il y a un an
    const limite = new Date();
    limite.setHours(0, 0, 0, 0);
    limite.setFullYear(limite.getFullYear() - 1);

    const r = await prisma.event.deleteMany({
        where: { status: 'Annulé', date_start: { lt: limite } }
    });
    return r.count;
};

const log = async (action, detail, userId, status = 'succes') => {
    await prisma.maintenanceLog.create({
        data: { action, detail: detail || null, status, user_id: userId || null }
    });
};

const lastBackupLog = async () => {
    return prisma.maintenanceLog.findFirst({
        where: { action: 'sauvegarde' },
        select: { created_at: true, status: true, detail: true },
        orderBy: { created_at: 'desc' }
    });
};

module.exports = { runBackup, listBackups, dbStats, uploadsSize, purgeLogs, purgeCancelledEvents, log, lastBackupLog, BACKUP_DIR };
