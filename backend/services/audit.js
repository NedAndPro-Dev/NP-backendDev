const AuditLog = require('../models/AuditLog');

const clientIp = (req) =>
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress || null;

const actorOf = (req) => ({
    userId: req.user?.id || null,
    actorName: req.user?.name || null,
    actorEmail: req.user?.email || null,
    actorRole: req.user?.role || null
});

/** Trace explicite ; jamais bloquante — une erreur de journal ne casse pas l'action */
const record = async (req, entry) => {
    try {
        if (req) req.res && (req.res.locals.audited = true);
        await AuditLog.create({
            ...actorOf(req || {}),
            ip: req ? clientIp(req) : '127.0.0.1',
            userAgent: req?.headers?.['user-agent'] || 'systeme',
            method: req?.method || null,
            path: req?.originalUrl?.split('?')[0] || null,
            ...entry
        });
    } catch (e) {
        console.error('audit_log:', e.message);
    }
};

/** Trace d'une tâche planifiée (pas de requête) */
const recordSystem = (entry) => record(null, {
    ...entry,
    actorName: 'Système',
    actorEmail: 'automatisation@netandproevents.cm',
    actorRole: 'systeme'
});

/**
 * Compare l'état courant des paramètres au patch reçu.
 * Renvoie [{ key, before, after }] pour les seules valeurs qui changent.
 */
const diffSettings = (current, patch, { secretKeys = [] } = {}) => {
    const show = (v) => {
        if (v === null || v === undefined || v === '') return '—';
        if (typeof v === 'boolean') return v ? 'activé' : 'désactivé';
        if (Array.isArray(v)) return `${v.length} élément(s)`;
        if (typeof v === 'object') return 'objet modifié';
        return String(v).slice(0, 80);
    };
    return Object.keys(patch)
        .filter(k => String(current[k] ?? '') !== String(patch[k] ?? ''))
        .map(k => secretKeys.includes(k)
            ? { key: k, before: '••••', after: '••••' }
            : { key: k, before: show(current[k]), after: show(patch[k]) });
};

/* ── Filet automatique ─────────────────────────────────────────────────
   Toute requête d'écriture authentifiée est journalisée si le contrôleur
   ne l'a pas déjà fait (res.locals.audited). Le libellé vient des règles
   ci-dessous ; la plus spécifique gagne (ordre du tableau).
*/
const RULES = [
    [/^\/api\/settings\/reset\//,        'POST',   'param',   'Rubrique réinitialisée', 'attention'],
    [/^\/api\/settings\/branding\//,     'POST',   'param',   'Logo ou favicon remplacé'],
    [/^\/api\/settings\/hours/,          'PUT',    'param',   "Horaires d'exploitation modifiés"],
    [/^\/api\/settings\/closures/,       'POST',   'param',   'Fermeture exceptionnelle ajoutée'],
    [/^\/api\/settings\/closures\//,     'DELETE', 'param',   'Fermeture exceptionnelle retirée'],
    [/^\/api\/settings\/services/,       'POST',   'param',   'Service ajouté au catalogue'],
    [/^\/api\/settings\/services\//,     'PATCH',  'param',   'Service modifié'],
    [/^\/api\/settings\/services\//,     'DELETE', 'param',   'Service retiré', 'attention'],
    [/^\/api\/settings\/templates\//,    'PATCH',  'email',   "Modèle d'email modifié"],
    [/^\/api\/settings\/test-email/,     'POST',   'email',   'Email de test'],
    [/^\/api\/settings\/backup/,         'POST',   'systeme', 'Sauvegarde manuelle lancée'],
    [/^\/api\/settings\/clear-cache/,    'POST',   'systeme', 'Cache vidé'],
    [/^\/api\/settings\/purge-logs/,     'POST',   'systeme', 'Journaux purgés', 'attention'],
    [/^\/api\/settings\/purge-cancelled/,'POST',   'systeme', 'Dossiers annulés purgés', 'attention'],
    [/^\/api\/settings/,                 'PATCH',  'param',   'Paramètres enregistrés'],
    [/^\/api\/events\/[0-9]+\/status/,   'PATCH',  'resa',    'Statut de dossier modifié'],
    [/^\/api\/events\/[0-9]+/,           'PUT',    'resa',    'Dossier modifié'],
    [/^\/api\/events\/[0-9]+/,           'DELETE', 'resa',    'Dossier supprimé', 'attention'],
    [/^\/api\/events/,                   'POST',   'resa',    'Demande de réservation créée'],
    [/^\/api\/testimonials\/[0-9]+\/status/, 'PATCH', 'moder', 'Témoignage modéré'],
    [/^\/api\/testimonials\/[0-9]+\/flag/,   'PATCH', 'moder', 'Témoignage — mise en avant'],
    [/^\/api\/testimonials\/[0-9]+/,     'DELETE', 'moder',   'Témoignage supprimé', 'attention'],
    [/^\/api\/testimonials\/admin\/publish-all/, 'PATCH', 'moder', 'Publication en masse'],
    [/^\/api\/locations/,                'POST',   'contenu', 'Lieu créé'],
    [/^\/api\/locations\//,              'PUT',    'contenu', 'Lieu modifié'],
    [/^\/api\/locations\//,              'PATCH',  'contenu', 'Lieu modifié'],
    [/^\/api\/locations\//,              'DELETE', 'contenu', 'Lieu supprimé', 'attention'],
    [/^\/api\/users\/[0-9]+\/role/,      'PATCH',  'users',   'Rôle modifié', 'attention'],
    [/^\/api\/users\/[0-9]+\/active/,    'PATCH',  'users',   'Compte activé ou désactivé', 'attention'],
    [/^\/api\/users\/[0-9]+/,            'DELETE', 'users',   'Compte supprimé', 'attention'],
    [/^\/api\/users/,                    'POST',   'users',   'Utilisateur invité'],
    [/^\/api\/auth\/change-password/,    'POST',   'acces',   'Mot de passe changé'],
    [/^\/api\/contact-messages\//,       'POST',   'moder',   'Réponse envoyée à un message'],
    [/^\/api\/contact-messages\//,       'PATCH',  'moder',   'Message mis à jour'],
    [/^\/api\/contact-messages\//,       'DELETE', 'moder',   'Message supprimé', 'attention']
];

const IGNORE = [/^\/api\/auth\/login/, /^\/api\/auth\/verify/, /^\/api\/audit/];

const auditTrail = (req, res, next) => {
    if (req.method === 'GET' || req.method === 'OPTIONS') return next();
    const path = req.originalUrl.split('?')[0];
    if (IGNORE.some(rx => rx.test(path))) return next();

    const rule = RULES.find(([rx, method]) => rx.test(path) && method === req.method);
    if (!rule) return next();

    res.on('finish', () => {
        if (res.locals.audited) return;                 // déjà tracé finement
        const [, , category, action, tone] = rule;
        const ok = res.statusCode < 400;
        record(req, {
            category, action,
            target: req.params?.id ? `#${req.params.id}` : (req.params?.group || req.params?.key || null),
            detail: ok ? null : `Refusé par le serveur (HTTP ${res.statusCode})`,
            status: ok ? (tone || 'succes') : 'echec',
            httpStatus: res.statusCode
        });
    });
    next();
};

module.exports = { record, recordSystem, diffSettings, auditTrail, clientIp };