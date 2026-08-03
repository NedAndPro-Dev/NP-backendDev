const TYPES = ['Hôtel', 'Club privé', 'Centre de congrès', 'Salle des fêtes', 'Autre'];

// Valide indifféremment un SITE (parent_id absent) ou une SALLE (parent_id présent)
const validateLocation = (req, res, next) => {
    const b = req.body || {};
    const errors = [];
    const isRoom = b.parent_id !== undefined && b.parent_id !== null && b.parent_id !== '';

    if (!b.name || String(b.name).trim().length < 2) {
        errors.push('Le nom est obligatoire (2 caractères minimum).');
    }

    if (isRoom) {
        if (!Number.isInteger(Number(b.parent_id))) errors.push('Site parent invalide.');
        if (b.capacity === undefined || Number(b.capacity) <= 0) {
            errors.push('La capacité de la salle est obligatoire et doit être supérieure à 0.');
        }
        if (b.surface !== undefined && b.surface !== null && Number(b.surface) < 0) {
            errors.push('La surface ne peut pas être négative.');
        }
        if (b.price_per_day !== undefined && b.price_per_day !== null && Number(b.price_per_day) < 0) {
            errors.push('Le tarif ne peut pas être négatif.');
        }
    } else {
        if (!b.type || !TYPES.includes(b.type)) {
            errors.push(`Le type du site est obligatoire (${TYPES.join(', ')}).`);
        }
        if (!b.address || String(b.address).trim().length < 3) {
            errors.push("L'adresse du site est obligatoire.");
        }
        if (b.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.contact_email)) {
            errors.push("L'email de contact est invalide.");
        }
    }

    if (errors.length) {
        return res.status(422).json({ success: false, message: errors[0], errors });
    }

    req.locationKind = isRoom ? 'salle' : 'site';
    next();
};

module.exports = { validateLocation, TYPES };