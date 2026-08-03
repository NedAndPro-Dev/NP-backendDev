const pool = require('../config/database');

const SITE_FIELDS = ['type','address','city','quartier','latitude','longitude',
    'contact_name','contact_phone','contact_email','website','logo_url'];
const ROOM_FIELDS = ['capacity','surface','floor','layouts','equipment',
    'price_per_day','currency','is_bookable','plan_url'];
const COMMON_FIELDS = ['name','parent_id','description','status'];

// Occupation du mois courant : jours réservés / jours du mois
const STATS_SQL = `
    SELECT
        e.location_id,
        COUNT(*) AS events_count,
        COALESCE(SUM(GREATEST(0,
            DATEDIFF(
                LEAST(DATE(e.date_end),   LAST_DAY(CURDATE())),
                GREATEST(DATE(e.date_start), DATE_FORMAT(CURDATE(), '%Y-%m-01'))
            ) + 1
        )), 0) AS booked_days
    FROM events e
    WHERE e.status <> 'Annulé'
    GROUP BY e.location_id
`;

const asJson = (v) => (v === undefined || v === null ? null : JSON.stringify(v));
const parseJson = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    try { return JSON.parse(v); } catch { return []; }
};

class Location {
    // Arborescence complète : sites + salles + statistiques calculées
    static async getTree() {
        const [rows] = await pool.execute(`
            SELECT l.*,
                   COALESCE(s.events_count, 0) AS events_count,
                   COALESCE(s.booked_days, 0)  AS booked_days,
                   DAY(LAST_DAY(CURDATE()))    AS days_in_month
            FROM locations l
            LEFT JOIN (${STATS_SQL}) s ON s.location_id = l.id
            WHERE l.status <> 'archive'
            ORDER BY l.parent_id IS NULL DESC, l.name
        `);

        const map = (r) => ({
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
            events_count: Number(r.events_count),
            occupancy: Math.min(100, Math.round((Number(r.booked_days) / Number(r.days_in_month)) * 100))
        });

        const sites = rows.filter(r => r.parent_id === null).map(map);
        const rooms = rows.filter(r => r.parent_id !== null).map(map);

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
        const [rows] = await pool.execute(`
            SELECT l.id, l.name, l.parent_id, l.capacity,
                   CONCAT(COALESCE(p.name, ''),
                          IF(l.parent_id IS NOT NULL, ' - ', ''),
                          l.name) AS full_name
            FROM locations l
            LEFT JOIN locations p ON l.parent_id = p.id
            WHERE l.status = 'actif'
            ORDER BY p.name, l.name
        `);
        return rows;
    }

    static async getParents() {
        const [rows] = await pool.execute(
            "SELECT * FROM locations WHERE parent_id IS NULL AND status <> 'archive' ORDER BY name");
        return rows;
    }

    static async getChildren(parentId) {
        const [rows] = await pool.execute(
            "SELECT * FROM locations WHERE parent_id = ? AND status <> 'archive' ORDER BY name", [parentId]);
        return rows;
    }

    static async getById(id) {
        const [rows] = await pool.execute('SELECT * FROM locations WHERE id = ?', [id]);
        if (!rows.length) return null;
        return { ...rows[0], layouts: parseJson(rows[0].layouts), equipment: parseJson(rows[0].equipment) };
    }

    // Création : site (parent_id null) OU salle (parent_id renseigné)
    static async create(data) {
        const isRoom = !!data.parent_id;
        const payload = {
            name: data.name,
            parent_id: isRoom ? data.parent_id : null,
            description: data.description || null,
            status: data.status || 'actif'
        };

        if (isRoom) {
            Object.assign(payload, {
                capacity: data.capacity ?? null,
                surface: data.surface ?? null,
                floor: data.floor || null,
                layouts: asJson(data.layouts),
                equipment: asJson(data.equipment),
                price_per_day: data.price_per_day ?? null,
                currency: data.currency || 'XAF',
                is_bookable: data.is_bookable === false ? 0 : 1,
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

        const keys = Object.keys(payload);
        const [result] = await pool.execute(
            `INSERT INTO locations (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`,
            keys.map(k => payload[k])
        );
        return this.getById(result.insertId);
    }

    static async update(id, data) {
        const current = await this.getById(id);
        if (!current) return null;

        const allowed = [...COMMON_FIELDS.filter(f => f !== 'parent_id'),
            ...(current.parent_id ? ROOM_FIELDS : SITE_FIELDS)];

        const sets = [], values = [];
        allowed.forEach(f => {
            if (data[f] === undefined) return;
            sets.push(`${f} = ?`);
            if (f === 'layouts' || f === 'equipment') values.push(asJson(data[f]));
            else if (f === 'is_bookable') values.push(data[f] ? 1 : 0);
            else values.push(data[f] === '' ? null : data[f]);
        });

        if (!sets.length) return current;
        values.push(id);
        await pool.execute(`UPDATE locations SET ${sets.join(', ')} WHERE id = ?`, values);
        return this.getById(id);
    }

    // Nombre d'événements liés (au lieu / à ses salles) : bloque la suppression
    static async countLinkedEvents(id) {
        const [rows] = await pool.execute(`
            SELECT COUNT(*) AS total FROM events
            WHERE location_id = ? OR location_id IN (SELECT id FROM locations WHERE parent_id = ?)
        `, [id, id]);
        return Number(rows[0].total);
    }

    static async archive(id) {
        const [r] = await pool.execute(
            "UPDATE locations SET status = 'archive' WHERE id = ? OR parent_id = ?", [id, id]);
        return r.affectedRows > 0;
    }

    static async remove(id) {
        const [r] = await pool.execute('DELETE FROM locations WHERE id = ?', [id]);
        return r.affectedRows > 0;
    }

    static async nameExists(name, parentId, exceptId = null) {
        const [rows] = await pool.execute(`
            SELECT id FROM locations
            WHERE name = ? AND parent_id <=> ? AND (? IS NULL OR id <> ?)
        `, [name, parentId || null, exceptId, exceptId]);
        return rows.length > 0;
    }
}

module.exports = Location;