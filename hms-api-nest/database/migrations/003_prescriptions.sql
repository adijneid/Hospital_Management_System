-- Prescriptions: one row per medication line item, attached to an appointment.
-- A doctor adds these during/after a visit; the API can render them into a
-- printable PDF for the patient.

CREATE TABLE IF NOT EXISTS prescriptions (
    prescription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id  UUID            NOT NULL REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    medication      VARCHAR(200)    NOT NULL,
    dosage          VARCHAR(100),                    -- e.g. "500 mg"
    frequency       VARCHAR(100),                    -- e.g. "twice daily"
    duration        VARCHAR(100),                    -- e.g. "7 days"
    instructions    TEXT,                            -- e.g. "after meals, avoid alcohol"
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_appointment
    ON prescriptions(appointment_id, created_at);
