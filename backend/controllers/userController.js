const User = require('../models/User');
const { getTransporter } = require('../utils/mailer');

const ROLES = ['super_admin', 'superviseur'];

const credentialsMail = ({ name, email, tempPassword, isNew }) => `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#eef1f7;margin:0;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e6eaf2;border-radius:14px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#d81a45,#c4143e);color:#fff;padding:24px;text-align:center">
      <h2 style="margin:0;font-size:19px">NetandProEvents — Console admin</h2>
    </div>
    <div style="padding:28px;color:#0f1b33;line-height:1.6">
      <p>Bonjour <strong>${name}</strong>,</p>
      <p>${isNew
          ? 'Un compte d\'administration vient d\'être créé pour vous.'
          : 'Votre mot de passe a été réinitialisé par un super admin.'}</p>
      <table style="width:100%;background:#f8fafd;border:1px solid #eef1f7;border-radius:10px;padding:16px;margin:18px 0">
        <tr><td style="color:#64748b;font-size:13px">Identifiant</td><td><strong>${email}</strong></td></tr>
        <tr><td style="color:#64748b;font-size:13px">Mot de passe provisoire</td>
            <td><strong style="font-family:monospace;font-size:16px">${tempPassword}</strong></td></tr>
      </table>
      <p style="font-size:14px;color:#b45309">
        Ce mot de passe est provisoire : il doit être changé à la première connexion.
        Ensuite, il expirera automatiquement tous les 3 mois.
      </p>
    </div>
  </div>
</body></html>`;

// GET /api/users
exports.list = async (req, res) => {
    try {
        const { role = 'all', q = '' } = req.query;
        const [items, counts] = await Promise.all([User.list({ role, q }), User.counts()]);
        res.json({ items, counts, me: req.user.id });
    } catch (error) {
        console.error('Erreur liste utilisateurs:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// POST /api/users — invitation
exports.invite = async (req, res) => {
    try {
        const { name, email, phone, role } = req.body;

        if (!name || String(name).trim().length < 2) {
            return res.status(422).json({ message: 'Le nom est obligatoire.' });
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(422).json({ message: 'Email invalide.' });
        }
        if (!ROLES.includes(role)) {
            return res.status(422).json({ message: 'Rôle invalide.' });
        }
        if (await User.findByEmail(email)) {
            return res.status(409).json({ message: 'Un compte existe déjà avec cet email.' });
        }

        const { user, tempPassword } = await User.create({ name, email, phone, role, createdBy: req.user.id });

        try {
            await getTransporter().sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Votre accès à la console NetandProEvents',
                html: credentialsMail({ name, email, tempPassword, isNew: true })
            });
        } catch (mailError) {
            // Le compte existe : on ne le supprime pas, on signale juste l'échec d'envoi
            console.error('Envoi email invitation échoué:', mailError.message);
            return res.status(201).json({
                success: true,
                message: `Compte créé, mais l'email n'a pas pu être envoyé. Mot de passe provisoire : ${tempPassword}`,
                data: user
            });
        }

        res.status(201).json({ success: true, message: `Invitation envoyée à ${email}`, data: user });
    } catch (error) {
        console.error('Erreur invitation:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// PATCH /api/users/:id/role
exports.setRole = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { role } = req.body;

        if (!ROLES.includes(role)) return res.status(422).json({ message: 'Rôle invalide.' });
        if (id === req.user.id) return res.status(422).json({ message: 'Vous ne pouvez pas changer votre propre rôle.' });

        const target = await User.findById(id);
        if (!target) return res.status(404).json({ message: 'Utilisateur introuvable' });

        // Ne jamais se retrouver sans super admin actif
        if (target.role === 'super_admin' && role !== 'super_admin' && await User.countSuperAdmins(id) === 0) {
            return res.status(422).json({ message: 'Il doit rester au moins un super admin actif.' });
        }

        const updated = await User.setRole(id, role);
        res.json({ success: true, message: `${updated.name} est maintenant ${role === 'super_admin' ? 'super admin' : 'superviseur'}`, data: updated });
    } catch (error) {
        console.error('Erreur changement de rôle:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// PATCH /api/users/:id/active
exports.setActive = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const active = !!req.body.active;

        if (id === req.user.id) {
            return res.status(422).json({ message: 'Vous ne pouvez pas suspendre votre propre compte.' });
        }
        const target = await User.findById(id);
        if (!target) return res.status(404).json({ message: 'Utilisateur introuvable' });

        if (!active && target.role === 'super_admin' && await User.countSuperAdmins(id) === 0) {
            return res.status(422).json({ message: 'Il doit rester au moins un super admin actif.' });
        }

        const updated = await User.setActive(id, active);
        res.json({ success: true, message: `${updated.name} ${active ? 'réactivé' : 'suspendu'}`, data: updated });
    } catch (error) {
        console.error('Erreur activation:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// PATCH /api/users/:id — nom / téléphone
exports.update = async (req, res) => {
    try {
        const updated = await User.updateProfile(req.params.id, req.body);
        if (!updated) return res.status(404).json({ message: 'Utilisateur introuvable' });
        res.json({ success: true, message: 'Profil mis à jour', data: updated });
    } catch (error) {
        console.error('Erreur maj profil:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// POST /api/users/:id/reset-password
exports.resetPassword = async (req, res) => {
    try {
        const target = await User.findById(req.params.id);
        if (!target) return res.status(404).json({ message: 'Utilisateur introuvable' });

        const tempPassword = await User.resetPassword(target.id);

        try {
            await getTransporter().sendMail({
                from: process.env.EMAIL_USER,
                to: target.email,
                subject: 'Réinitialisation de votre mot de passe — NetandProEvents',
                html: credentialsMail({ name: target.name, email: target.email, tempPassword, isNew: false })
            });
        } catch (mailError) {
            console.error('Envoi email reset échoué:', mailError.message);
            return res.json({ success: true, message: `Mot de passe réinitialisé. À transmettre : ${tempPassword}` });
        }

        res.json({ success: true, message: `Mot de passe provisoire envoyé à ${target.email}` });
    } catch (error) {
        console.error('Erreur reset mot de passe:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// PATCH /api/users/:id/twofa
exports.setTwofa = async (req, res) => {
    try {
        const updated = await User.setTwofa(req.params.id, !!req.body.enabled);
        if (!updated) return res.status(404).json({ message: 'Utilisateur introuvable' });
        res.json({
            success: true,
            message: `Double authentification ${req.body.enabled ? 'activée' : 'désactivée'}`,
            data: updated
        });
    } catch (error) {
        console.error('Erreur 2FA:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// DELETE /api/users/:id
exports.remove = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (id === req.user.id) {
            return res.status(422).json({ message: 'Vous ne pouvez pas supprimer votre propre compte.' });
        }
        const target = await User.findById(id);
        if (!target) return res.status(404).json({ message: 'Utilisateur introuvable' });

        if (target.role === 'super_admin' && await User.countSuperAdmins(id) === 0) {
            return res.status(422).json({ message: 'Il doit rester au moins un super admin actif.' });
        }

        await User.delete(id);
        res.json({ success: true, message: `${target.name} supprimé` });
    } catch (error) {
        console.error('Erreur suppression utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};