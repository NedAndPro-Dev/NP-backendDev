const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const pool = require('../config/database');

const BACKUP_DIR = path.join(__dirname, '..', '..', 'database', 'backups');

const ensureDir = () => { if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true }); };

/**
 * Dump complet via mysqldump. Le binaire doit être dans le PATH ;
 * MYSQLDUMP_PATH permet de le désigner explicitement sous Windows
 * (ex. C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe).
 */
const runBackup = () => new Promise((resolve, reject) => {
    ensureDir();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const file = path.join(BACKUP_DIR, `netandpro-${stamp}.sql`);
    const bin = process.env.MYSQLDUMP_PATH || 'mysqldump';

    const args = [
        `-h${process.env.DB_HOST}`,
        `-P${process.env.DB_PORT || 3307}`,
        `-u${process.env.DB_USER}`,
        `-p${process.env.DB_PASSWORD}`,
        '--single-transaction', '--routines', '--default-character-set=utf8mb4',
        process.env.DB_NAME
    ];

    const out = fs.createWriteStream(file);
    const child = execFile(bin, args, { maxBuffer: 1024 * 1024 * 512 });

    child.stdout.pipe(out);
    let err = '';
    child.stderr.on('data', (d) => { err += d.toString(); });

    child.on('error', (e) => reject(new Error(
        e.code === 'ENOENT'
            ? 'mysqldump introuvable. Renseignez MYSQLDUMP_PATH dans .env.'
            : e.message
    )));
    child.on('close', (code) => {
        out.end();
        if (code !== 0) return reject(new Error(err.trim() || `mysqldump a échoué (code ${code})`));
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
    const [[size]] = await pool.execute(`
        SELECT COALESCE(SUM(data_length + index_length), 0) AS bytes,
               COALESCE(SUM(table_rows), 0) AS rows_est
        FROM information_schema.tables WHERE table_schema = ?
    `, [process.env.DB_NAME]);

    const [[counts]] = await pool.execute(`
        SELECT (SELECT COUNT(*) FROM events) AS events,
               (SELECT COUNT(*) FROM locations) AS locations,
               (SELECT COUNT(*) FROM contact_messages) AS messages,
               (SELECT COUNT(*) FROM testimonials) AS testimonials
    `);

    return {
        bytes: Number(size.bytes),
        records: Number(counts.events) + Number(counts.locations)
               + Number(counts.messages) + Number(counts.testimonials),
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
    const [r] = await pool.execute(
        'DELETE FROM maintenance_log WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
        [Number(days) || 90]
    );
    return r.affectedRows;
};

const purgeCancelledEvents = async () => {
    const [r] = await pool.execute(`
        DELETE FROM events
        WHERE status = 'Annulé' AND date_start < DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
    `);
    return r.affectedRows;
};

const log = async (action, detail, userId, status = 'succes') => {
    await pool.execute(
        'INSERT INTO maintenance_log (action, detail, status, user_id) VALUES (?, ?, ?, ?)',
        [action, detail || null, status, userId || null]
    );
};

const lastBackupLog = async () => {
    const [rows] = await pool.execute(`
        SELECT created_at, status, detail FROM maintenance_log
        WHERE action = 'sauvegarde' ORDER BY created_at DESC LIMIT 1
    `);
    return rows[0] || null;
};

module.exports = { runBackup, listBackups, dbStats, uploadsSize, purgeLogs, purgeCancelledEvents, log, lastBackupLog, BACKUP_DIR };