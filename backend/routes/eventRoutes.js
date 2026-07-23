const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');

// ROUTES PUBLIQUES
// Calendrier page d'accueil (visiteurs)
router.get('/public', eventController.getPublicEvents);

// Créer un événement depuis le formulaire Planifier (visiteurs)
router.post('/', eventController.createEvent);

// ROUTES ADMIN (PROTÉGÉES)
// Liste complète des événements (admin)
router.get('/', authMiddleware, eventController.getAllEvents);

// Détails d'un événement (admin)
router.get('/:id', authMiddleware, eventController.getEventById);

// Modifier un événement (admin)
router.put('/:id', authMiddleware, eventController.updateEvent);

// Changer le statut d'un événement (admin)
router.patch('/:id/status', authMiddleware, eventController.updateEventStatus);

// Supprimer un événement (admin)
router.delete('/:id', authMiddleware, eventController.deleteEvent);

module.exports = router;