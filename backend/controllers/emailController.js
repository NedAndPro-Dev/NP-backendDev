const nodemailer = require('nodemailer');
const ContactMessage = require('../models/ContactMessage');

// CONFIGURATION EMAIL

// Fonction pour créer le transporteur
const createTransporter = () => {
    console.log('📧 Création du transporteur email...');
    console.log('- EMAIL_USER:', process.env.EMAIL_USER);
    console.log('- EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Défini' : '❌ Manquant');
    console.log('- EMAIL_RECEIVE:', process.env.EMAIL_RECEIVE);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        throw new Error('Variables EMAIL_USER ou EMAIL_PASSWORD manquantes dans .env');
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

/* 
// CONFIGURATION FUTURE (PRODUCTION avec email professionnel)
const createTransporter = () => {
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER_PROD,
            pass: process.env.EMAIL_PASSWORD_PROD
        }
    });
};
*/


// ENVOYER UN MESSAGE DE CONTACT


exports.sendContactMessage = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        // Validation des champs
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs obligatoires doivent être remplis'
            });
        }

        // Validation format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Format d\'email invalide'
            });
        }

        // 1. SAUVEGARDER LE MESSAGE EN BASE DE DONNÉES
        const savedMessage = await ContactMessage.create({
            name,
            email,
            phone: phone || null,
            subject,
            message
        });

        console.log('✅ Message sauvegardé en base avec ID:', savedMessage.id);

        // 2. CRÉER LE TRANSPORTEUR
        const transporter = createTransporter();

        // 3. ENVOYER EMAIL À L'ADMIN
        const adminMailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_RECEIVE,
            subject: `[Contact NetandPro] ${subject}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #1e40af, #10b981); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
                        .info-row { margin-bottom: 15px; }
                        .label { font-weight: bold; color: #1e40af; }
                        .message-box { background: white; padding: 20px; border-left: 4px solid #10b981; margin-top: 20px; }
                        .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 0.9rem; border-radius: 0 0 8px 8px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>📧 Nouveau message de contact</h2>
                            <p>NetandProSystems</p>
                        </div>
                        <div class="content">
                            <div class="info-row">
                                <span class="label">👤 Nom :</span> ${name}
                            </div>
                            <div class="info-row">
                                <span class="label">📧 Email :</span> <a href="mailto:${email}">${email}</a>
                            </div>
                            <div class="info-row">
                                <span class="label">📞 Téléphone :</span> ${phone || 'Non renseigné'}
                            </div>
                            <div class="info-row">
                                <span class="label">📋 Sujet :</span> ${subject}
                            </div>
                            <div class="message-box">
                                <strong>💬 Message :</strong>
                                <p>${message.replace(/\n/g, '<br>')}</p>
                            </div>
                        </div>
                        <div class="footer">
                            <p>Message reçu depuis le formulaire de contact NetandProSystems</p>
                            <p>ID du message : #${savedMessage.id}</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        // 4. ENVOYER EMAIL DE CONFIRMATION AU CLIENT
        const clientMailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Confirmation de réception - NetandProSystems',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #1e40af, #10b981); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
                        .success-icon { font-size: 3rem; }
                        .message-recap { background: #f9fafb; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; }
                        .footer { background: #1f2937; color: white; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; }
                        .contact-info { margin-top: 20px; }
                        .contact-info div { margin: 8px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="success-icon">✅</div>
                            <h2>Message bien reçu !</h2>
                            <p>NetandProSystems</p>
                        </div>
                        <div class="content">
                            <p>Bonjour <strong>${name}</strong>,</p>
                            <p>Nous avons bien reçu votre message concernant :</p>
                            <p style="text-align: center; font-size: 1.2rem; color: #1e40af;"><strong>"${subject}"</strong></p>
                            
                            <p>Notre équipe vous répondra dans les <strong>plus brefs délais</strong> (généralement sous 24h ouvrables).</p>
                            
                            <div class="message-recap">
                                <strong>📝 Récapitulatif de votre message :</strong>
                                <p style="margin-top: 10px;">${message.replace(/\n/g, '<br>')}</p>
                            </div>

                            <p>Si vous avez une question urgente, n'hésitez pas à nous appeler directement.</p>
                        </div>
                        <div class="footer">
                            <p><strong>Cordialement,</strong><br>L'équipe NetandProSystems</p>
                            <div class="contact-info">
                                <div>📞 <strong>Téléphone :</strong> <a href="tel:+237698200792" style="color: #10b981;">+237 698 200 792</a></div>
                                <div>📧 <strong>Email :</strong> <a href="mailto:contact@netandprosystems.com" style="color: #10b981;">contact@netandprosystems.com</a></div>
                                <div>📍 <strong>Localisation :</strong> Yaoundé, Cameroun</div>
                            </div>
                            <p style="margin-top: 20px; font-size: 0.9rem; color: #9ca3af;">
                                © 2025 NetandProSystems. Tous droits réservés.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        // Envoyer les deux emails
        await transporter.sendMail(adminMailOptions);
        console.log('✅ Email envoyé à l\'admin');

        await transporter.sendMail(clientMailOptions);
        console.log('✅ Email de confirmation envoyé au client');

        // Réponse au frontend
        res.json({
            success: true,
            message: 'Message envoyé avec succès'
        });

    } catch (error) {
        console.error('❌ Erreur envoi email:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'envoi du message. Veuillez réessayer.',
            error: error.message
        });
    }
};

// TEST DE CONFIGURATION EMAIL

exports.testEmailConfig = async (req, res) => {
    try {
        console.log('🧪 Test de configuration email...');
        
        // Créer le transporteur
        const transporter = createTransporter();
        
        // Vérifier la connexion
        await transporter.verify();
        
        console.log('✅ Configuration email OK');
        
        res.json({
            success: true,
            message: 'Configuration email OK ✅',
            config: {
                user: process.env.EMAIL_USER,
                service: 'Gmail',
                passwordSet: !!process.env.EMAIL_PASSWORD,
                receiveEmail: process.env.EMAIL_RECEIVE
            }
        });
    } catch (error) {
        console.error('❌ Erreur configuration email:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur configuration email',
            error: error.message,
            details: {
                user: process.env.EMAIL_USER || 'NON DÉFINI',
                passwordSet: !!process.env.EMAIL_PASSWORD,
                receiveEmail: process.env.EMAIL_RECEIVE || 'NON DÉFINI'
            }
        });
    }
};