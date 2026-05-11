-- Adds the `address` column to `patients`. The frontend PatientForm sends it
-- and the Express layer references it, but the original hms.sql schema omitted it.
-- Idempotent so it can be re-run safely.
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address TEXT;
