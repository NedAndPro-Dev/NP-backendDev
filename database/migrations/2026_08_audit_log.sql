CREATE TABLE audit_log (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    category    ENUM('param','resa','moder','systeme','email','acces','contenu','users') NOT NULL,
    action      VARCHAR(120) NOT NULL,
    target      VARCHAR(190) NULL,
    detail      VARCHAR(500) NULL,
    status      ENUM('succes','echec','attention') NOT NULL DEFAULT 'succes',
    changes     JSON NULL,                       -- [{key, before, after}]
    user_id     INT NULL,
    actor_name  VARCHAR(120) NULL,               -- figé : survit à la suppression du compte
    actor_email VARCHAR(190) NULL,
    actor_role  VARCHAR(40)  NULL,
    ip          VARCHAR(64)  NULL,
    user_agent  VARCHAR(255) NULL,
    method      VARCHAR(8)   NULL,
    path        VARCHAR(190) NULL,
    http_status SMALLINT     NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_date (created_at),
    INDEX idx_audit_cat (category, created_at),
    INDEX idx_audit_user (user_id, created_at),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;