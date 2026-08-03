const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateLocation } = require('../middleware/validation');

// Lecture publique (formulaire Planifier)
router.get('/', locationController.getAllLocations);
router.get('/parents', locationController.getParentLocations);
router.get('/children/:parentId', locationController.getChildLocations);

// Lecture admin
router.get('/tree', authMiddleware, locationController.getTree);
router.get('/:id', authMiddleware, locationController.getOne);

// Écriture admin — même endpoint pour un site et pour une salle
router.post('/',    authMiddleware, validateLocation, locationController.create);
router.put('/:id',  authMiddleware, validateLocation, locationController.update);
router.delete('/:id', authMiddleware, locationController.remove);

module.exports = router;