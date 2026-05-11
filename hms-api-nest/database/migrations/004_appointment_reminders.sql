-- Tracks when an appointment reminder email was sent, so the cron job
-- doesn't re-send the same reminder every tick. NULL = not yet reminded.
-- Re-set to NULL (e.g. by a manual force-resend) and the cron will pick
-- it up again on the next pass.

ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_appointments_reminder_due
    ON appointments(scheduled_start)
    WHERE status = 'scheduled' AND reminder_sent_at IS NULL;
