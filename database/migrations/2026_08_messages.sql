ALTER TABLE contact_messages
  ADD COLUMN replied_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN read_at    TIMESTAMP NULL DEFAULT NULL,
  ADD INDEX idx_email (email);

-- Historique des réponses envoyées depuis l'admin
CREATE TABLE IF NOT EXISTS message_replies (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    message_id  INT NOT NULL,
    admin_id    INT NULL,
    admin_email VARCHAR(190) NULL,
    body        TEXT NOT NULL,
    sent_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES contact_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id)   REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_message (message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;