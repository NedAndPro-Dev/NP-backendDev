INSERT INTO app_settings (`key`, `value`, `type`, `group_key`, is_secret) VALUES
('contact_manager', 'Martin Eteme', 'string', 'contact', 0),
('show_legal_footer', '1', 'bool', 'contact', 0)
ON DUPLICATE KEY UPDATE `key` = `key`;

-- Valeurs réelles du site, pour que la page publique ne perde rien
UPDATE app_settings SET `value` = '+237 674 199 996' WHERE `key` = 'phone_main' AND (`value` IS NULL OR `value` = '');
UPDATE app_settings SET `value` = 'contact@netandprosystems.com' WHERE `key` = 'email_contact' AND (`value` IS NULL OR `value` = '');
UPDATE app_settings SET `value` = 'Yaoundé, Cameroun' WHERE `key` = 'address' AND (`value` IS NULL OR `value` = '');