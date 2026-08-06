const prisma = require('../config/prisma');

/**
 * Les statistiques reposaient sur six requêtes MySQL enchaînant MONTH(),
 * YEAR(), DATEDIFF(), LEAST(), GREATEST() et des sous-selects corrélés.
 * Traduire cela en SQL PostgreSQL aurait reconduit du SQL brut, que cette
 * migration supprime.
 *
 * On lit donc une fois les événements de la période, puis on agrège en
 * JavaScript. La volumétrie s'y prête — quelques centaines d'événements
 * par an — et le calcul devient lisible et testable sans base.
 */

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

// DATE(x) : la journée civile, indépendamment de l'heure
const jour = (d) => {
    const x = new Date(d);
    return Date.UTC(x.getFullYear(), x.getMonth(), x.getDate());
};

// DATEDIFF(a, b) : écart en jours civils
const diffJours = (a, b) => Math.round((jour(a) - jour(b)) / 86400000);

const nomLieu = (l) => (l ? (l.parent ? `${l.parent.name} - ${l.name}` : l.name) : null);

const compterServices = (events) => {
    const counter = {};
    events.forEach(e => parseServices(e.services).forEach(sv => {
        if (typeof sv === 'string' && sv.trim()) counter[sv.trim()] = (counter[sv.trim()] || 0) + 1;
    }));
    return Object.entries(counter)
        .sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([name, count]) => ({ name, count }));
};

// GET /api/stats/overview?period=annee
exports.getOverview = async (req, res) => {
    try {
        const { from, to, days } = resolveRange(req.query.period);
        const debut = new Date(`${from}T00:00:00`);
        const fin = new Date(`${to}T23:59:59.999`);

        const [events, sitesRacine] = await Promise.all([
            prisma.event.findMany({
                where: { date_start: { gte: debut, lte: fin } },
                include: { location: { include: { parent: true } } }
            }),
            prisma.location.findMany({
                where: { parent_id: null, status: { not: 'archive' } },
                include: { children: { select: { id: true } } }
            })
        ]);

        const actifs = events.filter(e => e.status !== 'Annulé');

        // 1. Volumétrie + KPI
        const confirmed = events.filter(e => e.status === 'Confirmé').length;
        const total = events.length;
        // ROUND(AVG(GREATEST(0, DATEDIFF(date_start, created_at))), 1)
        const preavis = events.map(e => Math.max(0, diffJours(e.date_start, e.created_at)));
        const leadDays = preavis.length
            ? Math.round((preavis.reduce((n, v) => n + v, 0) / preavis.length) * 10) / 10
            : 0;

        // 2. Par mois, éclaté par statut — seuls les mois présents, comme GROUP BY
        const parMois = new Map();
        events.forEach(e => {
            const m = new Date(e.date_start).getMonth() + 1;
            const cur = parMois.get(m) || { month: m, confirmed: 0, pending: 0, cancelled: 0 };
            if (e.status === 'Confirmé') cur.confirmed++;
            else if (e.status === 'En attente') cur.pending++;
            else if (e.status === 'Annulé') cur.cancelled++;
            parMois.set(m, cur);
        });
        const monthly = [...parMois.values()].sort((a, b) => a.month - b.month);

        // 3. Modes de paiement
        const parPaiement = new Map();
        actifs.forEach(e => parPaiement.set(e.payment_method, (parPaiement.get(e.payment_method) || 0) + 1));
        const payments = [...parPaiement.entries()]
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count);

        // 4. Services
        const topServices = compterServices(actifs);

        // 5. Occupation par site : jours réservés / (salles × jours de la période)
        const sites = sitesRacine
            .sort((a, b) => String(a.name).localeCompare(String(b.name), 'fr'))
            .map(site => {
                const idsSite = new Set([site.id, ...site.children.map(c => c.id)]);
                const bookedDays = events
                    .filter(e => e.status !== 'Annulé' && idsSite.has(e.location_id))
                    .reduce((n, e) => {
                        // SUM(GREATEST(0, DATEDIFF(LEAST(fin, to), GREATEST(début, from)) + 1))
                        const d = Math.min(jour(e.date_end), jour(fin));
                        const g = Math.max(jour(e.date_start), jour(debut));
                        return n + Math.max(0, Math.round((d - g) / 86400000) + 1);
                    }, 0);

                const roomsCount = site.children.length;
                const slots = Math.max(1, roomsCount || 1) * days;
                return {
                    id: site.id,
                    name: site.name,
                    rooms_count: roomsCount,
                    occupancy: Math.min(100, Math.round((bookedDays / slots) * 100))
                };
            });

        // 6. Meilleurs clients
        const parClient = new Map();
        events.forEach(e => {
            const c = parClient.get(e.client_email) || {
                email: e.client_email, name: null, files: 0, days: 0,
                attendees: 0, lieux: new Map()
            };
            c.files += 1;
            c.days += diffJours(e.date_end, e.date_start) + 1;
            c.attendees += e.attendees || 0;
            // MAX(client_name) : le nom le plus grand, à l'identique
            if (c.name === null || e.client_name > c.name) c.name = e.client_name;
            const lieu = nomLieu(e.location);
            if (lieu) c.lieux.set(lieu, (c.lieux.get(lieu) || 0) + 1);
            parClient.set(e.client_email, c);
        });

        const clients = [...parClient.values()]
            .sort((a, b) => b.files - a.files || b.attendees - a.attendees)
            .slice(0, 5)
            .map(c => ({
                name: c.name,
                email: c.email,
                venue: [...c.lieux.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '—',
                files: c.files,
                days: c.days,
                attendees: c.attendees
            }));

        const payTotal = payments.reduce((n, p) => n + p.count, 0) || 1;

        res.json({
            period: { from, to, days },
            kpi: {
                total,
                confirmed,
                pending: events.filter(e => e.status === 'En attente').length,
                cancelled: events.filter(e => e.status === 'Annulé').length,
                confirmRate: total ? Math.round((confirmed / total) * 100) : 0,
                attendees: actifs.reduce((n, e) => n + (e.attendees || 0), 0),
                leadDays
            },
            monthly,
            payments: payments.map(p => ({
                ...p,
                pct: Math.round((p.count / payTotal) * 100)
            })),
            topServices,
            sites,
            clients
        });
    } catch (error) {
        console.error('❌ Erreur getOverview:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Conservé : ancien endpoint utilisé par le tableau de bord
exports.getStats = async (req, res) => {
    try {
        const annee = new Date().getFullYear();

        const [total, parStatut, events] = await Promise.all([
            prisma.event.count(),
            prisma.event.groupBy({ by: ['status'], _count: { _all: true } }),
            prisma.event.findMany({ select: { date_start: true, services: true } })
        ]);

        // YEAR(date_start) = YEAR(CURDATE()), groupé par mois
        const parMois = new Map();
        events
            .filter(e => new Date(e.date_start).getFullYear() === annee)
            .forEach(e => {
                const m = new Date(e.date_start).getMonth() + 1;
                parMois.set(m, (parMois.get(m) || 0) + 1);
            });

        res.json({
            total,
            byStatus: parStatut.map(r => ({ status: r.status, count: r._count._all })),
            byMonth: [...parMois.entries()]
                .map(([month, count]) => ({ month, count }))
                .sort((a, b) => a.month - b.month),
            topServices: compterServices(events)
        });
    } catch (error) {
        console.error('❌ Erreur getStats:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};
