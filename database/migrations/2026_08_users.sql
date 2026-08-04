ALTER TABLE users
  ADD COLUMN name          VARCHAR(150) NULL,
  ADD COLUMN phone         VARCHAR(50) NULL,
  ADD COLUMN role          ENUM('super_admin','superviseur') NOT NULL DEFAULT 'superviseur',
  ADD COLUMN is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN twofa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN last_login_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN created_by    INT NULL,
  ADD COLUMN updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD CONSTRAINT fk_user_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  ADD INDEX idx_role (role),
  ADD INDEX idx_active (is_active);

-- Le compte existant devient super admin
UPDATE users SET role = 'super_admin', name = 'Felix TANZI' WHERE email = 'tanzifelix@gmail.com';
UPDATE users SET name = SUBSTRING_INDEX(email, '@', 1) WHERE name IS NULL;