const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Connexion admin
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation des champs
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email et mot de passe requis'
            });
        }

        // Trouver l'utilisateur
        const user = await User.findByEmail(email);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Identifiants incorrects'
            });
        }

        // Vérifier le mot de passe
        const isPasswordValid = await User.verifyPassword(password, user.password_hash);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Identifiants incorrects'
            });
        }

        // Vérifier si le mot de passe a expiré
        const isExpired = User.isPasswordExpired(user);
        
        if (isExpired) {
            return res.status(403).json({
                success: false,
                passwordExpired: true,
                message: 'Votre mot de passe a expiré. Veuillez le changer.'
            });
        }

        // Générer le token JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.json({
            success: true,
            message: 'Connexion réussie',
            token,
            user: {
                id: user.id,
                email: user.email,
                passwordExpiration: user.password_expiration
            }
        });

    } catch (error) {
        console.error('Erreur login:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// Changer le mot de passe
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userEmail = req.user.email; // Depuis le middleware auth

        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Ancien et nouveau mot de passe requis'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Le nouveau mot de passe doit contenir au moins 8 caractères'
            });
        }

        // Vérifier l'ancien mot de passe
        const user = await User.findByEmail(userEmail);
        const isValid = await User.verifyPassword(currentPassword, user.password_hash);

        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Mot de passe actuel incorrect'
            });
        }

        // Mettre à jour le mot de passe
        await User.updatePassword(userEmail, newPassword);

        res.json({
            success: true,
            message: 'Mot de passe modifié avec succès. Nouvelle expiration : 3 mois.'
        });

    } catch (error) {
        console.error('Erreur changement mot de passe:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

// Vérifier le token (pour maintenir la session)
exports.verifyToken = async (req, res) => {
    try {
        const user = await User.findByEmail(req.user.email);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                passwordExpiration: user.password_expiration
            }
        });

    } catch (error) {
        console.error('Erreur vérification token:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};