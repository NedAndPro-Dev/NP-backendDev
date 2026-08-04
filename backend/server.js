const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Import des routes
const eventRoutes = require('./routes/eventRoutes');
const locationRoutes = require('./routes/locationRoutes');
const authRoutes = require('./routes/authRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const statsRoutes = require('./routes/statsRoutes');
const emailRoutes = require('./routes/emailRoutes');
const contactRoutes = require('./routes/contactRoutes');
const userRoutes = require('./routes/userRoutes');
const { mountApiDocs } = require('./docs/swagger');

const path = require('path');
const settingsRoutes = require('./routes/settingsRoutes');
const maintenanceMode = require('./middleware/maintenanceMode');
require('./services/autoBackup').start();

require('./utils/cleanupTestimonials');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares de sécurité
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
    origin: (process.env.CORS_ORIGIN || "http://localhost:3000").split(",").map(s => s.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(maintenanceMode);
app.use(express.urlencoded({ extended: true }));

// Header de sécurité : Empêcher l'indexation des pages admin
app.use((req, res, next) => {
    if (req.path.startsWith('/admin')) {
        res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    }
    next();
});

// Servir les fichiers déposés (logo, favicon)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes API
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Backend NetandPro opérationnel' });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/contact-messages', contactRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);

mountApiDocs(app);

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).json({ error: 'Route non trouvée' });
});

// Démarrage serveur
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Serveur backend démarré sur http://localhost:${PORT}`);
});