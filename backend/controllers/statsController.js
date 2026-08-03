const pool = require('../config/database');

// Bornes de période : annee | semestre | trimestre
const resolveRange = (period) => {
    const now = new Date();
    const to = new Date(now.getFullYear(), 11, 31);
    let from;

    if (period === 'trimestre') {
        from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    } else if (period === 'semestre') {
        from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    } else {
        from = new Date(now.getFullYear(), 0, 1);
    }

    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const days = Math.round((to - from) / 86400000) + 1;
    return { from: iso(from), to: iso(to), fromMonth: from.getMonth() + 1, days };
};

const parseServices = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
        const s = raw.trim();
        if (s.startsWith('[')) { try { return JSON.parse(s); } catch { return [s]; } }
        return [s];
    }
    return [];
};

// GET /api/stats/overview?period=annee
exports.getOverview = async (req, res) => {
    try {
        const { from, to, days } = resolveRange(req.query.period);

        // 1. Volumétrie + KPI
        const [[kpi]] = await pool.execute(`
            SELECT
                COUNT(*)                                                     AS total,
                SUM(status = 'Confirmé')                                     AS confirmed,
                SUM(status = 'En attente')                                   AS pending,
                SUM(status = 'Annulé')                                       AS cancelled,
                COALESCE(SUM(CASE WHEN status <> 'Annulé' THEN attendees END), 0) AS attendees,
                ROUND(AVG(GREATEST(0, DATEDIFF(DATE(date_start), DATE(created_at)))), 1) AS lead_days
            FROM events
            WHERE DATE(date_start) BETWEEN ? AND ?
        `, [from, to]);

        // 2. Par mois, éclaté par statut
        const [monthly] = await pool.execute(`
            SELECT
                MONTH(date_start)          AS month,
                SUM(status = 'Confirmé')   AS confirmed,
                SUM(status = 'En attente') AS pending,
                SUM(status = 'Annulé')     AS cancelled
            FROM events
            WHERE DATE(date_start) BETWEEN ? AND ?
            GROUP BY MONTH(date_start)
            ORDER BY month
        `, [from, to]);

        // 3. Modes de paiement
        const [payments] = await pool.execute(`
            SELECT payment_method AS label, COUNT(*) AS count
            FROM events
            WHERE DATE(date_start) BETWEEN ? AND ? AND status <> 'Annulé'
            GROUP BY payment_method
            ORDER BY count DESC
        `, [from, to]);

        // 4. Services (JSON parsé côté Node : compatible MySQL 5.7)
        const [serviceRows] = await pool.execute(`
            SELECT services FROM events
            WHERE services IS NOT NULL AND DATE(date_start) BETWEEN ? AND ? AND status <> 'Annulé'
        `, [from, to]);

        const counter = {};
        serviceRows.forEach(row => parseServices(row.services).forEach(sv => {
            if (typeof sv === 'string' && sv.trim()) counter[sv.trim()] = (counter[sv.trim()] || 0) + 1;
        }));
        const topServices = Object.entries(counter)
            .sort((a, b) => b[1] - a[1]).slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        // 5. Occupation par site : jours réservés / (salles × jours de la période)
        const [siteRows] = await pool.execute(`
            SELECT p.id, p.name,
                (SELECT COUNT(*) FROM locations c WHERE c.parent_id = p.id) AS rooms_count,
                COALESCE((
                    SELECT SUM(GREATEST(0,
                        DATEDIFF(LEAST(DATE(e.date_end), ?), GREATEST(DATE(e.date_start), ?)) + 1))
                    FROM events e
                    JOIN locations l2 ON l2.id = e.location_id
                    WHERE e.status <> 'Annulé'
                      AND (l2.id = p.id OR l2.parent_id = p.id)
                      AND DATE(e.date_end) >= ? AND DATE(e.date_start) <= ?
                ), 0) AS booked_days
            FROM locations p
            WHERE p.parent_id IS NULL AND p.status <> 'archive'
            ORDER BY p.name
        `, [to, from, from, to]);

        const sites = siteRows.map(r => {
            const slots = Math.max(1, Number(r.rooms_count) || 1) * days;
            return {
                id: r.id,
                name: r.name,
                rooms_count: Number(r.rooms_count),
                occupancy: Math.min(100, Math.round((Number(r.booked_days) / slots) * 100))
            };
        });

        // 6. Meilleurs clients
        const [clients] = await pool.execute(`
            SELECT
                e.client_email,
                MAX(e.client_name) AS client_name,
                COUNT(*)           AS files,
                COALESCE(SUM(DATEDIFF(DATE(e.date_end), DATE(e.date_start)) + 1), 0) AS days,
                COALESCE(SUM(e.attendees), 0) AS attendees,
                (
                    SELECT CONCAT(
                        COALESCE((SELECT name FROM locations WHERE id = l.parent_id), ''),
                        IF(l.parent_id IS NOT NULL, ' - ', ''), l.name)
                    FROM events e2
                    JOIN locations l ON l.id = e2.location_id
                    WHERE e2.client_email = e.client_email
                    GROUP BY e2.location_id, l.parent_id, l.name
                    ORDER BY COUNT(*) DESC
                    LIMIT 1
                ) AS favourite_location
            FROM events e
            WHERE DATE(e.date_start) BETWEEN ? AND ?
            GROUP BY e.client_email
            ORDER BY files DESC, attendees DESC
            LIMIT 5
        `, [from, to]);

        const total = Number(kpi.total) || 0;
        const payTotal = payments.reduce((n, p) => n + Number(p.count), 0) || 1;

        res.json({
            period: { from, to, days },
            kpi: {
                total,
                confirmed: Number(kpi.confirmed) || 0,
                pending: Number(kpi.pending) || 0,
                cancelled: Number(kpi.cancelled) || 0,
                confirmRate: total ? Math.round((Number(kpi.confirmed) / total) * 100) : 0,
                attendees: Number(kpi.attendees) || 0,
                leadDays: Number(kpi.lead_days) || 0
            },
            monthly: monthly.map(m => ({
                month: Number(m.month),
                confirmed: Number(m.confirmed),
                pending: Number(m.pending),
                cancelled: Number(m.cancelled)
            })),
            payments: payments.map(p => ({
                label: p.label,
                count: Number(p.count),
                pct: Math.round((Number(p.count) / payTotal) * 100)
            })),
            topServices,
            sites,
            clients: clients.map(c => ({
                name: c.client_name,
                email: c.client_email,
                venue: c.favourite_location || '—',
                files: Number(c.files),
                days: Number(c.days),
                attendees: Number(c.attendees)
            }))
        });
    } catch (error) {
        console.error('❌ Erreur getOverview:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Conservé : ancien endpoint utilisé par le tableau de bord
exports.getStats = async (req, res) => {
    try {
        const [[{ total }]] = await pool.execute('SELECT COUNT(*) AS total FROM events');
        const [byStatus] = await pool.execute('SELECT status, COUNT(*) AS count FROM events GROUP BY status');
        const [byMonth] = await pool.execute(`
            SELECT MONTH(date_start) AS month, COUNT(*) AS count
            FROM events WHERE YEAR(date_start) = YEAR(CURDATE())
            GROUP BY MONTH(date_start) ORDER BY month
        `);
        const [rows] = await pool.execute('SELECT services FROM events WHERE services IS NOT NULL');

        const counter = {};
        rows.forEach(r => parseServices(r.services).forEach(sv => {
            if (typeof sv === 'string' && sv.trim()) counter[sv.trim()] = (counter[sv.trim()] || 0) + 1;
        }));

        res.json({
            total,
            byStatus,
            byMonth,
            topServices: Object.entries(counter).sort((a, b) => b[1] - a[1]).slice(0, 5)
                .map(([name, count]) => ({ name, count }))
        });
    } catch (error) {
        console.error('❌ Erreur getStats:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};