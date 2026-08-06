-- Contraintes de valeurs : équivalent PostgreSQL des ENUM MySQL d'origine.
--
-- Pourquoi des CHECK plutôt que des types ENUM PostgreSQL : plusieurs jeux
-- contiennent espaces et accents (« En attente », « Club privé », « par jour »).
-- Prisma ne peut pas les exprimer en identifiant d'enum sans @map, et @map
-- ferait renvoyer « EN_ATTENTE » par le client au lieu de « En attente » —
-- rupture silencieuse du contrat consommé par le frontend.
--
-- Les colonnes NULLABLE restent acceptées à NULL : un CHECK n'échoue que
-- lorsqu'il vaut FALSE, jamais lorsqu'il vaut NULL.
--
-- Pour ajouter une valeur : modifier le CHECK ici via une nouvelle migration,
-- et le commentaire /// correspondant dans schema.prisma.

ALTER TABLE "users"
    ADD CONSTRAINT "users_role_check"
    CHECK ("role" IN ('super_admin', 'superviseur'));

ALTER TABLE "locations"
    ADD CONSTRAINT "locations_status_check"
    CHECK ("status" IN ('actif', 'inactif', 'archive'));

ALTER TABLE "locations"
    ADD CONSTRAINT "locations_type_check"
    CHECK ("type" IN ('Hôtel', 'Club privé', 'Centre de congrès', 'Salle des fêtes', 'Autre'));

ALTER TABLE "events"
    ADD CONSTRAINT "events_status_check"
    CHECK ("status" IN ('En attente', 'Confirmé', 'Annulé'));

ALTER TABLE "events"
    ADD CONSTRAINT "events_payment_method_check"
    CHECK ("payment_method" IN ('Virement bancaire', 'Espèces', 'MTN Mobile Money', 'Orange Money', 'Chèque'));

ALTER TABLE "testimonials"
    ADD CONSTRAINT "testimonials_status_check"
    CHECK ("status" IN ('en_attente', 'publie', 'masque'));

ALTER TABLE "contact_messages"
    ADD CONSTRAINT "contact_messages_status_check"
    CHECK ("status" IN ('nouveau', 'lu', 'traite'));

ALTER TABLE "app_settings"
    ADD CONSTRAINT "app_settings_type_check"
    CHECK ("type" IN ('string', 'int', 'float', 'bool', 'json'));

ALTER TABLE "email_log"
    ADD CONSTRAINT "email_log_status_check"
    CHECK ("status" IN ('envoye', 'echec', 'ignore'));

ALTER TABLE "maintenance_log"
    ADD CONSTRAINT "maintenance_log_status_check"
    CHECK ("status" IN ('succes', 'echec'));

ALTER TABLE "audit_log"
    ADD CONSTRAINT "audit_log_category_check"
    CHECK ("category" IN ('param', 'resa', 'moder', 'systeme', 'email', 'acces', 'contenu', 'users'));

ALTER TABLE "audit_log"
    ADD CONSTRAINT "audit_log_status_check"
    CHECK ("status" IN ('succes', 'echec', 'attention'));

ALTER TABLE "closures"
    ADD CONSTRAINT "closures_kind_check"
    CHECK ("kind" IN ('Férié', 'Technique', 'Autre'));

ALTER TABLE "service_catalog"
    ADD CONSTRAINT "service_catalog_unit_check"
    CHECK ("unit" IN ('forfait', 'par jour', 'par personne', 'par heure'));
