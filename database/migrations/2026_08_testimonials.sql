ALTER TABLE testimonials
  ADD COLUMN rating       TINYINT UNSIGNED NULL,
  ADD COLUMN status       ENUM('en_attente','publie','masque') NOT NULL DEFAULT 'en_attente',
  ADD COLUMN is_featured  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN keep_forever BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN event_id     INT NULL,
  ADD COLUMN client_email VARCHAR(190) NULL,
  ADD COLUMN moderated_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN moderated_by INT NULL,
  ADD CONSTRAINT fk_testi_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_testi_user  FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL,
  ADD INDEX idx_status (status),
  ADD INDEX idx_featured (is_featured);

UPDATE testimonials SET status = 'publie', rating = 5 WHERE status = 'en_attente';