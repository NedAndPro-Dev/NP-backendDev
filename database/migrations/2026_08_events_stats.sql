ALTER TABLE events
  ADD COLUMN attendees   INT NULL COMMENT 'Nombre de personnes attendues',
  ADD COLUMN updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD INDEX idx_date_start (date_start),
  ADD INDEX idx_status_date (status, date_start),
  ADD INDEX idx_client_email (client_email);

-- Valeur de repli : la capacité de la salle réservée
UPDATE events e
JOIN locations l ON l.id = e.location_id
SET e.attendees = l.capacity
WHERE e.attendees IS NULL AND l.capacity IS NOT NULL;