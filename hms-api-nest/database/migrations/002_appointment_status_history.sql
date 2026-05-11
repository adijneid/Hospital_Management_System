-- Audit trail for appointment status transitions.
-- Every change of `appointments.status` writes one row here so we can answer
-- "who marked this appointment as completed and when?" at any later point.

CREATE TABLE IF NOT EXISTS appointment_status_history (
    history_id      SERIAL PRIMARY KEY,
    appointment_id  UUID                NOT NULL REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    old_status      appointment_status,                                  -- NULL on the first row right after creation
    new_status      appointment_status  NOT NULL,
    changed_by      UUID                REFERENCES users(user_id),       -- NULL for system-initiated changes
    changed_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_history_appointment
    ON appointment_status_history(appointment_id, changed_at DESC);
