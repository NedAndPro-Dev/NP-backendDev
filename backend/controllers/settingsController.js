const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const Setting = require('../models/Setting');
const backup = require('../services/backupService');
const { getTransporter, getFrom, resetTransporter, wrap } = require('../utils/mailer');

const WEEKDAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

/* ─────────────── Lecture ─────────────── */

// GET /api/settings — vue admin complète
exports.getAll = async (req, res) => {
    try {
        const [{ groups, lastUpdate }, [hours], [closures], [services], [templates]] = await Promise.all([
            Setting.grouped(),
            pool.execute('SELECT weekday, is_open, open_at, close_at FROM business_hours ORDER BY FIELD(weekday,1,2,3,4,5,6,0)'),
            pool.execute('SELECT id, label, date_from, date_to, kind FROM closures ORDER BY date_from'),
            pool.execute('SELECT id, name, price, unit, is_active, sort_order FROM service_catalog ORDER BY sort_order, name'),
            pool.execute('SELECT `key`, label, subject, is_active FROM email_templates')
        ]);

        // Compteur d'usage réel des services, lu dans events.services (JSON)
        const [rows] = await pool.execute("SELECT services FROM events WHERE services IS NOT NULL AND status <> 'Annulé'");
        const usage = {};
        rows.forEach(r => {
            let list = r.services;
            if (typeof list === 'string') { try { list = JSON.parse(list); } catch { list = [list]; } }
            (Array.isArray(list) ? list : []).forEach(sv => {
                const k = String(sv).trim();
                if (k) usage[k] = (usage[k] || 0) + 1;
            });
        });

        res.json({
            groups,
            lastUpdate,
            hours: hours.map(h => ({
                weekday: h.weekday, name: WEEKDAYS[h.weekday],
                is_open: !!h.is_open,
                open_at: String(h.open_at).slice(0, 5),
                close_at: String(h.close_at).slice(0, 5)
            })),
            closures: closures.map(c => ({
                id: c.id, label: c.label, kind: c.kind,
                date_from: c.date_from, date_to: c.date_to
            })),
            services: services.map(s => ({
                id: s.id, name: s.name, price: Number(s.price), unit: s.unit,
                is_active: !!s.is_active, usage: usage[s.name] || 0
            })),
            templates: templates.map(t => ({ ...t, is_active: !!t.is_active }))
        });
    } catch (error) {
        console.error('Erreur getAll settings:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// GET /api/settings/public — consommé par le site public (aucune auth)
exports.getPublic = async (req, res) => {
    try {
        const s = await Setting.all();
        const [services] = await pool.execute(
            'SELECT name, price, unit FROM service_catalog WHERE is_active = 1 ORDER BY sort_order, name'
        );
        const [hours] = await pool.execute(
            'SELECT weekday, is_open, open_at, close_at FROM business_hours ORDER BY FIELD(weekday,1,2,3,4,5,6,0)'
        );

        res.json({
            site: {
                name: s.site_name, tagline: s.tagline, seo: s.seo_description,
                logo: s.logo_url, favicon: s.favicon_url, accent: s.accent_color,
                currency: s.currency, language: s.language, timezone: s.timezone,
                dateFormat: s.date_format
            },
            contact: {
                legalName: s.legal_name, address: s.address, phone: s.phone_main,
                whatsapp: s.phone_whatsapp, email: s.email_contact, bookings: s.email_bookings,
                social: {
                    facebook: s.social_facebook, instagram: s.social_instagram,
                    linkedin: s.social_linkedin, tiktok: s.social_tiktok
                }
            },
            booking: {
                minLeadDays: s.min_lead_days, maxDurationDays: s.max_duration_days,
                cancelLeadDays: s.cancel_lead_days, requiredFields: s.required_fields || [],
                cancelPolicy: s.cancel_policy, depositRate: s.deposit_rate,
                vatRate: s.vat_rate, pricesIncludeVat: s.prices_include_vat,
                paymentMethods: Object.entries(s.payment_methods || {})
                    .filter(([, v]) => v && v.on).map(([k]) => k)
            },
            display: {
                maintenance: !!s.maintenance_mode,
                maintenanceMessage: s.maintenance_message,
                sections: s.home_sections || {},
                reviewsCount: s.reviews_count, reviewsMinRating: s.reviews_min_rating,
                bannerEnabled: !!s.banner_enabled, bannerText: s.banner_text,
                reviewFormOpen: !!s.review_form_open
            },
            services: services.map(x => ({ name: x.name, price: Number(x.price), unit: x.unit })),
            hours: hours.map(h => ({
                weekday: h.weekday, name: WEEKDAYS[h.weekday], is_open: !!h.is_open,
                open_at: String(h.open_at).slice(0, 5), close_at: String(h.close_at).slice(0, 5)
            }))
        });
    } catch (error) {
        console.error('Erreur getPublic settings:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

/* ─────────────── Écriture ─────────────── */

// PATCH /api/settings
exports.update = async (req, res) => {
    try {
        const patch = req.body || {};

        // Garde-fous : des valeurs absurdes casseraient les règles de réservation
        const bounds = {
            min_lead_days: [0, 365], max_duration_days: [1, 365], cancel_lead_days: [0, 365],
            buffer_hours: [0, 48], max_bookings_per_day: [1, 20],
            vat_rate: [0, 100], deposit_rate: [0, 100], payment_lead_hours: [1, 720],
            reminder_days: [0, 60], review_request_days: [0, 60],
            reviews_count: [1, 50], reviews_min_rating: [1, 5],
            log_retention_days: [7, 3650], smtp_port: [1, 65535], invoice_next: [1, 999999]
        };
        for (const [k, [lo, hi]] of Object.entries(bounds)) {
            if (patch[k] !== undefined) {
                const n = Number(patch[k]);
                if (Number.isNaN(n) || n < lo || n > hi) {
                    return res.status(422).json({ message: `« ${k} » doit être compris entre ${lo} et ${hi}.` });
                }
            }
        }
        if (patch.email_contact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patch.email_contact)) {
            return res.status(422).json({ message: 'Email de contact invalide.' });
        }
        if (patch.required_fields && !Array.isArray(patch.required_fields)) {
            return res.status(422).json({ message: 'required_fields doit être un tableau.' });
        }
        // Ces deux champs sont toujours obligatoires côté formulaire public
        if (Array.isArray(patch.required_fields)) {
            patch.required_fields = Array.from(new Set([...patch.required_fields, 'client_name', 'client_email']));
        }

        const { updated, ignored } = await Setting.setMany(patch, req.user.id);

        // Un changement SMTP invalide le transporteur en cache
        if (Object.keys(patch).some(k => k.startsWith('smtp_'))) resetTransporter();

        res.json({
            success: true,
            message: updated ? `${updated} paramètre(s) enregistré(s)` : 'Aucune modification',
            ignored
        });
    } catch (error) {
        console.error('Erreur update settings:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// POST /api/settings/reset/:group
exports.resetGroup = async (req, res) => {
    try {
        const allowed = ['marque', 'contact', 'resa', 'horaires', 'services', 'paiement', 'notif', 'site', 'systeme'];
        if (!allowed.includes(req.params.group)) {
            return res.status(422).json({ message: 'Rubrique inconnue.' });
        }
        await Setting.resetGroup(req.params.group);
        await backup.log('reinitialisation', `rubrique ${req.params.group}`, req.user.id);
        res.json({ success: true, message: `Rubrique « ${req.params.group} » réinitialisée` });
    } catch (error) {
        console.error('Erreur reset:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// GET /api/settings/export — téléchargement JSON
exports.exportConfig = async (req, res) => {
    try {
        const { groups } = await Setting.grouped();     // secrets déjà masqués
        const [[hours], [closures], [services], [templates]] = await Promise.all([
            pool.execute('SELECT * FROM business_hours'),
            pool.execute('SELECT label, date_from, date_to, kind FROM closures'),
            pool.execute('SELECT name, price, unit, is_active, sort_order FROM service_catalog'),
            pool.execute('SELECT `key`, label, subject, body, is_active FROM email_templates')
        ]);

        const payload = {
            exported_at: new Date().toISOString(),
            exported_by: req.user.email,
            settings: groups, hours, closures, services, templates
        };

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition',
            `attachment; filename="netandpro-config-${new Date().toISOString().slice(0, 10)}.json"`);
        res.send(JSON.stringify(payload, null, 2));
    } catch (error) {
        console.error('Erreur export config:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

/* ─────────────── Marque : logo / favicon ─────────────── */

// POST /api/settings/branding/:kind  (kind = logo | favicon)
exports.uploadBranding = async (req, res) => {
    try {
        const kind = req.params.kind;
        if (!['logo', 'favicon'].includes(kind)) {
            return res.status(422).json({ message: 'Type de fichier inconnu.' });
        }
        if (!req.file) return res.status(422).json({ message: 'Aucun fichier reçu.' });

        const url = `/uploads/branding/${req.file.filename}`;
        await Setting.setMany({ [`${kind}_url`]: url }, req.user.id);

        res.json({ success: true, message: `${kind === 'logo' ? 'Logo' : 'Favicon'} mis à jour`, url });
    } catch (error) {
        console.error('Erreur upload branding:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

/* ─────────────── Horaires et fermetures ─────────────── */

// PUT /api/settings/hours   body: [{ weekday, is_open, open_at, close_at }]
exports.updateHours = async (req, res) => {
    const rows = Array.isArray(req.body) ? req.body : [];
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        for (const h of rows) {
            const wd = Number(h.weekday);
            if (Number.isNaN(wd) || wd < 0 || wd > 6) continue;
            if (h.open_at >= h.close_at) {
                await conn.rollback();
                return res.status(422).json({ message: `${WEEKDAYS[wd]} : l'heure de fermeture doit suivre l'ouverture.` });
            }
            await conn.execute(`
                INSERT INTO business_hours (weekday, is_open, open_at, close_at)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE is_open = VALUES(is_open), open_at = VALUES(open_at), close_at = VALUES(close_at)
            `, [wd, h.is_open ? 1 : 0, h.open_at, h.close_at]);
        }
        await conn.commit();
        res.json({ success: true, message: 'Horaires enregistrés' });
    } catch (error) {
        await conn.rollback();
        console.error('Erreur updateHours:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    } finally { conn.release(); }
};

// POST /api/settings/closures
exports.addClosure = async (req, res) => {
    try {
        const { label, date_from, date_to, kind = 'Férié' } = req.body;
        if (!label || !date_from) return res.status(422).json({ message: 'Libellé et date de début obligatoires.' });
        const to = date_to || date_from;
        if (to < date_from) return res.status(422).json({ message: 'La date de fin précède la date de début.' });

        const [r] = await pool.execute(
            'INSERT INTO closures (label, date_from, date_to, kind) VALUES (?, ?, ?, ?)',
            [label, date_from, to, kind]
        );

        // Avertir si des dossiers existent déjà sur la période
        const [[{ n }]] = await pool.execute(`
            SELECT COUNT(*) AS n FROM events
            WHERE status <> 'Annulé' AND DATE(date_end) >= ? AND DATE(date_start) <= ?
        `, [date_from, to]);

        res.status(201).json({
            success: true,
            message: n ? `Fermeture ajoutée — attention : ${n} dossier(s) déjà planifié(s) sur cette période` : 'Fermeture ajoutée',
            data: { id: r.insertId, label, date_from, date_to: to, kind }
        });
    } catch (error) {
        console.error('Erreur addClosure:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// DELETE /api/settings/closures/:id
exports.removeClosure = async (req, res) => {
    try {
        const [r] = await pool.execute('DELETE FROM closures WHERE id = ?', [Number(req.params.id)]);
        if (!r.affectedRows) return res.status(404).json({ message: 'Fermeture introuvable' });
        res.json({ success: true, message: 'Fermeture retirée' });
    } catch (error) {
        console.error('Erreur removeClosure:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

/* ─────────────── Catalogue de services ─────────────── */

exports.addService = async (req, res) => {
    try {
        const { name, price = 0, unit = 'forfait' } = req.body;
        if (!name || String(name).trim().length < 2) {
            return res.status(422).json({ message: 'Nom du service obligatoire.' });
        }
        const [[{ n }]] = await pool.execute('SELECT COALESCE(MAX(sort_order),0)+1 AS n FROM service_catalog');
        const [r] = await pool.execute(
            'INSERT INTO service_catalog (name, price, unit, sort_order) VALUES (?, ?, ?, ?)',
            [String(name).trim(), Number(price) || 0, unit, n]
        );
        res.status(201).json({ success: true, message: 'Service ajouté', data: { id: r.insertId } });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Un service porte déjà ce nom.' });
        }
        console.error('Erreur addService:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.updateService = async (req, res) => {
    try {
        const { name, price, unit, is_active } = req.body;
        const [r] = await pool.execute(`
            UPDATE service_catalog
            SET name = COALESCE(?, name), price = COALESCE(?, price),
                unit = COALESCE(?, unit), is_active = COALESCE(?, is_active)
            WHERE id = ?
        `, [
            name ?? null,
            price === undefined ? null : Number(price),
            unit ?? null,
            is_active === undefined ? null : (is_active ? 1 : 0),
            Number(req.params.id)
        ]);
        if (!r.affectedRows) return res.status(404).json({ message: 'Service introuvable' });
        res.json({ success: true, message: 'Service mis à jour' });
    } catch (error) {
        console.error('Erreur updateService:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.removeService = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [[svc]] = await pool.execute('SELECT name FROM service_catalog WHERE id = ?', [id]);
        if (!svc) return res.status(404).json({ message: 'Service introuvable' });

        // Un service déjà demandé est désactivé, pas supprimé : les dossiers y font référence
        const [[{ n }]] = await pool.execute(
            "SELECT COUNT(*) AS n FROM events WHERE services LIKE ? AND status <> 'Annulé'",
            [`%${svc.name}%`]
        );
        if (Number(n) > 0) {
            await pool.execute('UPDATE service_catalog SET is_active = 0 WHERE id = ?', [id]);
            return res.json({
                success: true,
                message: `« ${svc.name} » est utilisé par ${n} dossier(s) : il a été désactivé plutôt que supprimé.`
            });
        }

        await pool.execute('DELETE FROM service_catalog WHERE id = ?', [id]);
        res.json({ success: true, message: 'Service supprimé' });
    } catch (error) {
        console.error('Erreur removeService:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

/* ─────────────── Emails ─────────────── */

exports.getTemplate = async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM email_templates WHERE `key` = ?', [req.params.key]);
        if (!rows.length) return res.status(404).json({ message: 'Modèle introuvable' });
        res.json({ ...rows[0], is_active: !!rows[0].is_active });
    } catch (error) {
        console.error('Erreur getTemplate:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.updateTemplate = async (req, res) => {
    try {
        const { subject, body, is_active } = req.body;
        const [r] = await pool.execute(`
            UPDATE email_templates
            SET subject = COALESCE(?, subject), body = COALESCE(?, body),
                is_active = COALESCE(?, is_active)
            WHERE \`key\` = ?
        `, [subject ?? null, body ?? null, is_active === undefined ? null : (is_active ? 1 : 0), req.params.key]);
        if (!r.affectedRows) return res.status(404).json({ message: 'Modèle introuvable' });
        res.json({ success: true, message: 'Modèle enregistré' });
    } catch (error) {
        console.error('Erreur updateTemplate:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// POST /api/settings/test-email
exports.testEmail = async (req, res) => {
    try {
        const to = req.body.to || req.user.email;
        const s = await Setting.all();
        const transporter = await getTransporter();

        await transporter.sendMail({
            from: await getFrom(),
            to,
            subject: `Test de configuration — ${s.site_name || 'NetandProEvents'}`,
            html: await wrap('Configuration SMTP validée', 'Email de test',
                `<p>Cet email confirme que le serveur d'envoi est correctement configuré.</p>
                 <table style="font-size:14px;color:#64748b">
                   <tr><td>Hôte</td><td><strong>${s.smtp_host}:${s.smtp_port}</strong></td></tr>
                   <tr><td>Expéditeur</td><td><strong>${s.smtp_user}</strong></td></tr>
                 </table>`)
        });

        await backup.log('test_email', `envoyé à ${to}`, req.user.id);
        res.json({ success: true, message: `Email de test envoyé à ${to}` });
    } catch (error) {
        console.error('Erreur testEmail:', error);
        await backup.log('test_email', error.message, req.user.id, 'echec').catch(() => {});
        res.status(500).json({ message: `Échec de l'envoi : ${error.message}` });
    }
};

/* ─────────────── Système ─────────────── */

// GET /api/settings/health
exports.health = async (req, res) => {
    try {
        const [stats, lastBackup, files] = await Promise.all([
            backup.dbStats(), backup.lastBackupLog(), Promise.resolve(backup.uploadsSize())
        ]);
        const version = await Setting.get('app_version', 'v1.0.0');

        res.json({
            version,
            db: { bytes: stats.bytes, records: stats.records, counts: stats.counts },
            uploads: { bytes: files, quota: 10 * 1024 * 1024 * 1024 },
            lastBackup,
            backups: backup.listBackups().slice(0, 5),
            uptimeSeconds: Math.round(process.uptime()),
            node: process.version
        });
    } catch (error) {
        console.error('Erreur health:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.backupNow = async (req, res) => {
    try {
        const result = await backup.runBackup();
        await backup.log('sauvegarde', `${result.file} (${Math.round(result.size / 1024)} Ko) — manuelle`, req.user.id);
        res.json({
            success: true,
            message: `Sauvegarde créée : ${result.file} (${(result.size / 1048576).toFixed(1)} Mo)`,
            data: { file: result.file, size: result.size }
        });
    } catch (error) {
        await backup.log('sauvegarde', error.message, req.user.id, 'echec').catch(() => {});
        res.status(500).json({ message: error.message });
    }
};

// GET /api/settings/backups/:file — téléchargement
exports.downloadBackup = async (req, res) => {
    const file = path.basename(req.params.file);
    const full = path.join(backup.BACKUP_DIR, file);
    if (!file.endsWith('.sql') || !fs.existsSync(full)) {
        return res.status(404).json({ message: 'Sauvegarde introuvable' });
    }
    res.download(full);
};

exports.clearCache = async (req, res) => {
    try {
        Setting.invalidate();
        resetTransporter();
        await backup.log('vidage_cache', null, req.user.id);
        res.json({ success: true, message: 'Cache vidé — paramètres et SMTP rechargés' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.purgeLogs = async (req, res) => {
    try {
        const days = await Setting.get('log_retention_days', 90);
        const n = await backup.purgeLogs(days);
        res.json({ success: true, message: `${n} entrée(s) de journal supprimée(s) (rétention ${days} jours)` });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.purgeCancelled = async (req, res) => {
    try {
        if (req.body.confirm !== 'PURGER') {
            return res.status(422).json({ message: 'Confirmation requise : saisissez PURGER.' });
        }
        const n = await backup.purgeCancelledEvents();
        await backup.log('purge_dossiers', `${n} dossier(s)`, req.user.id);
        res.json({ success: true, message: `${n} dossier(s) annulé(s) supprimé(s)` });
    } catch (error) {
        console.error('Erreur purgeCancelled:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// GET /api/settings/maintenance-log
exports.maintenanceLog = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT m.id, m.action, m.detail, m.status, m.created_at, u.name AS user_name
            FROM maintenance_log m LEFT JOIN users u ON u.id = m.user_id
            ORDER BY m.created_at DESC LIMIT 30
        `);
        res.json({ items: rows });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur' });
    }
};