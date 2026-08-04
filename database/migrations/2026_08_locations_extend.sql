ALTER TABLE locations
  ADD COLUMN description   TEXT NULL,
  ADD COLUMN status        ENUM('actif','inactif','archive') NOT NULL DEFAULT 'actif',
  ADD COLUMN updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Champs SITE (parent_id IS NULL)
  ADD COLUMN type          ENUM('Hôtel','Club privé','Centre de congrès','Salle des fêtes','Autre') NULL,
  ADD COLUMN address       VARCHAR(255) NULL,
  ADD COLUMN city          VARCHAR(120) NULL,
  ADD COLUMN quartier      VARCHAR(120) NULL,
  ADD COLUMN latitude      DECIMAL(10,7) NULL,
  ADD COLUMN longitude     DECIMAL(10,7) NULL,
  ADD COLUMN contact_name  VARCHAR(150) NULL,
  ADD COLUMN contact_phone VARCHAR(50)  NULL,
  ADD COLUMN contact_email VARCHAR(190) NULL,
  ADD COLUMN website       VARCHAR(255) NULL,
  ADD COLUMN logo_url      VARCHAR(255) NULL,

  -- Champs SALLE (parent_id IS NOT NULL)
  ADD COLUMN capacity      INT NULL,
  ADD COLUMN surface       DECIMAL(8,2) NULL,
  ADD COLUMN floor         VARCHAR(50) NULL,
  ADD COLUMN layouts       JSON NULL,
  ADD COLUMN equipment     JSON NULL,
  ADD COLUMN price_per_day DECIMAL(12,2) NULL,
  ADD COLUMN currency      CHAR(3) NOT NULL DEFAULT 'XAF',
  ADD COLUMN is_bookable   BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN plan_url      VARCHAR(255) NULL,

  ADD UNIQUE KEY uniq_name_parent (parent_id, name),
  ADD INDEX idx_parent (parent_id),
  ADD INDEX idx_status (status);

-- Typage des sites existants
UPDATE locations SET type = 'Hôtel'             WHERE parent_id IS NULL AND (name LIKE 'H%tel%' OR name LIKE 'Hilton%');
UPDATE locations SET type = 'Club privé'        WHERE parent_id IS NULL AND name LIKE 'LAGON%';
UPDATE locations SET type = 'Centre de congrès' WHERE parent_id IS NULL AND name LIKE 'Palais%';
UPDATE locations SET city = 'Yaoundé'           WHERE parent_id IS NULL;