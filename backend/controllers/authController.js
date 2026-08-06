const jwt = require("jsonwebtoken");
const User = require("../models/User");
const audit = require("../services/audit");
const PasswordResetCode = require("../models/PasswordResetCode");
const { sendRaw } = require("../utils/mailer");

// Connexion admin
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation des champs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe requis",
      });
    }

    // Trouver l'utilisateur
    const user = await User.findByEmail(email);

    if (!user) {
      await audit.record(req, {
        category: 'acces', action: 'Connexion refusée', target: email,
        detail: 'Email inconnu', status: 'echec', httpStatus: 401
      });
      return res.status(401).json({
        success: false,
        message: "Identifiants incorrects",
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await User.verifyPassword(
      password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      await audit.record(req, {
        category: 'acces', action: 'Connexion refusée', target: email,
        detail: 'Email ou mot de passe incorrect', status: 'echec', httpStatus: 401
      });
      return res.status(401).json({
        success: false,
        message: "Identifiants incorrects",
      });
    }

    //  refuser un compte suspendu
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Ce compte a été suspendu. Contactez un super admin.",
      });
    }

    // Vérifier si le mot de passe a expiré
    const isExpired = User.isPasswordExpired(user);

    if (isExpired) {
      return res.status(403).json({
        success: false,
        passwordExpired: true,
        message: "Votre mot de passe a expiré. Veuillez le réinitialiser.",
      });
    }

    // Générer le token JWT — le rôle y est signé, roleMiddleware s'appuie dessus
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" },
    );

    // Tracer la connexion
    await User.touchLogin(user.id);

    // authMiddleware n'est pas passé par là : on renseigne l'acteur nous-mêmes.
    // On mute req plutôt que d'en faire une copie : `headers` est un accesseur
    // de prototype, qu'un spread ne recopierait pas (l'audit perdrait l'IP).
    req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    await audit.record(req, {
      category: 'acces', action: 'Connexion réussie', target: 'Console admin',
      httpStatus: 200
    });

    res.json({
      success: true,
      message: "Connexion réussie",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: !!user.must_change_password,
        passwordExpiration: user.password_expiration,
      },
    });
  } catch (error) {
    console.error("Erreur login:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};

// Changer le mot de passe (connecté)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userEmail = req.user.email; // Depuis le middleware auth

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Ancien et nouveau mot de passe requis",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Le nouveau mot de passe doit contenir au moins 8 caractères",
      });
    }

    // Vérifier l'ancien mot de passe
    const user = await User.findByEmail(userEmail);
    const isValid = await User.verifyPassword(
      currentPassword,
      user.password_hash,
    );

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Mot de passe actuel incorrect",
      });
    }

    // Mettre à jour le mot de passe
    await User.updatePassword(userEmail, newPassword);

    res.json({
      success: true,
      message:
        "Mot de passe modifié avec succès. Nouvelle expiration : 3 mois.",
    });
  } catch (error) {
    console.error("Erreur changement mot de passe:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
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
        message: "Utilisateur non trouvé",
      });
    }

    // Même forme que la réponse de login : AuthContext remplace l'utilisateur
    // par ce que renvoie /verify au rechargement. Toute clé absente ici est
    // perdue pour l'interface, même si login l'avait bien fournie.
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: !!user.must_change_password,
        passwordExpiration: user.password_expiration,
      },
    });
  } catch (error) {
    console.error("Erreur vérification token:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};

// ─────────────────────────────────────────────────────────────
// Réinitialisation par code à 6 chiffres
// (mot de passe oublié ET mot de passe expiré à la connexion)
// Réutilise sendRaw (mailer.js) et User.updatePassword existants.
// ─────────────────────────────────────────────────────────────

// Étape 1 : demander un code
exports.requestResetCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email requis" });
    }

    const user = await User.findByEmail(email);

    // On n'agit que si le compte existe et est actif, mais la réponse reste identique
    if (user && user.is_active) {
      const code = await PasswordResetCode.create(email);
      try {
        await sendRaw({
          to: email,
          subject: "Votre code de vérification",
          title: "Code de vérification",
          subtitle: "Réinitialisation du mot de passe",
          html: `
            <p style="margin:0 0 16px;color:#64748b">Voici votre code pour réinitialiser votre mot de passe :</p>
            <div style="font-size:34px;font-weight:800;letter-spacing:10px;text-align:center;color:#0f1b33;background:#eef2ff;border-radius:12px;padding:18px">${code}</div>
            <p style="margin:16px 0 0;color:#94a3b8;font-size:13px">Ce code expire dans 10 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
          `,
        });
      } catch (mailError) {
        console.error("Envoi code échoué:", mailError.message);
        return res.status(500).json({
          success: false,
          message: "Impossible d'envoyer l'email. Réessayez plus tard.",
        });
      }
    }

    return res.json({
      success: true,
      message: "Si un compte existe pour cette adresse, un code vient d'être envoyé.",
    });
  } catch (error) {
    console.error("Erreur requestResetCode:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// Étape 2 : vérifier le code → jeton de réinitialisation court
exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, message: "Email et code requis" });
    }

    const result = await PasswordResetCode.verify(email, String(code).trim());

    if (!result.ok) {
      const message =
        result.reason === "expired" ? "Code expiré. Demandez-en un nouveau."
        : result.reason === "locked" ? "Trop de tentatives. Demandez un nouveau code."
        : "Code incorrect.";
      return res.status(400).json({ success: false, message });
    }

    await PasswordResetCode.markUsed(result.id);

    const resetToken = jwt.sign(
      { email, purpose: "password_reset" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    return res.json({ success: true, resetToken });
  } catch (error) {
    console.error("Erreur verifyResetCode:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// Étape 3 : définir le nouveau mot de passe avec le jeton de réinitialisation
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ success: false, message: "Jeton et nouveau mot de passe requis" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Le nouveau mot de passe doit contenir au moins 8 caractères",
      });
    }

    let payload;
    try {
      payload = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        message: "Session de réinitialisation expirée. Recommencez.",
      });
    }

    if (payload.purpose !== "password_reset" || !payload.email) {
      return res.status(401).json({ success: false, message: "Jeton invalide" });
    }

    const user = await User.findByEmail(payload.email);
    if (!user) {
      return res.status(404).json({ success: false, message: "Compte introuvable" });
    }

    await User.updatePassword(payload.email, newPassword);

    res.json({
      success: true,
      message: "Mot de passe réinitialisé. Nouvelle expiration : 3 mois.",
    });
  } catch (error) {
    console.error("Erreur resetPassword:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};