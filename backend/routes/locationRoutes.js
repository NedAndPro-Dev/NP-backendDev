const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

router.get('/', locationController.getAllLocations);
router.get('/parents', locationController.getParentLocations);
router.get('/children/:parentId', locationController.getChildLocations);

module.exports = router;