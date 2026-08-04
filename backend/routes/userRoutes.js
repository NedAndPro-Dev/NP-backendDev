const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireSuperAdmin } = require('../middleware/roleMiddleware');

router.use(authMiddleware, requireSuperAdmin);   // gestion des comptes = super admin uniquement

router.get('/', userController.list);
router.post('/', userController.invite);
router.patch('/:id', userController.update);
router.patch('/:id/role', userController.setRole);
router.patch('/:id/active', userController.setActive);
router.patch('/:id/twofa', userController.setTwofa);
router.post('/:id/reset-password', userController.resetPassword);
router.delete('/:id', userController.remove);

module.exports = router;