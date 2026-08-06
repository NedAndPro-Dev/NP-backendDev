const prisma = require('../config/prisma');

const SITE_FIELDS = ['type', 'address', 'city', 'quartier', 'latitude', 'longitude',
    'contact_name', 'contact_phone', 'contact_email', 'website', 'logo_url'];
const ROOM_FIELDS = ['capacity', 'surface', 'floor', 'layouts', 'equipment',
    'price_per_day', 'currency', 'is_bookable', 'plan_url'];
const COMMON_FIELDS = ['name', 'parent_id', 'description', 'status'];

// PostgreSQL rend les colonnes JSON déjà décodées, comme le faisait mysql2.
// On garde la tolérance d'origine : tout ce qui n'est pas un tableau
// exploitable ressort en tableau vide plutôt qu'en erreur.
const parseJson = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') {
        try { return JSON.parse(v); } catch { return []; }
    }
    return [];
};

/**
 * Occupation du mois courant : jours réservés / jours du mois.
 *
 * Remplace le sous-select MySQL qui combinait DATEDIFF, LEAST, GREATEST,
 * LAST_DAY et DATE_FORMAT. Le chevauchement se calcule ici en JavaScript :
 * traduire ces cinq fonctions en SQL PostgreSQL aurait donné une requête
 * brute, exactement ce que cette migration supprime.
 */
const jour = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

const statistiquesDuMois = async () => {
    const now = new Date();
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
    const finMois = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const joursDansLeMois = finMois.getDate();

    const events = await prisma.event.findMany({
        where: { status: { not: 'Annulé' } },
        select: { location_id: true, date_start: true, date_end: true }
    });

    const stats = new Map();
    for (const e of events) {
        const s = stats.get(e.location_id) || { events_count: 0, booked_days: 0 };
        s.events_count += 1;

        const debut = Math.max(jour(new Date(e.date_start)), jour(debutMois));
        const fin = Math.min(jour(new Date(e.date_end)), jour(finMois));
        s.booked_days += Math.max(0, Math.round((fin - debut) / 86400000) + 1);

        stats.set(e.location_id, s);
    }
    return { stats, joursDansLeMois };
};

class Location {
    // Arborescence complète : sites + salles + statistiques calculées
    static async getTree() {
        const [rows, { stats, joursDansLeMois }] = await Promise.all([
            prisma.location.findMany({ where: { status: { not: 'archive' } } }),
            statistiquesDuMois()
        ]);

        const map = (r) => {
            const s = stats.get(r.id) || { events_count: 0, booked_days: 0 };
            return {
                id: r.id,
                name: r.name,
                parent_id: r.parent_id,
                description: r.description,
                status: r.status,
                type: r.type,
                address: r.address,
                city: r.city,
                quartier: r.quartier,
                latitude: r.latitude,
                longitude: r.longitude,
                contact_name: r.contact_name,
                contact_phone: r.contact_phone,
                contact_email: r.contact_email,
                website: r.website,
                logo_url: r.logo_url,
                capacity: r.capacity,
                surface: r.surface,
                floor: r.floor,
                layouts: parseJson(r.layouts),
                equipment: parseJson(r.equipment),
                price_per_day: r.price_per_day,
                currency: r.currency,
                is_bookable: !!r.is_bookable,
                plan_url: r.plan_url,
                events_count: s.events_count,
                occupancy: Math.min(100, Math.round((s.booked_days / joursDansLeMois) * 100))
            };
        };

        // ORDER BY l.parent_id IS NULL DESC, l.name : sites d'abord, puis
        // salles, chaque groupe trié par nom.
        const parNom = (a, b) => String(a.name).localeCompare(String(b.name), 'fr');
        const sites = rows.filter(r => r.parent_id === null).map(map).sort(parNom);
        const rooms = rows.filter(r => r.parent_id !== null).map(map).sort(parNom);

        return sites.map(site => {
            const children = rooms.filter(r => r.parent_id === site.id);
            const occ = children.length
                ? Math.round(children.reduce((n, r) => n + r.occupancy, 0) / children.length)
                : site.occupancy;
            return {
                ...site,
                rooms: children,
                rooms_count: children.length,
                total_capacity: children.reduce((n, r) => n + (r.capacity || 0), 0),
                total_surface: children.reduce((n, r) => n + Number(r.surface || 0), 0),
                occupancy: occ
            };
        });
    }

