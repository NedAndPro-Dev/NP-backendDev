-- La couleur d'origine du site public est le bleu, pas le rouge de l'admin.
UPDATE app_settings SET `value` = '#1e40af' WHERE `key` = 'accent_color';

-- Couleur d'origine conservée en base : sert de cible au bouton « Rétablir ».
INSERT INTO app_settings (`key`, `value`, `type`, `group_key`, is_secret)
VALUES ('accent_default', '#1e40af', 'string', 'marque', 0)
ON DUPLICATE KEY UPDATE `value` = '#1e40af';