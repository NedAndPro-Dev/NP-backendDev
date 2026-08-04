CREATE TABLE app_settings (
    `key`        VARCHAR(80) NOT NULL,
    `value`      TEXT NULL,
    `type`       ENUM('string','int','float','bool','json') NOT NULL DEFAULT 'string',
    `group_key`  VARCHAR(40) NOT NULL,
    is_secret    BOOLEAN NOT NULL DEFAULT FALSE,
    updated_by   INT NULL,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`key`),
    INDEX idx_group (`group_key`),
    CONSTRAINT fk_setting_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Services : le catalogue était codé en dur côté React
CREATE TABLE service_catalog (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(120) NOT NULL,
    price      DECIMAL(12,2) NOT NULL DEFAULT 0,
    unit       ENUM('forfait','par jour','par personne','par heure') NOT NULL DEFAULT 'forfait',
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_service_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Horaires d'exploitation : 0 = dimanche, 6 = samedi
CREATE TABLE business_hours (
    weekday   TINYINT NOT NULL,
    is_open   BOOLEAN NOT NULL DEFAULT TRUE,
    open_at   TIME NOT NULL DEFAULT '08:00:00',
    close_at  TIME NOT NULL DEFAULT '19:00:00',
    PRIMARY KEY (weekday)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fermetures exceptionnelles
CREATE TABLE closures (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    label      VARCHAR(150) NOT NULL,
    date_from  DATE NOT NULL,
    date_to    DATE NOT NULL,
    kind       ENUM('Férié','Technique','Autre') NOT NULL DEFAULT 'Férié',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_closure_range (date_from, date_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Modèles d'email éditables
CREATE TABLE email_templates (
    `key`      VARCHAR(40) NOT NULL,
    label      VARCHAR(120) NOT NULL,
    subject    VARCHAR(200) NOT NULL,
    body       TEXT NOT NULL,
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Journal des opérations de maintenance (sauvegarde, purge, cache)
CREATE TABLE maintenance_log (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    action     VARCHAR(60) NOT NULL,
    detail     VARCHAR(255) NULL,
    status     ENUM('succes','echec') NOT NULL DEFAULT 'succes',
    user_id    INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_action_date (action, created_at),
    CONSTRAINT fk_maint_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Valeurs par défaut
INSERT INTO app_settings (`key`, `value`, `type`, `group_key`, is_secret) VALUES
('site_name','NetandProEvents','string','marque',0),
('tagline','Vos événements, nos salles','string','marque',0),
('seo_description','Réservation de salles de conférence et d''événements à Yaoundé. Devis en 24 h.','string','marque',0),
('logo_url','/uploads/branding/logo.png','string','marque',0),
('favicon_url','/uploads/branding/favicon.png','string','marque',0),
('accent_color','#c4143e','string','marque',0),
('timezone','Africa/Douala','string','marque',0),
('language','fr','string','marque',0),
('currency','XAF','string','marque',0),
('date_format','DD/MM/YYYY','string','marque',0),

('legal_name','NetandPro SARL','string','contact',0),
('niu','','string','contact',0),
('rccm','','string','contact',0),
('po_box','','string','contact',0),
('address','Yaoundé, Cameroun','string','contact',0),
('phone_main','','string','contact',0),
('phone_whatsapp','','string','contact',0),
('email_contact','','string','contact',0),
('email_bookings','','string','contact',0),
('social_facebook','','string','contact',0),
('social_instagram','','string','contact',0),
('social_linkedin','','string','contact',0),
('social_tiktok','','string','contact',0),

('min_lead_days','3','int','resa',0),
('max_duration_days','7','int','resa',0),
('cancel_lead_days','5','int','resa',0),
('default_status','En attente','string','resa',0),
('auto_confirm','0','bool','resa',0),
('allow_overlap','0','bool','resa',0),
('allow_over_capacity','0','bool','resa',0),
('waitlist_enabled','1','bool','resa',0),
('required_fields','["client_name","client_email","client_phone","attendees"]','json','resa',0),
('cancel_policy','Toute annulation intervenant plus de 5 jours avant la date de l''événement donne lieu au remboursement intégral de l''acompte.','string','resa',0),

('buffer_hours','2','int','horaires',0),
('max_bookings_per_day','2','int','horaires',0),

('vat_rate','19.25','float','services',0),
('deposit_rate','30','float','services',0),
('payment_lead_hours','48','int','services',0),
('prices_include_vat','1','bool','services',0),

('payment_methods','{"Virement bancaire":{"on":true,"account":""},"MTN Mobile Money":{"on":true,"account":""},"Orange Money":{"on":true,"account":""},"Espèces":{"on":true,"account":"Encaissement au siège"},"Chèque":{"on":false,"account":""}}','json','paiement',0),
('bank_name','','string','paiement',0),
('bank_holder','','string','paiement',0),
('bank_rib','','string','paiement',0),
('bank_swift','','string','paiement',0),
('invoice_prefix','NPE-2026-','string','paiement',0),
('invoice_next','1','int','paiement',0),
('invoice_notes','Facture payable à réception.','string','paiement',0),

('smtp_host','smtp.gmail.com','string','notif',0),
('smtp_port','587','int','notif',0),
('smtp_user','','string','notif',0),
('smtp_pass','','string','notif',1),
('smtp_from_name','NetandProEvents','string','notif',0),
('smtp_reply_to','','string','notif',0),
('reminder_days','3','int','notif',0),
('review_request_days','2','int','notif',0),
('internal_recipients','[]','json','notif',0),

('maintenance_mode','0','bool','site',0),
('maintenance_message','Site en maintenance. Merci de nous appeler pour toute urgence.','string','site',0),
('home_sections','{"hero":true,"venues":true,"services":true,"reviews":true,"gallery":false,"contact":true}','json','site',0),
('reviews_count','6','int','site',0),
('reviews_min_rating','4','int','site',0),
('banner_enabled','1','bool','site',0),
('banner_text','','string','site',0),
('review_form_open','1','bool','site',0),

('app_version','v2.4.1','string','systeme',0),
('auto_backup','1','bool','systeme',0),
('backup_frequency','Quotidienne','string','systeme',0),
('log_retention_days','90','int','systeme',0);

INSERT INTO business_hours (weekday, is_open, open_at, close_at) VALUES
(1,1,'08:00','19:00'),(2,1,'08:00','19:00'),(3,1,'08:00','19:00'),
(4,1,'08:00','19:00'),(5,1,'08:00','21:00'),(6,1,'09:00','22:00'),(0,0,'10:00','18:00');

INSERT INTO email_templates (`key`, label, subject, body, is_active) VALUES
('ack','Accusé de réception','Votre demande a bien été reçue — {{site_name}}','Bonjour {{client_name}},\n\nNous avons bien reçu votre demande pour {{event_title}} du {{date_start}}. Notre équipe revient vers vous sous 24 heures.',1),
('confirm','Confirmation de réservation','Réservation confirmée — {{event_title}}','Bonjour {{client_name}},\n\nVotre réservation est confirmée : {{location_name}}, du {{date_start}} au {{date_end}}.',1),
('cancel','Notification d''annulation','Annulation de votre réservation — {{event_title}}','Bonjour {{client_name}},\n\nVotre réservation du {{date_start}} a été annulée.',1),
('remind','Rappel avant l''événement','Votre événement approche — {{event_title}}','Bonjour {{client_name}},\n\nRappel : votre événement se tient le {{date_start}} à {{location_name}}.',1),
('review','Demande d''avis','Votre avis sur {{event_title}}','Bonjour {{client_name}},\n\nMerci de votre confiance. Votre avis nous aiderait beaucoup : {{review_link}}',1),
('reply','Réponse à un message','Réponse à votre message — {{site_name}}','Bonjour {{client_name}},\n\n{{reply_body}}',0);

-- Le catalogue reprend les services déjà présents dans les dossiers
INSERT INTO service_catalog (name, price, unit, sort_order) VALUES
('Sonorisation',150000,'forfait',1),
('Vidéoprojection',90000,'forfait',2),
('Traiteur',450000,'par personne',3),
('Décoration florale',120000,'forfait',4),
('Sécurité',200000,'par jour',5),
('Captation vidéo',350000,'forfait',6);