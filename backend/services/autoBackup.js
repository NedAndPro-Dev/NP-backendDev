const Setting = require('../models/Setting');
const { runBackup, log, purgeLogs } = require('./backupService');

const FREQ_MS = {
    'Quotidienne': 24 * 3600 * 1000,
    'Toutes les 12 heures': 12 * 3600 * 1000,
    'Hebdomadaire': 7 * 24 * 3600 * 1000
};

let timer = null;
let lastRun = 0;

// Vérifie chaque heure s'il est temps de sauvegarder.
const tick = async () => {
    try {
        if (!(await Setting.get('auto_backup', false))) return;
        const freq = await Setting.get('backup_frequency', 'Quotidienne');
        const every = FREQ_MS[freq] || FREQ_MS.Quotidienne;
        if (Date.now() - lastRun < every) return;

        const res = await runBackup();
        lastRun = Date.now();
        await log('sauvegarde', `${res.file} (${Math.round(res.size / 1024)} Ko) — automatique`, null);

        const days = await Setting.get('log_retention_days', 90);
        await purgeLogs(days);
    } catch (e) {
        console.error('Sauvegarde automatique échouée:', e.message);
        await log('sauvegarde', e.message, null, 'echec').catch(() => {});
    }
};

const start = () => {
    if (timer) return;
    timer = setInterval(tick, 3600 * 1000);
    setTimeout(tick, 30 * 1000); // premier passage 30 s après le démarrage
};

module.exports = { start };