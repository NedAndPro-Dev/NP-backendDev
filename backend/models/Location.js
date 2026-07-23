const pool = require('../config/database');

class Location {
    // Récupérer tous les lieux avec hiérarchie
    static async getAll() {
        const query = `
            SELECT 
                l.id,
                l.name,
                l.parent_id,
                CONCAT(
                    COALESCE(p.name, ''),
                    IF(l.parent_id IS NOT NULL, ' - ', ''),
                    l.name
                ) as full_name
            FROM locations l
            LEFT JOIN locations p ON l.parent_id = p.id
            ORDER BY p.name, l.name
        `;

        const [rows] = await pool.execute(query);
        return rows;
    }

    // Récupérer les lieux parents uniquement
    static async getParents() {
        const query = 'SELECT * FROM locations WHERE parent_id IS NULL ORDER BY name';
        const [rows] = await pool.execute(query);
        return rows;
    }

    // Récupérer les sous-lieux d'un parent
    static async getChildren(parentId) {
        const query = 'SELECT * FROM locations WHERE parent_id = ? ORDER BY name';
        const [rows] = await pool.execute(query, [parentId]);
        return rows;
    }
}

module.exports = Location;