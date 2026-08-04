const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();

const c = require('../controllers/settingsController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireSuperAdmin } = require('../middleware/roleMiddleware');

// Upload logo / favicon
const DIR = path.join(__dirname, '..', '..', 'uploads', 'branding');
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, DIR),
        filename: (req, file, cb) =>
            cb(null, `${req.params.kind}-${Date.now()}${path.extname(file.originalname).toLowerCase()}`)
    }),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => cb(
        /^image\/(png|jpeg|webp|svg\+xml|x-icon|vnd\.microsoft\.icon)$/.test(file.mimetype)
            ? null : new Error('Format non accepté : PNG, JPG, WEBP, SVG ou ICO.'),
        true
    )
});

// Le site public lit la configuration sans authentification
router.get('/public', c.getPublic);

// Tout le reste est réservé au super admin
router.use(authMiddleware, requireSuperAdmin);

router.get('/', c.getAll);
router.patch('/', c.update);
router.get('/export', c.exportConfig);
router.post('/reset/:group', c.resetGroup);

router.post('/branding/:kind', upload.single('file'), c.uploadBranding);

router.put('/hours', c.updateHours);
router.post('/closures', c.addClosure);
router.delete('/closures/:id', c.removeClosure);

router.post('/services', c.addService);
router.patch('/services/:id', c.updateService);
router.delete('/services/:id', c.removeService);

router.get('/templates/:key', c.getTemplate);
router.patch('/templates/:key', c.updateTemplate);
router.post('/test-email', c.testEmail);
router.get('/verify-smtp', c.verifySmtp);

router.get('/health', c.health);
router.get('/maintenance-log', c.maintenanceLog);
router.post('/backup', c.backupNow);
router.get('/backups/:file', c.downloadBackup);
router.post('/clear-cache', c.clearCache);
router.post('/purge-logs', c.purgeLogs);
router.post('/purge-cancelled', c.purgeCancelled);

// Erreurs multer (taille, format)
router.use((err, req, res, next) => {
    if (err) return res.status(422).json({ message: err.message });
    next();
});

module.exports = router;