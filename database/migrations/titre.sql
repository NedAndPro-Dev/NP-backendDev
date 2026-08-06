-- Titre de l'événement saisi par le client sur la page Planifier
ALTER TABLE events ADD COLUMN title VARCHAR(255) NULL AFTER client_name;