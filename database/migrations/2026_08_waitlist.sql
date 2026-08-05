-- Liste d'attente : le paramètre resa.waitlist_enabled n'avait aucun support en base.
ALTER TABLE events
    ADD COLUMN is_waitlisted BOOLEAN NOT NULL DEFAULT FALSE AFTER status,
    ADD INDEX idx_event_waitlist (location_id, is_waitlisted);