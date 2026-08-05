-- Traçage des envois automatiques : évite les doublons de rappel / demande d'avis
CREATE TABLE email_log (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    kind       VARCHAR(40) NOT NULL,
    event_id   INT NULL,
    recipient  VARCHAR(190) NOT NULL,
    status     ENUM('envoye','echec','ignore') NOT NULL DEFAULT 'envoye',
    detail     VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_kind_event (kind, event_id),
    INDEX idx_kind_date (kind, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;