    // Liste plate (compatibilité avec l'ancien endpoint / le select de Planifier)
    static async getAll() {
        const rows = await prisma.location.findMany({
            where: { status: 'actif' },
            select: {
                id: true, name: true, parent_id: true, capacity: true,
                parent: { select: { name: true } }
            }
        });

        // Tri en JavaScript : MySQL plaçait les NULL en tête sur ORDER BY
        // p.name, PostgreSQL les place en queue. Trier ici garantit le même
        // ordre qu'avant dans le select de la page Planifier.
        return rows
            .map(r => ({
                id: r.id,
                name: r.name,
                parent_id: r.parent_id,
                capacity: r.capacity,
                full_name: r.parent ? `${r.parent.name} - ${r.name}` : r.name,
                _parent: r.parent ? r.parent.name : null
            }))
            .sort((a, b) => {
                if (a._parent === null && b._parent !== null) return -1;
                if (a._parent !== null && b._parent === null) return 1;
                const p = String(a._parent || '').localeCompare(String(b._parent || ''), 'fr');
                return p !== 0 ? p : String(a.name).localeCompare(String(b.name), 'fr');
            })
            .map(({ _parent, ...r }) => r);
    }

    static async getParents() {
        return prisma.location.findMany({
            where: { parent_id: null, status: { not: 'archive' } },
            orderBy: { name: 'asc' }
        });
    }

    static async getChildren(parentId) {
        return prisma.location.findMany({
            where: { parent_id: Number(parentId), status: { not: 'archive' } },
            orderBy: { name: 'asc' }
        });
    }

    static async getById(id) {
        const row = await prisma.location.findUnique({ where: { id: Number(id) } });
        if (!row) return null;
        return { ...row, layouts: parseJson(row.layouts), equipment: parseJson(row.equipment) };
    }

    // Création : site (parent_id null) OU salle (parent_id renseigné)
    static async create(data) {
        const isRoom = !!data.parent_id;
        const payload = {
            name: data.name,
            parent_id: isRoom ? Number(data.parent_id) : null,
            description: data.description || null,
            status: data.status || 'actif'
        };

        if (isRoom) {
            Object.assign(payload, {
                capacity: data.capacity ?? null,
                surface: data.surface ?? null,
                floor: data.floor || null,
                layouts: data.layouts ?? null,
                equipment: data.equipment ?? null,
                price_per_day: data.price_per_day ?? null,
                currency: data.currency || 'XAF',
                is_bookable: data.is_bookable !== false,
                plan_url: data.plan_url || null
            });
        } else {
            Object.assign(payload, {
                type: data.type || 'Autre',
                address: data.address || null,
                city: data.city || null,
                quartier: data.quartier || null,
                latitude: data.latitude ?? null,
                longitude: data.longitude ?? null,
                contact_name: data.contact_name || null,
                contact_phone: data.contact_phone || null,
                contact_email: data.contact_email || null,
                website: data.website || null,
                logo_url: data.logo_url || null
            });
        }

        const created = await prisma.location.create({ data: payload, select: { id: true } });
        return this.getById(created.id);
    }

    static async update(id, data) {
        const current = await this.getById(id);
        if (!current) return null;

        const allowed = [...COMMON_FIELDS.filter(f => f !== 'parent_id'),
            ...(current.parent_id ? ROOM_FIELDS : SITE_FIELDS)];

        const payload = {};
        allowed.forEach(f => {
            if (data[f] === undefined) return;
            if (f === 'layouts' || f === 'equipment') payload[f] = data[f] ?? null;
            else if (f === 'is_bookable') payload[f] = Boolean(data[f]);
            else payload[f] = data[f] === '' ? null : data[f];
        });

        if (!Object.keys(payload).length) return current;
        await prisma.location.update({ where: { id: Number(id) }, data: payload });
        return this.getById(id);
    }

    // Nombre d'événements liés (au lieu / à ses salles) : bloque la suppression
    static async countLinkedEvents(id) {
        return prisma.event.count({
            where: {
                OR: [
                    { location_id: Number(id) },
                    { location: { parent_id: Number(id) } }
                ]
            }
        });
    }

    static async archive(id) {
        const r = await prisma.location.updateMany({
            where: { OR: [{ id: Number(id) }, { parent_id: Number(id) }] },
            data: { status: 'archive' }
        });
        return r.count > 0;
    }

    static async remove(id) {
        const r = await prisma.location.deleteMany({ where: { id: Number(id) } });
        return r.count > 0;
    }

    static async nameExists(name, parentId, exceptId = null) {
        // L'opérateur MySQL <=> comparait NULL à NULL ; Prisma traduit
        // parent_id: null en IS NULL, ce qui donne la même sémantique.
        const n = await prisma.location.count({
            where: {
                name,
                parent_id: parentId ? Number(parentId) : null,
                ...(exceptId ? { id: { not: Number(exceptId) } } : {})
            }
        });
        return n > 0;
    }
}

module.exports = Location;
