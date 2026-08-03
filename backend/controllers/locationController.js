const Location = require('../models/Location');

// GET /api/locations/tree — sites + salles + stats (page admin Lieux)
exports.getTree = async (req, res) => {
    try {
        res.json(await Location.getTree());
    } catch (error) {
        console.error('Erreur getTree lieux:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.getAllLocations = async (req, res) => {
    try { res.json(await Location.getAll()); }
    catch (e) { console.error(e); res.status(500).json({ message: 'Erreur serveur' }); }
};

exports.getParentLocations = async (req, res) => {
    try { res.json(await Location.getParents()); }
    catch (e) { console.error(e); res.status(500).json({ message: 'Erreur serveur' }); }
};

exports.getChildLocations = async (req, res) => {
    try { res.json(await Location.getChildren(req.params.parentId)); }
    catch (e) { console.error(e); res.status(500).json({ message: 'Erreur serveur' }); }
};

exports.getOne = async (req, res) => {
    try {
        const item = await Location.getById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Lieu introuvable' });
        res.json(item);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Erreur serveur' }); }
};

// POST /api/locations — crée un SITE ou une SALLE
exports.create = async (req, res) => {
    try {
        const isRoom = req.locationKind === 'salle';

        if (isRoom) {
            const parent = await Location.getById(req.body.parent_id);
            if (!parent) return res.status(422).json({ message: 'Site parent introuvable.' });
            if (parent.parent_id) {
                return res.status(422).json({ message: 'Une salle ne peut pas être rattachée à une autre salle.' });
            }
        }

        if (await Location.nameExists(req.body.name, isRoom ? req.body.parent_id : null)) {
            return res.status(409).json({ message: 'Un lieu porte déjà ce nom à cet emplacement.' });
        }

        const created = await Location.create(req.body);
        res.status(201).json({
            success: true,
            message: isRoom ? 'Salle créée avec succès' : 'Site créé avec succès',
            data: created
        });
    } catch (error) {
        console.error('Erreur création lieu:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// PUT /api/locations/:id
exports.update = async (req, res) => {
    try {
        const current = await Location.getById(req.params.id);
        if (!current) return res.status(404).json({ message: 'Lieu introuvable' });

        if (req.body.name && await Location.nameExists(req.body.name, current.parent_id, current.id)) {
            return res.status(409).json({ message: 'Un lieu porte déjà ce nom à cet emplacement.' });
        }

        const updated = await Location.update(req.params.id, req.body);
        res.json({ success: true, message: 'Lieu mis à jour', data: updated });
    } catch (error) {
        console.error('Erreur maj lieu:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// DELETE /api/locations/:id — archive si des événements y sont liés
exports.remove = async (req, res) => {
    try {
        const current = await Location.getById(req.params.id);
        if (!current) return res.status(404).json({ message: 'Lieu introuvable' });

        const linked = await Location.countLinkedEvents(current.id);
        if (linked > 0) {
            await Location.archive(current.id);
            return res.json({
                success: true, archived: true,
                message: `${linked} événement(s) référencent ce lieu : il a été archivé plutôt que supprimé.`
            });
        }

        await Location.remove(current.id);
        res.json({ success: true, archived: false, message: 'Lieu supprimé' });
    } catch (error) {
        console.error('Erreur suppression lieu:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};