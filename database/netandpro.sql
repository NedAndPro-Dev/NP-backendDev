
-- Table users (administrateurs)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    password_expiration DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table locations (lieux hiérarchiques)
CREATE TABLE locations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    parent_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES locations(id) ON DELETE CASCADE
);

-- Table events (événements)
CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50),
    company_name VARCHAR(255),
    date_start DATETIME NOT NULL,
    date_end DATETIME NOT NULL,
    location_id INT NOT NULL,
    services JSON NOT NULL,
    payment_method ENUM('Virement bancaire', 'Espèces', 'Mobile Money', 'Chèque') NOT NULL,
    conditions_accepted BOOLEAN DEFAULT FALSE,
    status ENUM('En attente', 'Confirmé', 'Annulé') DEFAULT 'En attente',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id)
);

-- Table testimonials (témoignages)
CREATE TABLE testimonials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_name VARCHAR(255) NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insérer les lieux et salles
-- 1. Hilton Yaoundé
INSERT INTO locations (name, parent_id) VALUES ('Hilton Yaoundé', NULL);
SET @hilton_id = LAST_INSERT_ID();
INSERT INTO locations (name, parent_id) VALUES 
('Bouma A', @hilton_id),
('Bouma B', @hilton_id),
('Bouma C', @hilton_id),
('Bete A', @hilton_id),
('Bete B', @hilton_id),
('Bete C', @hilton_id),
('Mont Bamboutos', @hilton_id),
('Mont Kenya', @hilton_id),
('Mont Cameroun', @hilton_id),
('Mont Kilimandjaro', @hilton_id),
('Doussie', @hilton_id);

-- 2. LAGON Club de Yaoundé
INSERT INTO locations (name, parent_id) VALUES ('LAGON Club de Yaoundé', NULL);
SET @lagon_id = LAST_INSERT_ID();
INSERT INTO locations (name, parent_id) VALUES 
('Salle de conférence', @lagon_id),
('Salle de réunion 1', @lagon_id),
('Salle de réunion 2', @lagon_id);

-- 3. Palais des Congrès de Yaoundé
INSERT INTO locations (name, parent_id) VALUES ('Palais des Congrès de Yaoundé', NULL);
SET @palais_id = LAST_INSERT_ID();
INSERT INTO locations (name, parent_id) VALUES ('Grande salle de conférence', @palais_id);

-- 4. Hôtel Mont Fébé
INSERT INTO locations (name, parent_id) VALUES ('Hôtel Mont Fébé', NULL);
SET @febe_id = LAST_INSERT_ID();
INSERT INTO locations (name, parent_id) VALUES 
('Salle de conférence', @febe_id),
('Salle de réunion', @febe_id);

-- 5. Hôtel Starland
INSERT INTO locations (name, parent_id) VALUES ('Hôtel Starland', NULL);
SET @starland_id = LAST_INSERT_ID();
INSERT INTO locations (name, parent_id) VALUES 
('Salle de conférence', @starland_id),
('Salle de réunion', @starland_id);

-- Créer un compte admin par défaut (password: yaounde0102)
INSERT INTO users (email, password_hash, password_expiration) VALUES 
('tanzifelix@gmail.com', '$2a$10$ftu0176ujiDMAsQgCKi8yeHqjXpDtQO3EGBkABlcfrCSSekf1e5YS', DATE_ADD(CURDATE(), INTERVAL 3 MONTH));

-- Table pour stocker les messages de contact
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('nouveau', 'lu', 'traite') DEFAULT 'nouveau',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Remplacer 'Mobile Money' par 'MTN Mobile Money' dans les événements existants
UPDATE events 
SET payment_method = 'MTN Mobile Money' 
WHERE payment_method = 'Mobile Money';

-- Modifier la colonne payment_method avec les nouveaux modes de paiement
ALTER TABLE events 
MODIFY COLUMN payment_method ENUM(
    'Virement bancaire',
    'Espèces',
    'MTN Mobile Money',
    'Orange Money',
    'Chèque'
) NOT NULL;