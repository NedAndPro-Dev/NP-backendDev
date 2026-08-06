const prisma = require('../config/prisma');

const SECRET_MASK = '••••••••';

const decode = (row) => {
    const v = row.value;
    switch (row.type) {
        case 'int': return v === null || v === '' ? null : parseInt(v, 10);
        case 'float': return v === null || v === '' ? null : parseFloat(v);
        case 'bool': return v === '1' || v === 'true';
        case 'json': try { return JSON.parse(v || 'null'); } catch { return null; }
        default: return v;
    }
};

const encode = (value, type) => {
    if (value === null || value === undefined) return null;
    switch (type) {
        case 'bool': return value === true || value === 1 || value === '1' || value === 'true' ? '1' : '0';
        case 'json': return JSON.stringify(value);
        case 'int': return String(parseInt(value, 10) || 0);
        case 'float': return String(Number.parseFloat(value) || 0);
        default: return String(value);
    }
};

class Setting {
    // Cache процесс-local : les paramètres sont lus à chaque requête publique
    static _cache = null;

    static invalidate() { this._cache = null; }

    // Toutes les valeurs réelles, secrets inclus — usage interne (mailer, règles)
    static async all() {
        if (this._cache) return this._cache;
        const rows = await prisma.appSetting.findMany({
            select: { key: true, value: true, type: true }
        });
        const out = {};
        rows.forEach(r => { out[r.key] = decode(r); });
        this._cache = out;
        return out;
    }

    static async get(key, fallback = null) {
        const all = await this.all();
        return all[key] === undefined || all[key] === null ? fallback : all[key];
    }

    // Vue admin : groupée, secrets masqués
    static async grouped() {
        const rows = await prisma.appSetting.findMany({
            select: { key: true, value: true, type: true, group_key: true, is_secret: true, updated_at: true },
            orderBy: [{ group_key: 'asc' }, { key: 'asc' }]
        });
        const groups = {};
        let lastUpdate = null;

        rows.forEach(r => {
            groups[r.group_key] = groups[r.group_key] || {};
            groups[r.group_key][r.key] = r.is_secret && r.value
                ? SECRET_MASK
                : decode(r);
            if (!lastUpdate || new Date(r.updated_at) > new Date(lastUpdate)) lastUpdate = r.updated_at;
        });

        return { groups, lastUpdate };
    }

    // Écriture partielle : { key: value }. Les clés inconnues sont ignorées.
    static async setMany(patch, userId = null) {
        const keys = Object.keys(patch);
        if (!keys.length) return { updated: 0, ignored: [] };

        const known = await prisma.appSetting.findMany({
            where: { key: { in: keys } },
            select: { key: true, type: true, is_secret: true }
        });
        const meta = new Map(known.map(r => [r.key, r]));
        const ignored = keys.filter(k => !meta.has(k));

        const aEcrire = keys
            .map(key => ({ key, m: meta.get(key) }))
            .filter(({ key, m }) =>
                // Clé inconnue ignorée ; un secret renvoyé masqué n'écrase
                // pas la vraie valeur.
                m && !(m.is_secret && patch[key] === SECRET_MASK));

        // $transaction remplace le couple beginTransaction / commit :
        // soit tous les paramètres sont enregistrés, soit aucun.
        await prisma.$transaction(
            aEcrire.map(({ key, m }) => prisma.appSetting.update({
                where: { key },
                data: { value: encode(patch[key], m.type), updated_by: userId }
            }))
        );

        this.invalidate();
        return { updated: aEcrire.length, ignored };
    }

    static async resetGroup(groupKey) {
        // Remet à NULL : la valeur par défaut du code reprend la main
        await prisma.appSetting.updateMany({
            where: { group_key: groupKey },
            data: { value: null }
        });
        this.invalidate();
    }

    static get MASK() { return SECRET_MASK; }
}

module.exports = Setting;