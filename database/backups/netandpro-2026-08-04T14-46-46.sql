-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: netandpro
-- ------------------------------------------------------
-- Server version	8.0.40

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `app_settings`
--

DROP TABLE IF EXISTS `app_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_settings` (
  `key` varchar(80) NOT NULL,
  `value` text,
  `type` enum('string','int','float','bool','json') NOT NULL DEFAULT 'string',
  `group_key` varchar(40) NOT NULL,
  `is_secret` tinyint(1) NOT NULL DEFAULT '0',
  `updated_by` int DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`),
  KEY `idx_group` (`group_key`),
  KEY `fk_setting_user` (`updated_by`),
  CONSTRAINT `fk_setting_user` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_settings`
--

LOCK TABLES `app_settings` WRITE;
/*!40000 ALTER TABLE `app_settings` DISABLE KEYS */;
INSERT INTO `app_settings` VALUES ('accent_color','#1e40af','string','marque',0,1,'2026-08-04 10:08:17'),('accent_default','#1e40af','string','marque',0,NULL,'2026-08-04 09:34:28'),('address','Yaoundé, Cameroun','string','contact',0,NULL,'2026-08-04 07:12:30'),('allow_over_capacity','0','bool','resa',0,NULL,'2026-08-04 07:12:30'),('allow_overlap','0','bool','resa',0,NULL,'2026-08-04 07:12:30'),('app_version','v2.4.1','string','systeme',0,NULL,'2026-08-04 07:12:30'),('auto_backup','1','bool','systeme',0,NULL,'2026-08-04 07:12:30'),('auto_confirm','0','bool','resa',0,NULL,'2026-08-04 07:12:30'),('backup_frequency','Quotidienne','string','systeme',0,NULL,'2026-08-04 07:12:30'),('bank_holder','','string','paiement',0,NULL,'2026-08-04 07:12:30'),('bank_name','','string','paiement',0,NULL,'2026-08-04 07:12:30'),('bank_rib','','string','paiement',0,NULL,'2026-08-04 07:12:30'),('bank_swift','','string','paiement',0,NULL,'2026-08-04 07:12:30'),('banner_enabled','0','bool','site',0,1,'2026-08-04 13:58:40'),('banner_text','Promotion sur les offres','string','site',0,1,'2026-08-04 13:58:19'),('buffer_hours','2','int','horaires',0,NULL,'2026-08-04 07:12:30'),('cancel_lead_days','5','int','resa',0,NULL,'2026-08-04 07:12:30'),('cancel_policy','Toute annulation intervenant plus de 5 jours avant la date de l\'événement donne lieu au remboursement intégral de l\'acompte.','string','resa',0,NULL,'2026-08-04 07:12:30'),('contact_manager','Felix TANZI','string','contact',0,1,'2026-08-04 11:38:26'),('currency','XAF','string','marque',0,NULL,'2026-08-04 07:12:30'),('date_format','DD/MM/YYYY','string','marque',0,NULL,'2026-08-04 07:12:30'),('default_status','En attente','string','resa',0,NULL,'2026-08-04 07:12:30'),('deposit_rate','30','float','services',0,NULL,'2026-08-04 07:12:30'),('email_bookings','tanzifelix@gmail.com','string','contact',0,1,'2026-08-04 09:00:57'),('email_contact','tanzifelix@gmail.com','string','contact',0,1,'2026-08-04 09:00:57'),('favicon_url','/uploads/branding/favicon.png','string','marque',0,NULL,'2026-08-04 07:12:30'),('home_sections','{\"hero\":true,\"calendar\":true,\"upcoming\":true,\"services\":true,\"reviews\":true,\"cta\":true}','json','site',0,1,'2026-08-04 13:48:00'),('internal_recipients','[]','json','notif',0,NULL,'2026-08-04 07:12:30'),('invoice_next','1','int','paiement',0,NULL,'2026-08-04 07:12:30'),('invoice_notes','Facture payable à réception.','string','paiement',0,NULL,'2026-08-04 07:12:30'),('invoice_prefix','NPE-2026-','string','paiement',0,NULL,'2026-08-04 07:12:30'),('language','fr','string','marque',0,NULL,'2026-08-04 07:12:30'),('legal_name','NetandPro SARL','string','contact',0,NULL,'2026-08-04 07:12:30'),('log_retention_days','90','int','systeme',0,NULL,'2026-08-04 07:12:30'),('logo_url','/uploads/branding/logo-1785838684058.png','string','marque',0,1,'2026-08-04 10:18:04'),('maintenance_message','Site en maintenance. Merci de nous appeler pour toute urgence','string','site',0,1,'2026-08-04 13:57:31'),('maintenance_mode','0','bool','site',0,1,'2026-08-04 13:57:54'),('max_bookings_per_day','2','int','horaires',0,NULL,'2026-08-04 07:12:30'),('max_duration_days','7','int','resa',0,NULL,'2026-08-04 07:12:30'),('min_lead_days','3','int','resa',0,NULL,'2026-08-04 07:12:30'),('niu','','string','contact',0,NULL,'2026-08-04 07:12:30'),('payment_lead_hours','48','int','services',0,NULL,'2026-08-04 07:12:30'),('payment_methods','{\"Virement bancaire\":{\"on\":true,\"account\":\"\"},\"MTN Mobile Money\":{\"on\":true,\"account\":\"\"},\"Orange Money\":{\"on\":true,\"account\":\"\"},\"Espèces\":{\"on\":true,\"account\":\"Encaissement au siège\"},\"Chèque\":{\"on\":false,\"account\":\"\"}}','json','paiement',0,NULL,'2026-08-04 07:12:30'),('phone_main','698200792','string','contact',0,1,'2026-08-04 09:00:57'),('phone_whatsapp','698200792','string','contact',0,1,'2026-08-04 09:00:57'),('po_box','4170','string','contact',0,1,'2026-08-04 09:01:43'),('prices_include_vat','1','bool','services',0,NULL,'2026-08-04 07:12:30'),('rccm','','string','contact',0,NULL,'2026-08-04 07:12:30'),('reminder_days','3','int','notif',0,NULL,'2026-08-04 07:12:30'),('required_fields','[\"client_name\",\"client_email\",\"attendees\",\"client_phone\"]','json','resa',0,1,'2026-08-04 11:52:31'),('review_form_open','1','bool','site',0,NULL,'2026-08-04 07:12:30'),('review_request_days','2','int','notif',0,NULL,'2026-08-04 07:12:30'),('reviews_count','6','int','site',0,NULL,'2026-08-04 07:12:30'),('reviews_min_rating','4','int','site',0,NULL,'2026-08-04 07:12:30'),('seo_description','Test Réservation de salles de conférence et d\'événements à Yaoundé. Devis en 24 h.','string','marque',0,1,'2026-08-04 09:30:31'),('show_legal_footer','1','bool','contact',0,NULL,'2026-08-04 10:35:09'),('site_name','NetandProEvents CM','string','marque',0,1,'2026-08-04 09:06:49'),('smtp_from_name','NetandProEvents','string','notif',0,NULL,'2026-08-04 07:12:30'),('smtp_host','smtp.gmail.com','string','notif',0,NULL,'2026-08-04 07:12:30'),('smtp_pass','hlitbmtagkcugrta','string','notif',1,1,'2026-08-04 13:33:48'),('smtp_port','587','int','notif',0,NULL,'2026-08-04 07:12:30'),('smtp_reply_to','pinguetn23@gmail.com','string','notif',0,1,'2026-08-04 13:09:19'),('smtp_user','pinguetn23@gmail.com','string','notif',0,1,'2026-08-04 13:09:19'),('social_facebook','netandpro','string','contact',0,1,'2026-08-04 11:38:05'),('social_instagram','netandpro','string','contact',0,1,'2026-08-04 11:38:05'),('social_linkedin','félix-tanzi','string','contact',0,1,'2026-08-04 11:36:28'),('social_tiktok','netandpro','string','contact',0,1,'2026-08-04 11:38:05'),('tagline','Test Vos événements, nos salles','string','marque',0,1,'2026-08-04 09:21:22'),('timezone','Africa/Douala','string','marque',0,NULL,'2026-08-04 07:12:30'),('vat_rate','19.25','float','services',0,NULL,'2026-08-04 07:12:30'),('waitlist_enabled','1','bool','resa',0,NULL,'2026-08-04 07:12:30');
/*!40000 ALTER TABLE `app_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category` enum('param','resa','moder','systeme','email','acces','contenu','users') NOT NULL,
  `action` varchar(120) NOT NULL,
  `target` varchar(190) DEFAULT NULL,
  `detail` varchar(500) DEFAULT NULL,
  `status` enum('succes','echec','attention') NOT NULL DEFAULT 'succes',
  `changes` json DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `actor_name` varchar(120) DEFAULT NULL,
  `actor_email` varchar(190) DEFAULT NULL,
  `actor_role` varchar(40) DEFAULT NULL,
  `ip` varchar(64) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `method` varchar(8) DEFAULT NULL,
  `path` varchar(190) DEFAULT NULL,
  `http_status` smallint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_date` (`created_at`),
  KEY `idx_audit_cat` (`category`,`created_at`),
  KEY `idx_audit_user` (`user_id`,`created_at`),
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `business_hours`
--

DROP TABLE IF EXISTS `business_hours`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `business_hours` (
  `weekday` tinyint NOT NULL,
  `is_open` tinyint(1) NOT NULL DEFAULT '1',
  `open_at` time NOT NULL DEFAULT '08:00:00',
  `close_at` time NOT NULL DEFAULT '19:00:00',
  PRIMARY KEY (`weekday`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `business_hours`
--

LOCK TABLES `business_hours` WRITE;
/*!40000 ALTER TABLE `business_hours` DISABLE KEYS */;
INSERT INTO `business_hours` VALUES (0,0,'10:00:00','18:00:00'),(1,1,'08:00:00','19:00:00'),(2,1,'08:00:00','19:00:00'),(3,1,'08:00:00','19:00:00'),(4,0,'08:00:00','19:00:00'),(5,1,'08:00:00','21:00:00'),(6,0,'09:00:00','22:00:00');
/*!40000 ALTER TABLE `business_hours` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `closures`
--

DROP TABLE IF EXISTS `closures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `closures` (
  `id` int NOT NULL AUTO_INCREMENT,
  `label` varchar(150) NOT NULL,
  `date_from` date NOT NULL,
  `date_to` date NOT NULL,
  `kind` enum('Férié','Technique','Autre') NOT NULL DEFAULT 'Férié',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_closure_range` (`date_from`,`date_to`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `closures`
--

LOCK TABLES `closures` WRITE;
/*!40000 ALTER TABLE `closures` DISABLE KEYS */;
/*!40000 ALTER TABLE `closures` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_messages`
--

DROP TABLE IF EXISTS `contact_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('nouveau','lu','traite') COLLATE utf8mb4_unicode_ci DEFAULT 'nouveau',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `replied_at` timestamp NULL DEFAULT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_messages`
--

LOCK TABLES `contact_messages` WRITE;
/*!40000 ALTER TABLE `contact_messages` DISABLE KEYS */;
INSERT INTO `contact_messages` VALUES (1,'Felix Tz','tanzifelix@gmail.com','+237698200792','Test d\'envoi de message','Ceci est un message de test pour vérifier que le système d\'envoi d\'email fonctionne correctement. Si je reçois ce message, tout est opérationnel !','nouveau','2025-10-19 09:44:39',NULL,NULL),(2,'NGOUPEYOU','bryan@gmail.com','655123456','y a pas de sujet','non plus de message','nouveau','2025-10-21 13:07:09',NULL,NULL),(3,'NGOUPEYOU','jeanngoupeyou9@gmail.com',NULL,'y a pas de sujet','non plus de message','nouveau','2025-10-21 13:08:34',NULL,NULL),(4,'NGOUPEYOU','jeanngoupeyou9@gmail.com',NULL,'y a pas de sujet','non plus de message','nouveau','2025-10-21 13:08:40',NULL,NULL),(5,'NGOUPEYOU','jeanngoupeyou9@gmail.com',NULL,'y a pas de sujet','non plus de message','nouveau','2025-10-21 13:12:38',NULL,NULL),(6,'NZIKO Felix','tanzifelix@gmail.com','+237 698200792','Demande d\'information','Bonjour NetandPro Systems,\n\nComment pouvons nous faire une reservation au sein de vos locaux ? En combien de temps traitez-vous une demande ?','nouveau','2025-10-26 20:33:38',NULL,NULL),(7,'Felix NZIKO','tanzifelix@gmail.com','+237698200792','Test envoie admin','test et tout putr voir','traite','2026-08-03 13:55:32','2026-08-03 14:15:56','2026-08-03 14:12:42');
/*!40000 ALTER TABLE `contact_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_log`
--

DROP TABLE IF EXISTS `email_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `kind` varchar(40) NOT NULL,
  `event_id` int DEFAULT NULL,
  `recipient` varchar(190) NOT NULL,
  `status` enum('envoye','echec','ignore') NOT NULL DEFAULT 'envoye',
  `detail` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_kind_event` (`kind`,`event_id`),
  KEY `idx_kind_date` (`kind`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_log`
--

LOCK TABLES `email_log` WRITE;
/*!40000 ALTER TABLE `email_log` DISABLE KEYS */;
INSERT INTO `email_log` VALUES (1,'test',NULL,'tanzifelix@gmail.com','envoye',NULL,'2026-08-04 13:34:07');
/*!40000 ALTER TABLE `email_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_templates`
--

DROP TABLE IF EXISTS `email_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_templates` (
  `key` varchar(40) NOT NULL,
  `label` varchar(120) NOT NULL,
  `subject` varchar(200) NOT NULL,
  `body` text NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_templates`
--

LOCK TABLES `email_templates` WRITE;
/*!40000 ALTER TABLE `email_templates` DISABLE KEYS */;
INSERT INTO `email_templates` VALUES ('ack','Accusé de réception','Votre demande a bien été reçue — {{site_name}}','Bonjour {{client_name}},\n\nNous avons bien reçu votre demande pour {{event_title}} du {{date_start}}. Notre équipe revient vers vous sous 24 heures.',1,'2026-08-04 07:12:30'),('cancel','Notification d\'annulation','Annulation de votre réservation — {{event_title}}','Bonjour {{client_name}},\n\nVotre réservation du {{date_start}} a été annulée.',1,'2026-08-04 07:12:30'),('confirm','Confirmation de réservation','Réservation confirmée — {{event_title}}','Bonjour {{client_name}},\n\nVotre réservation est confirmée : {{location_name}}, du {{date_start}} au {{date_end}}.',1,'2026-08-04 07:12:30'),('remind','Rappel avant l\'événement','Votre événement approche — {{event_title}}','Bonjour {{client_name}},\n\nRappel : votre événement se tient le {{date_start}} à {{location_name}}.',1,'2026-08-04 07:12:30'),('reply','Réponse à un message','Réponse à votre message — {{site_name}}','Bonjour {{client_name}},\n\n{{reply_body}}',0,'2026-08-04 07:12:30'),('review','Demande d\'avis','Votre avis sur {{event_title}}','Bonjour {{client_name}},\n\nMerci de votre confiance. Votre avis nous aiderait beaucoup : {{review_link}}',1,'2026-08-04 07:12:30');
/*!40000 ALTER TABLE `email_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_start` datetime NOT NULL,
  `date_end` datetime NOT NULL,
  `location_id` int NOT NULL,
  `services` json NOT NULL,
  `payment_method` enum('Virement bancaire','Espèces','MTN Mobile Money','Orange Money','Chèque') COLLATE utf8mb4_unicode_ci NOT NULL,
  `conditions_accepted` tinyint(1) DEFAULT '0',
  `status` enum('En attente','Confirmé','Annulé') COLLATE utf8mb4_unicode_ci DEFAULT 'En attente',
  `is_waitlisted` tinyint(1) NOT NULL DEFAULT '0',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `attendees` int DEFAULT NULL COMMENT 'Nombre de personnes attendues',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_date_start` (`date_start`),
  KEY `idx_status_date` (`status`,`date_start`),
  KEY `idx_client_email` (`client_email`),
  KEY `idx_event_waitlist` (`location_id`,`is_waitlisted`),
  CONSTRAINT `events_ibfk_1` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
INSERT INTO `events` VALUES (1,'Felix NZIKO','nzikofelix@gmail.com','+237650008676',NULL,'2025-10-16 11:00:00','2025-10-16 13:00:00',10,'[\"Interprétation simultanée à distance\", \"Éclairage\", \"Vidéo & projection\"]','Espèces',1,'En attente',0,NULL,'2025-10-04 05:00:26',NULL,'2026-08-03 12:04:44'),(2,'ygffhv','abraham@gmail.com','+237698273546',NULL,'2025-10-09 15:09:00','2025-10-10 15:09:00',8,'[\"Tourguide\", \"Éclairage\", \"Captation vidéo\"]','Espèces',1,'Annulé',0,NULL,'2025-10-08 14:13:17',NULL,'2026-08-03 12:04:44'),(3,'TANZI Félix','tanzifelix@gmail.com','+237698200792',NULL,'2025-10-12 18:45:00','2025-10-13 18:45:00',8,'[\"Traduction simultanée\", \"Sonorisation\", \"Écran géant\", \"Microphone de table\", \"Interprétation escorte mobile\", \"Copieur N/B\", \"Imprimantes\", \"Ordinateur\", \"Assistance\"]','Virement bancaire',1,'Confirmé',0,'NUI: \nAdresse: 44 , BLV J.F Kennedy\nPersonne à contacter: NANA Joyce\nTél. contact: \nNombre de personnes: 30\nNombre de jours: 1\nConditions de paiement: 70% à la commande, 30% avant l\'événement\n\nNotes: ','2025-10-11 18:47:11',NULL,'2026-08-03 12:04:44'),(4,'Felix NZIKO','kepmefogedeon@gmail.com','+237680211437',NULL,'2025-10-29 08:44:00','2025-10-30 08:44:00',22,'[\"Sonorisation\", \"Écran géant\", \"Zoom intégré\", \"Zoom à distance\", \"Imprimantes\"]','Virement bancaire',1,'Confirmé',0,'NUI: \nAdresse: ENSPY\nPersonne à contacter: AKAMBA BIYEME Miguel Alexandro\nTél. contact: +237680211437\nNombre de personnes: 45\nNombre de jours: 1\nConditions de paiement: 50% à la commande, 50% avant l\'événement\n\nNotes: ','2025-10-28 07:55:37',NULL,'2026-08-03 12:04:44'),(5,'TCHAMI Jerry','tjerry@gmail.com','+237671517321',NULL,'2025-10-31 08:56:00','2025-10-31 14:56:00',12,'[\"Traduction simultanée\", \"Moniteur de contrôle\", \"Zoom intégré\", \"Zoom à distance\", \"Cabine de traduction\", \"Assistance\"]','Chèque',1,'Confirmé',0,'NUI: \nAdresse: ENSPY\nPersonne à contacter: TCHAMI Jerry\nTél. contact: +237671517321\nNombre de personnes: 33\nNombre de jours: 1\nConditions de paiement: 70% à la commande, 30% avant l\'événement\n\nNotes: ','2025-10-28 08:04:19',NULL,'2026-08-03 12:04:44'),(6,'KEPMEFO Gedeon','kepmefogedeon@gmail.com','+237691688910',NULL,'2025-10-29 09:27:00','2025-10-29 12:27:00',21,'[\"Sonorisation\", \"Conférence Hybride\", \"Écran géant\", \"Caméras Tracking\", \"Ordinateur\", \"Secrétariat complet\", \"Assistance\"]','Virement bancaire',1,'Confirmé',0,'NUI: \nAdresse: ENSPY\nPersonne à contacter: KEPMEFO Gedeon\nTél. contact: +237691688910\nNombre de personnes: 45\nNombre de jours: 1\nConditions de paiement: 50% à la commande, 50% avant l\'événement\n\nNotes: ','2025-10-28 08:28:14',NULL,'2026-08-03 12:04:44'),(7,'AKAMBA BIYEME Miguel Alexandro','akambamiguel@gmail.com','+237680211437',NULL,'2025-11-04 09:30:00','2025-11-06 09:30:00',11,'[\"Traduction simultanée\", \"Zoom à distance\", \"Interprétation escorte mobile\"]','Chèque',1,'Confirmé',0,'NUI: \nAdresse: ENSPY\nPersonne à contacter: AKAMBA BIYEME Miguel Alexandro\nTél. contact: +237680211437\nNombre de personnes: 235\nNombre de jours: 2\nConditions de paiement: 70% à la commande, 30% avant l\'événement\n\nNotes: ','2025-10-28 08:31:23',NULL,'2026-08-03 12:04:44'),(8,'TCHAMI Jerry','tjerry@gmail.com','+237653827467',NULL,'2025-11-08 09:27:00','2025-11-09 09:27:00',8,'[\"Sonorisation\", \"Microphone de table\", \"Cabine de traduction\", \"Imprimantes\"]','Espèces',1,'Confirmé',0,'NUI: \nAdresse: ENSPY\nPersonne à contacter: TCHAMI Jerry\nTél. contact: +237671517321\nNombre de personnes: 22\nNombre de jours: 1\nConditions de paiement: 50% à la commande, 50% avant l\'événement\n\nNotes: ','2025-11-02 08:31:25',NULL,'2026-08-03 12:04:44'),(9,'NONGA Yvan Dimitry','nongayvan@gmail.com','467465876786986878',NULL,'2025-11-22 09:35:00','2025-11-22 09:37:00',17,'[\"Microphone de table\", \"Zoom intégré\", \"Cabine de traduction\", \"Copieur N/B\"]','Virement bancaire',1,'Confirmé',0,'NUI: \nAdresse: NKOLFOULOU\nPersonne à contacter: NONGA Yvan Dimitry\nTél. contact: +237653827467\nNombre de personnes: 34\nNombre de jours: 1\nConditions de paiement: 70% à la commande, 30% avant l\'événement\n\nNotes: ','2025-11-02 08:38:42',NULL,'2026-08-03 12:04:44'),(10,'NDAM MBOMBO Ramine Delyan','ndamramine@gmail.com','+237696543571',NULL,'2025-11-19 00:29:00','2025-11-21 00:29:00',10,'[\"Sonorisation\", \"Cabine de traduction\"]','MTN Mobile Money',1,'Confirmé',0,'NUI: \nAdresse: NKOLFOULOU\nPersonne à contacter: NONGA Yvan Dimitry\nTél. contact: +237653827467\nNombre de personnes: 32\nNombre de jours: 3\nConditions de paiement: 50% à la commande, 50% avant l\'événement\n\nNotes: ','2025-11-02 23:30:10',NULL,'2026-08-03 12:04:44'),(11,'NDAM MBOMBO Ramine Delyan','ndamramine@gmail.com','+237696543571',NULL,'2025-12-01 00:30:00','2025-12-02 00:30:00',21,'[\"Conférence Hybride\", \"Imprimantes\"]','Orange Money',1,'Confirmé',0,'NUI: \nAdresse: NKOLFOULOU\nPersonne à contacter: NONGA Yvan Dimitry\nTél. contact: +237653827467\nNombre de personnes: 12\nNombre de jours: 1\nConditions de paiement: 70% à la commande, 30% avant l\'événement\n\nNotes: ','2025-11-02 23:31:12',NULL,'2026-08-03 12:04:44'),(12,'NONGA Yvan Dimitry','nongayvan@gmail.com','+237653827467',NULL,'2025-11-06 00:43:00','2025-11-07 00:43:00',8,'[\"Écran géant\", \"Gestion complète de l\'événement\"]','Orange Money',1,'En attente',0,'NUI: \nAdresse: 44 , BLV J.F Kennedy\nPersonne à contacter: NONGA Yvan Dimitry\nTél. contact: +237653827467\nNombre de personnes: 3\nNombre de jours: 1\nConditions de paiement: 70% à la commande, 30% avant l\'événement\n\nNotes: ','2025-11-02 23:44:08',NULL,'2026-08-03 12:04:44'),(13,'Pingue TN23','pinguetn23@gmail.com','698200793',NULL,'2026-07-30 16:38:00','2026-07-30 16:38:00',10,'[\"Sonorisation\", \"Microphone de table\", \"Moniteur de contrôle\", \"Zoom intégré\", \"Zoom à distance\", \"Cabine de traduction\", \"Copieur N/B\", \"Imprimantes\"]','Orange Money',1,'Confirmé',0,'NUI: \nAdresse: tanzifelix@gmail.com\nPersonne à contacter: \nTél. contact: \nNombre de personnes: 679\nNombre de jours: 1\nConditions de paiement: 50% à la commande, 50% avant l\'événement\n\nNotes: ','2026-07-23 15:39:51',NULL,'2026-08-03 12:04:44'),(14,'NDAM MBOMBO Ramine Delyan','ndamramine@gmail.com','+237696543571',NULL,'2026-07-24 09:46:00','2026-07-24 09:46:00',6,'[\"Conférence Hybride\", \"Moniteur de contrôle\", \"Gestion complète de l\'événement\"]','MTN Mobile Money',1,'Confirmé',0,'NUI: \nAdresse: NKOLFOULOU\nPersonne à contacter: \nTél. contact: \nNombre de personnes: 2\nNombre de jours: 1\nConditions de paiement: 50% à la commande, 50% avant l\'événement\n\nNotes: ','2026-07-24 08:47:38',230,'2026-08-03 12:04:45'),(15,'TCHAMI Jerry','tjerry@gmail.com','+237671517321',NULL,'2026-07-25 09:57:00','2026-07-25 09:57:00',10,'[\"Traduction simultanée\", \"Écran géant\", \"Microphone de table\", \"Cabine de traduction\", \"Secrétariat complet\"]','Espèces',1,'Confirmé',0,'NUI: \nAdresse: 44 , BLV J.F Kennedy\nPersonne à contacter: \nTél. contact: \nNombre de personnes: 56\nNombre de jours: 1\nConditions de paiement: 70% à la commande, 30% avant l\'événement\n\nNotes: Test information','2026-07-24 09:13:03',NULL,'2026-08-03 12:04:44'),(16,'TCHAMI Jerry','tjerry@gmail.com','+237698200792',NULL,'2026-07-26 10:26:00','2026-07-31 10:26:00',13,'[\"Conférence Hybride\", \"Moniteur de contrôle\", \"Interprétation escorte mobile\", \"Imprimantes\"]','Virement bancaire',1,'Confirmé',0,'NUI: \nAdresse: 44 , BLV J.F Kennedy\nPersonne à contacter: \nTél. contact: \nNombre de personnes: 67\nNombre de jours: 6\nConditions de paiement: 50% à la commande, 50% avant l\'événement\n\nNotes: ','2026-07-24 09:27:13',NULL,'2026-08-03 12:04:44'),(17,'TCHAMI Jerry','tjerry@gmail.com','+237671517321',NULL,'2026-07-29 11:00:00','2026-07-31 11:00:00',11,'[\"Sonorisation\", \"Écran géant\", \"Moniteur de contrôle\", \"Cabine de traduction\", \"Interprétation escorte mobile\", \"Copieur N/B\", \"Imprimantes\", \"Gestion complète de l\'événement\"]','Espèces',1,'Confirmé',0,'NUI: \nAdresse: 44 , BLV J.F Kennedy\nPersonne à contacter: NDAM MBOMBO Ramine Delyan\nTél. contact: +237696543571\nNombre de personnes: 45\nNombre de jours: 3\nConditions de paiement: 50% à la commande, 50% avant l\'événement\n\nNotes: ','2026-07-24 10:01:24',NULL,'2026-08-03 12:04:44'),(18,'TCHAMI Jerry','tjerry@gmail.com','+237698747478',NULL,'2026-08-01 15:04:00','2026-08-02 15:04:00',19,'[\"Écran géant\", \"Microphone de table\", \"Interprétation escorte mobile\", \"Copieurs couleur\"]','Orange Money',1,'En attente',0,'NUI: \nAdresse: 44 , BLV J.F Kennedy\nPersonne à contacter: \nTél. contact: \nNombre de personnes: 80\nNombre de jours: 2\nConditions de paiement: 70% à la commande, 30% avant l\'événement\n\nNotes: ','2026-07-24 15:16:48',NULL,'2026-08-03 12:04:44'),(19,'NDAM MBOMBO Ramine Delyan','ndamramine@gmail.com','+237698398473',NULL,'2026-07-31 13:57:00','2026-08-02 13:57:00',21,'[\"Sonorisation\", \"Conférence Hybride\", \"Zoom intégré\", \"Interprétation escorte mobile\", \"Copieur N/B\", \"Secrétariat complet\"]','Espèces',1,'En attente',0,'NUI: \nAdresse: NKOLFOULOU\nPersonne à contacter: \nTél. contact: \nNombre de personnes: 43\nNombre de jours: 3\nConditions de paiement: 50% à la commande, 50% avant l\'événement\n\nNotes: test','2026-07-29 12:58:16',NULL,'2026-08-03 12:04:44'),(20,'Test Bro','ndamramine@gmail.com','+237696543571','VBSHjdk','2026-08-07 14:00:00','2026-08-19 14:00:00',4,'[\"Conférence Hybride\", \"Écran géant\", \"Microphone de table\", \"Caméras Tracking\", \"Interprétation escorte mobile\", \"Copieurs couleur\", \"Imprimantes\"]','MTN Mobile Money',1,'En attente',0,'NUI: 6784908343358\nAdresse: jsdkbkbsfbsf\nPersonne à contacter: \nTél. contact: \nNombre de personnes: 389\nNombre de jours: 13\nConditions de paiement: 70% à la commande, 30% avant l\'événement\n\nNotes: ','2026-07-29 13:01:34',500,'2026-08-03 12:04:45');
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `locations`
--

DROP TABLE IF EXISTS `locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `locations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` enum('actif','inactif','archive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'actif',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `type` enum('Hôtel','Club privé','Centre de congrès','Salle des fêtes','Autre') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quartier` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `contact_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_email` varchar(190) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `surface` decimal(8,2) DEFAULT NULL,
  `floor` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `layouts` json DEFAULT NULL,
  `equipment` json DEFAULT NULL,
  `price_per_day` decimal(12,2) DEFAULT NULL,
  `currency` char(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'XAF',
  `is_bookable` tinyint(1) NOT NULL DEFAULT '1',
  `plan_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_name_parent` (`parent_id`,`name`),
  KEY `idx_parent` (`parent_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `locations_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locations`
--

LOCK TABLES `locations` WRITE;
/*!40000 ALTER TABLE `locations` DISABLE KEYS */;
INSERT INTO `locations` VALUES (1,'Hilton Yaoundé',NULL,'2025-10-04 02:54:15',NULL,'actif','2026-08-03 10:59:09','Hôtel',NULL,'Yaoundé',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'XAF',1,NULL),(2,'Bouma A',1,'2025-10-04 02:54:15',NULL,'actif','2026-08-03 10:59:09',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'XAF',1,NULL),(3,'Bouma B',1,'2025-10-04 02:54:15',NULL,'actif','2026-08-03 10:59:09',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'XAF',1,NULL),(4,'Bouma C',1,'2025-10-04 02:54:15',NULL,'actif','2026-08-03 11:06:06',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,500,780.00,'10','[]','[]',13000000.00,'XAF',1,NULL),(5,'Bete A',1,'2025-10-04 02:54:15',NULL,'actif','2026-08-03 11:02:29',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,400,780.00,'10','[]','[]',1200000.00,'XAF',1,NULL),(6,'Bete B',1,'2025-10-04 02:54:15',NULL,'actif','2026-08-03 11:04:22',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,230,679.00,'9','[]','[]',789263.00,'XAF',1,NULL),(7,'Bete C',1,'2025-10-04 02:54:15',NULL,'actif','2026-08-03 10:59:09',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'XAF',1,NULL),(8,'Mont Bamboutos',1,'2025-10-04 02:54:15',NULL,'actif','2026-08-03 10:59:09',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'XAF',1,NULL),(9,'Mont Kenya',1,'2025-10-04 02:54:15',NULL,'actif','2026-08-03 10:59:09',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'XAF',1,NULL),(10,'Mont Cameroun',1,'2025-10-04 02:54:15',NULL,'actif','2026-08-03 10:59:09',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'XAF',1,NULL),(11,'Mont Kilimandjaro',1,'2025-10-04 02:54:15',NULL,'actif','2026-08-03 10:59:09',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'XAF',1,NULL),(12,'Doussie',1,'2025-10-04 02:54:15',NULL,'actif','2026-08-03 10:59:09',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'XAF',1,NULL),(13,'LAGON Club de Yaoundé',NULL,'2025-10-04 02:54:15',NULL,'actif','2026-08-03 10:59:09','Club privé',NULL,'Yaoundé',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'XAF',1,NULL),(14,'Salle de conférence',13,'2025-10-04 02:54:15',NULL,'actif','2026-08-03 10:59:09',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'XAF',1,NULL),(15,'Salle de réunion 1',13,'2025-10-04 02:54:15',NULL,'actif','2026-08-03 10:59:09',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'XAF',1,NULL),(16,'Salle de réunion 2',13,'2025-10-04 02:54:15',NULL,'actif','2026-08-03 10:59:09',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'XAF',1,NULL),(17,'Palais des Congrès de Yaoundé',NULL,'2025-10-04 02:54:15',NULL,'actif','2026-08-03 10:59:09','Centre de congrès',NULL,'Yaoundé',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'XAF',1,NULL),(18,'Grande salle de conférence',17,'2025-10-04 02:54:15',NULL,'actif','2026-08-03 10:59:09',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'XAF',1,NULL),(19,'Hôtel Mont Fébé',NULL,'2025-10-04 02:54:15',NULL,'actif','2026-08-03 10:59:09','Hôtel',NULL,'Yaoundé',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'XAF',1,NULL),(20,'Salle de conférence',19,'2025-10-04 02:54:15',NULL,'actif','2026-08-03 10:59:09',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'XAF',1,NULL),(21,'Salle de réunion',19,'2025-10-04 02:54:15',NULL,'actif','2026-08-03 10:59:09',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'XAF',1,NULL),(22,'Hôtel Starland',NULL,'2025-10-04 02:54:15',NULL,'actif','2026-08-03 10:59:09','Hôtel',NULL,'Yaoundé',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'XAF',1,NULL),(23,'Salle de conférence',22,'2025-10-04 02:54:15',NULL,'actif','2026-08-03 10:59:09',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'XAF',1,NULL),(24,'Salle de réunion',22,'2025-10-04 02:54:15',NULL,'actif','2026-08-03 10:59:09',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'XAF',1,NULL);
/*!40000 ALTER TABLE `locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_log`
--

DROP TABLE IF EXISTS `maintenance_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action` varchar(60) NOT NULL,
  `detail` varchar(255) DEFAULT NULL,
  `status` enum('succes','echec') NOT NULL DEFAULT 'succes',
  `user_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_action_date` (`action`,`created_at`),
  KEY `fk_maint_user` (`user_id`),
  CONSTRAINT `fk_maint_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_log`
--

LOCK TABLES `maintenance_log` WRITE;
/*!40000 ALTER TABLE `maintenance_log` DISABLE KEYS */;
INSERT INTO `maintenance_log` VALUES (1,'sauvegarde','netandpro-2026-08-04T07-40-08.sql (42 Ko) — automatique','succes',NULL,'2026-08-04 07:40:08'),(2,'test_email','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials ffacd0b85a97d-47fd4068fb7sm42661420f8f.0 - gsmtp','echec',1,'2026-08-04 09:18:43'),(3,'sauvegarde','netandpro-2026-08-04T09-36-39.sql (43 Ko) — automatique','succes',NULL,'2026-08-04 09:36:39'),(4,'sauvegarde','netandpro-2026-08-04T09-40-04.sql (43 Ko) — automatique','succes',NULL,'2026-08-04 09:40:05'),(5,'sauvegarde','netandpro-2026-08-04T09-57-27.sql (43 Ko) — automatique','succes',NULL,'2026-08-04 09:57:38'),(6,'sauvegarde','netandpro-2026-08-04T10-10-41.sql (43 Ko) — automatique','succes',NULL,'2026-08-04 10:10:41'),(7,'sauvegarde','netandpro-2026-08-04T10-17-18.sql (43 Ko) — automatique','succes',NULL,'2026-08-04 10:17:19'),(8,'sauvegarde','netandpro-2026-08-04T10-38-44.sql (44 Ko) — automatique','succes',NULL,'2026-08-04 10:38:44'),(9,'sauvegarde','netandpro-2026-08-04T11-09-50.sql (44 Ko) — automatique','succes',NULL,'2026-08-04 11:09:53'),(10,'sauvegarde','netandpro-2026-08-04T11-33-03.sql (44 Ko) — automatique','succes',NULL,'2026-08-04 11:33:03'),(11,'sauvegarde','netandpro-2026-08-04T11-47-30.sql (44 Ko) — manuelle','succes',1,'2026-08-04 11:47:30'),(12,'sauvegarde','netandpro-2026-08-04T12-46-29.sql (44 Ko) — automatique','succes',NULL,'2026-08-04 12:46:30'),(13,'sauvegarde','netandpro-2026-08-04T12-50-08.sql (44 Ko) — automatique','succes',NULL,'2026-08-04 12:50:08'),(14,'sauvegarde','netandpro-2026-08-04T12-50-49.sql (45 Ko) — automatique','succes',NULL,'2026-08-04 12:50:49'),(15,'sauvegarde','netandpro-2026-08-04T12-53-08.sql (44 Ko) — automatique','succes',NULL,'2026-08-04 12:53:08'),(16,'test_email','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 5b1f17b1804b1-49949fc7047sm93211515e9.3 - gsmtp','echec',1,'2026-08-04 12:57:31'),(17,'test_email','envoyé à tanzifelix@gmail.com','succes',1,'2026-08-04 13:10:57'),(18,'test_email','envoyé à tanzifelix@gmail.com','succes',1,'2026-08-04 13:11:14'),(19,'sauvegarde','netandpro-2026-08-04T13-17-15.sql (46 Ko) — automatique','succes',NULL,'2026-08-04 13:17:16'),(20,'sauvegarde','netandpro-2026-08-04T13-20-09.sql (46 Ko) — automatique','succes',NULL,'2026-08-04 13:20:09'),(21,'sauvegarde','netandpro-2026-08-04T13-22-42.sql (46 Ko) — automatique','succes',NULL,'2026-08-04 13:22:42'),(22,'sauvegarde','netandpro-2026-08-04T13-22-52.sql (46 Ko) — automatique','succes',NULL,'2026-08-04 13:22:53'),(23,'sauvegarde','netandpro-2026-08-04T13-23-23.sql (46 Ko) — automatique','succes',NULL,'2026-08-04 13:23:23'),(24,'sauvegarde','netandpro-2026-08-04T13-28-38.sql (47 Ko) — automatique','succes',NULL,'2026-08-04 13:28:38'),(25,'sauvegarde','netandpro-2026-08-04T13-34-03.sql (47 Ko) — automatique','succes',NULL,'2026-08-04 13:34:03'),(26,'test_email','envoyé à tanzifelix@gmail.com','succes',1,'2026-08-04 13:34:07'),(27,'sauvegarde','netandpro-2026-08-04T13-48-59.sql (47 Ko) — automatique','succes',NULL,'2026-08-04 13:48:59'),(28,'sauvegarde','netandpro-2026-08-04T13-50-49.sql (47 Ko) — automatique','succes',NULL,'2026-08-04 13:50:49'),(29,'sauvegarde','netandpro-2026-08-04T14-14-13.sql (47 Ko) — automatique','succes',NULL,'2026-08-04 14:14:14'),(30,'sauvegarde','netandpro-2026-08-04T14-45-06.sql (49 Ko) — automatique','succes',NULL,'2026-08-04 14:45:08');
/*!40000 ALTER TABLE `maintenance_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `message_replies`
--

DROP TABLE IF EXISTS `message_replies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message_replies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `message_id` int NOT NULL,
  `admin_id` int DEFAULT NULL,
  `admin_email` varchar(190) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  KEY `idx_message` (`message_id`),
  CONSTRAINT `message_replies_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `contact_messages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `message_replies_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message_replies`
--

LOCK TABLES `message_replies` WRITE;
/*!40000 ALTER TABLE `message_replies` DISABLE KEYS */;
INSERT INTO `message_replies` VALUES (1,7,1,'tanzifelix@gmail.com','Bonjour Felix, c\'est un test d\'envoi depuis l\'interface pour voir que tout est correct dans l\'envoi des mail depuis l\'interface','2026-08-03 14:15:56'),(2,7,1,'tanzifelix@gmail.com','test pour message','2026-08-03 14:52:19'),(3,7,1,'tanzifelix@gmail.com','Bonjour Felix,\n\nLa salle souhaitée est malheureusement déjà réservée sur ces dates. Nous pouvons vous proposer des créneaux alternatifs ou une autre salle de capacité équivalente.\n\nCordialement,\nL\'équipe NetandProEvents','2026-08-03 14:53:29');
/*!40000 ALTER TABLE `message_replies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schema_migrations`
--

DROP TABLE IF EXISTS `schema_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schema_migrations` (
  `filename` varchar(255) NOT NULL,
  `applied_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`filename`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schema_migrations`
--

LOCK TABLES `schema_migrations` WRITE;
/*!40000 ALTER TABLE `schema_migrations` DISABLE KEYS */;
INSERT INTO `schema_migrations` VALUES ('2026_08_audit_log.sql','2026-08-04 14:17:35'),('2026_08_email_log.sql','2026-08-04 13:14:52'),('2026_08_events_stats.sql','2026-08-03 12:04:45'),('2026_08_locations_extend.sql','2026-08-03 10:59:09'),('2026_08_messages.sql','2026-08-03 13:33:34'),('2026_08_settings_contact.sql','2026-08-04 10:35:09'),('2026_08_settings_fix_accent.sql','2026-08-04 09:34:28'),('2026_08_settings.sql','2026-08-04 07:12:30'),('2026_08_site_sections.sql','2026-08-04 13:48:00'),('2026_08_testimonials.sql','2026-08-03 14:42:00'),('2026_08_users.sql','2026-08-03 16:03:56'),('2026_08_waitlist.sql','2026-08-04 12:45:07');
/*!40000 ALTER TABLE `schema_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_catalog`
--

DROP TABLE IF EXISTS `service_catalog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_catalog` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `unit` enum('forfait','par jour','par personne','par heure') NOT NULL DEFAULT 'forfait',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_service_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_catalog`
--

LOCK TABLES `service_catalog` WRITE;
/*!40000 ALTER TABLE `service_catalog` DISABLE KEYS */;
INSERT INTO `service_catalog` VALUES (1,'Sonorisation',150000.00,'forfait',1,1,'2026-08-04 07:12:30','2026-08-04 07:12:30'),(2,'Vidéoprojection',90000.00,'forfait',1,2,'2026-08-04 07:12:30','2026-08-04 07:12:30'),(3,'Traiteur',450000.00,'par personne',1,3,'2026-08-04 07:12:30','2026-08-04 07:12:30'),(4,'Décoration florale',120000.00,'forfait',1,4,'2026-08-04 07:12:30','2026-08-04 07:12:30'),(5,'Sécurité',200000.00,'par jour',1,5,'2026-08-04 07:12:30','2026-08-04 07:12:30'),(6,'Captation vidéo',350000.00,'forfait',1,6,'2026-08-04 07:12:30','2026-08-04 07:12:30');
/*!40000 ALTER TABLE `service_catalog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `testimonials`
--

DROP TABLE IF EXISTS `testimonials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `testimonials` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `rating` tinyint unsigned DEFAULT NULL,
  `status` enum('en_attente','publie','masque') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en_attente',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `keep_forever` tinyint(1) NOT NULL DEFAULT '0',
  `event_id` int DEFAULT NULL,
  `client_email` varchar(190) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `moderated_at` timestamp NULL DEFAULT NULL,
  `moderated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_testi_event` (`event_id`),
  KEY `fk_testi_user` (`moderated_by`),
  KEY `idx_status` (`status`),
  KEY `idx_featured` (`is_featured`),
  CONSTRAINT `fk_testi_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_testi_user` FOREIGN KEY (`moderated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `testimonials`
--

LOCK TABLES `testimonials` WRITE;
/*!40000 ALTER TABLE `testimonials` DISABLE KEYS */;
/*!40000 ALTER TABLE `testimonials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_expiration` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('super_admin','superviseur') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'superviseur',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `twofa_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `must_change_password` tinyint(1) NOT NULL DEFAULT '0',
  `last_login_at` timestamp NULL DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_user_creator` (`created_by`),
  KEY `idx_role` (`role`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `fk_user_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'tanzifelix@gmail.com','$2a$10$ftu0176ujiDMAsQgCKi8yeHqjXpDtQO3EGBkABlcfrCSSekf1e5YS','2026-10-23','2025-10-04 02:54:15','Felix TANZI',NULL,'super_admin',1,0,0,'2026-08-04 13:33:35',NULL,'2026-08-04 13:33:35'),(2,'felixtz@gmail.com','$2b$10$KUpKwAuZsSmFAgWzIVOFuu6DHcODfN1ZUMpw2QB.JYU08JpgpFqx2','2026-08-11','2026-08-04 06:04:49','Felix TZ','+237698200792','superviseur',1,0,1,NULL,1,'2026-08-04 06:05:32'),(3,'nzikofelix@gmail.com','$2b$10$wZlWwEreKBuEUuzoBoympOdeaoUksh3r9jvuOqTO9NKdioTMIPQDq','2026-11-04','2026-08-04 06:06:20','Andre','+237698200792','superviseur',1,0,1,NULL,1,'2026-08-04 06:06:20');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'netandpro'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-04 15:46:47
