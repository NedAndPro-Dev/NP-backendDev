const Location = require('../models/Location');

// Récupérer tous les lieux
const getAllLocations = async (req, res) => {
    try {
        const locations = await Location.getAll();
        res.json(locations);
    } catch (error) {
        console.error('Erreur récupération lieux:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Récupérer les lieux parents
const getParentLocations = async (req, res) => {
    try {
        const parents = await Location.getParents();
        res.json(parents);
    } catch (error) {
        console.error('Erreur récupération lieux parents:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Récupérer les sous-lieux
const getChildLocations = async (req, res) => {
    try {
        const children = await Location.getChildren(req.params.parentId);
        res.json(children);
    } catch (error) {
        console.error('Erreur récupération sous-lieux:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = {
    getAllLocations,
    getParentLocations,
    getChildLocations
};