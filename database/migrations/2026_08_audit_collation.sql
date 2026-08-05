-- audit_log a été créée avec « DEFAULT CHARSET=utf8mb4 » sans COLLATE :
-- MySQL applique alors la collation par défaut du jeu de caractères
-- (utf8mb4_0900_ai_ci), et non celle de la base (utf8mb4_unicode_ci).
-- Toute expression combinant une colonne texte d'audit_log avec une colonne
-- de users échoue en ER_CANT_AGGREGATE_2COLLATIONS.
ALTER TABLE audit_log CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
