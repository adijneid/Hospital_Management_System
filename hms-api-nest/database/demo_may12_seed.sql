-- =============================================================
-- HMS Demo Seed — pegged to presentation date 2026-05-12 (Tuesday)
-- Wipes appointments + prescriptions + status history (keeps
-- users, doctors, doctor_availability, rooms, patients intact)
-- and re-inserts a rich demo dataset using ABSOLUTE dates so the
-- data stays correct on demo day no matter when the script ran.
-- =============================================================

BEGIN;

-- ── Wipe time-bound tables ───────────────────────────────────
TRUNCATE TABLE
    appointment_status_history,
    prescriptions,
    appointments
RESTART IDENTITY CASCADE;

-- =============================================================
-- TODAY (2026-05-12, Tuesday): 9 appointments across 4 doctors
-- Spread across morning + afternoon so the "Today" widget looks busy.
-- =============================================================
INSERT INTO appointments (appointment_id, patient_id, doctor_id, room_id, scheduled_start, scheduled_end, status, reason, created_by) VALUES
('e5000000-0000-0000-0000-000000000101', 'd4000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-000000000001',
 '2026-05-12 08:00+03', '2026-05-12 08:30+03', 'scheduled', 'Annual physical exam',          'a1000000-0000-0000-0000-000000000001'),

('e5000000-0000-0000-0000-000000000102', 'd4000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000005',
 '2026-05-12 09:00+03', '2026-05-12 09:45+03', 'scheduled', 'Cardiology follow-up — chest pain', 'a1000000-0000-0000-0000-000000000001'),

('e5000000-0000-0000-0000-000000000103', 'd4000000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-000000000002',
 '2026-05-12 09:30+03', '2026-05-12 10:00+03', 'scheduled', 'Hypertension review',           'a1000000-0000-0000-0000-000000000001'),

('e5000000-0000-0000-0000-000000000104', 'd4000000-0000-0000-0000-000000000007', 'b2000000-0000-0000-0000-000000000004', 'c3000000-0000-0000-0000-000000000003',
 '2026-05-12 10:30+03', '2026-05-12 11:00+03', 'scheduled', 'Pediatric asthma review',       'a1000000-0000-0000-0000-000000000002'),

('e5000000-0000-0000-0000-000000000105', 'd4000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-000000000008',
 '2026-05-12 11:00+03', '2026-05-12 12:30+03', 'scheduled', 'Appendectomy — surgical',        'a1000000-0000-0000-0000-000000000001'),

('e5000000-0000-0000-0000-000000000106', 'd4000000-0000-0000-0000-000000000005', 'b2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000005',
 '2026-05-12 13:00+03', '2026-05-12 13:30+03', 'scheduled', 'Diabetes + cardiac risk check', 'a1000000-0000-0000-0000-000000000002'),

('e5000000-0000-0000-0000-000000000107', 'd4000000-0000-0000-0000-00000000000a', 'b2000000-0000-0000-0000-000000000004', 'c3000000-0000-0000-0000-000000000003',
 '2026-05-12 14:00+03', '2026-05-12 14:30+03', 'scheduled', 'DTP booster vaccination',        'a1000000-0000-0000-0000-000000000001'),

('e5000000-0000-0000-0000-000000000108', 'd4000000-0000-0000-0000-000000000008', 'b2000000-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-000000000001',
 '2026-05-12 15:00+03', '2026-05-12 15:30+03', 'scheduled', 'Smoking cessation counselling', 'a1000000-0000-0000-0000-000000000002'),

('e5000000-0000-0000-0000-000000000109', 'd4000000-0000-0000-0000-000000000006', 'b2000000-0000-0000-0000-000000000001', NULL,
 '2026-05-12 16:00+03', '2026-05-12 16:30+03', 'scheduled', 'Walk-in — new patient intake',   'a1000000-0000-0000-0000-000000000002');

-- =============================================================
-- YESTERDAY (2026-05-11, Monday): 3 completed appointments
-- Useful for showing the "completed" state + prescription history.
-- =============================================================
INSERT INTO appointments (appointment_id, patient_id, doctor_id, room_id, scheduled_start, scheduled_end, status, reason, created_by) VALUES
('e5000000-0000-0000-0000-000000000201', 'd4000000-0000-0000-0000-000000000005', 'b2000000-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-000000000001',
 '2026-05-11 09:00+03', '2026-05-11 09:30+03', 'completed', 'Diabetes management review',    'a1000000-0000-0000-0000-000000000001'),

('e5000000-0000-0000-0000-000000000202', 'd4000000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-000000000002',
 '2026-05-11 10:30+03', '2026-05-11 11:00+03', 'completed', 'Blood pressure check',          'a1000000-0000-0000-0000-000000000001'),

('e5000000-0000-0000-0000-000000000203', 'd4000000-0000-0000-0000-000000000007', 'b2000000-0000-0000-0000-000000000004', 'c3000000-0000-0000-0000-000000000003',
 '2026-05-11 14:00+03', '2026-05-11 14:30+03', 'completed', 'Asthma inhaler training',       'a1000000-0000-0000-0000-000000000002');

-- =============================================================
-- TOMORROW (2026-05-13, Wednesday): 4 scheduled appointments
-- =============================================================
INSERT INTO appointments (appointment_id, patient_id, doctor_id, room_id, scheduled_start, scheduled_end, status, reason, created_by) VALUES
('e5000000-0000-0000-0000-000000000301', 'd4000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000005',
 '2026-05-13 09:00+03', '2026-05-13 09:30+03', 'scheduled', 'Cardiology consult',            'a1000000-0000-0000-0000-000000000001'),

('e5000000-0000-0000-0000-000000000302', 'd4000000-0000-0000-0000-000000000009', 'b2000000-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-000000000001',
 '2026-05-13 10:30+03', '2026-05-13 11:00+03', 'scheduled', 'Migraine prophylaxis review',   'a1000000-0000-0000-0000-000000000001'),

('e5000000-0000-0000-0000-000000000303', 'd4000000-0000-0000-0000-00000000000a', 'b2000000-0000-0000-0000-000000000004', 'c3000000-0000-0000-0000-000000000003',
 '2026-05-13 11:00+03', '2026-05-13 11:30+03', 'scheduled', 'Pediatric wellness check',      'a1000000-0000-0000-0000-000000000002'),

('e5000000-0000-0000-0000-000000000304', 'd4000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-000000000009',
 '2026-05-13 13:30+03', '2026-05-13 15:00+03', 'scheduled', 'Surgical pre-op consultation',  'a1000000-0000-0000-0000-000000000001');

-- =============================================================
-- This week (2026-05-14 Thu, 2026-05-15 Fri): 4 scheduled
-- =============================================================
INSERT INTO appointments (appointment_id, patient_id, doctor_id, room_id, scheduled_start, scheduled_end, status, reason, created_by) VALUES
('e5000000-0000-0000-0000-000000000401', 'd4000000-0000-0000-0000-000000000006', 'b2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000005',
 '2026-05-14 10:00+03', '2026-05-14 10:30+03', 'scheduled', 'New-patient cardiac evaluation','a1000000-0000-0000-0000-000000000002'),

('e5000000-0000-0000-0000-000000000402', 'd4000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-000000000008',
 '2026-05-14 14:00+03', '2026-05-14 15:30+03', 'scheduled', 'Post-op recovery check',        'a1000000-0000-0000-0000-000000000001'),

('e5000000-0000-0000-0000-000000000403', 'd4000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-000000000001',
 '2026-05-15 09:00+03', '2026-05-15 09:30+03', 'scheduled', 'Routine check-up',              'a1000000-0000-0000-0000-000000000001'),

('e5000000-0000-0000-0000-000000000404', 'd4000000-0000-0000-0000-000000000007', 'b2000000-0000-0000-0000-000000000004', 'c3000000-0000-0000-0000-000000000003',
 '2026-05-15 11:00+03', '2026-05-15 11:30+03', 'scheduled', 'Pediatric follow-up',           'a1000000-0000-0000-0000-000000000002');

-- =============================================================
-- Next week (2026-05-18 Mon, 2026-05-19 Tue): 3 scheduled
-- =============================================================
INSERT INTO appointments (appointment_id, patient_id, doctor_id, room_id, scheduled_start, scheduled_end, status, reason, created_by) VALUES
('e5000000-0000-0000-0000-000000000501', 'd4000000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-000000000002',
 '2026-05-18 08:30+03', '2026-05-18 09:00+03', 'scheduled', 'Quarterly hypertension review', 'a1000000-0000-0000-0000-000000000001'),

('e5000000-0000-0000-0000-000000000502', 'd4000000-0000-0000-0000-000000000008', 'b2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000005',
 '2026-05-18 11:00+03', '2026-05-18 11:30+03', 'scheduled', 'Cardiac risk stratification',   'a1000000-0000-0000-0000-000000000002'),

('e5000000-0000-0000-0000-000000000503', 'd4000000-0000-0000-0000-00000000000a', 'b2000000-0000-0000-0000-000000000004', 'c3000000-0000-0000-0000-000000000004',
 '2026-05-19 10:00+03', '2026-05-19 10:30+03', 'scheduled', 'Pediatric — ear infection',      'a1000000-0000-0000-0000-000000000001');

-- =============================================================
-- Prescriptions on yesterday's completed visits
-- =============================================================
INSERT INTO prescriptions (appointment_id, medication, dosage, frequency, duration, instructions) VALUES
('e5000000-0000-0000-0000-000000000201', 'Metformin',     '500 mg',  'twice daily',     '30 days', 'Take with meals to reduce GI side-effects'),
('e5000000-0000-0000-0000-000000000201', 'Atorvastatin',  '20 mg',   'once daily',      '30 days', 'Take in the evening'),
('e5000000-0000-0000-0000-000000000201', 'Aspirin',       '81 mg',   'once daily',      '90 days', 'Cardioprotective low-dose'),
('e5000000-0000-0000-0000-000000000202', 'Amlodipine',    '5 mg',    'once daily',      '30 days', 'Monitor blood pressure weekly'),
('e5000000-0000-0000-0000-000000000203', 'Salbutamol inhaler', '100 mcg', 'as needed (max 4x/day)', '30 days', 'Use spacer; rinse mouth after each dose');

-- =============================================================
-- Status history — base row per appointment + transitions for
-- the three completed ones from May 11.
-- =============================================================
INSERT INTO appointment_status_history (appointment_id, old_status, new_status, changed_by, changed_at)
SELECT appointment_id, NULL, 'scheduled', created_by, scheduled_start - INTERVAL '7 days'
FROM appointments;

INSERT INTO appointment_status_history (appointment_id, old_status, new_status, changed_by, changed_at) VALUES
('e5000000-0000-0000-0000-000000000201', 'scheduled', 'completed', 'a1000000-0000-0000-0000-000000000003', '2026-05-11 09:35+03'),
('e5000000-0000-0000-0000-000000000202', 'scheduled', 'completed', 'a1000000-0000-0000-0000-000000000003', '2026-05-11 11:05+03'),
('e5000000-0000-0000-0000-000000000203', 'scheduled', 'completed', 'a1000000-0000-0000-0000-000000000006', '2026-05-11 14:35+03');

-- =============================================================
-- Reset reminder_sent_at so the email-reminder demo runs cleanly
-- =============================================================
UPDATE appointments SET reminder_sent_at = NULL WHERE status = 'scheduled';

COMMIT;

-- ── Verification ─────────────────────────────────────────────
SELECT 'TOTAL appointments'        AS metric, COUNT(*)::text AS value FROM appointments
UNION ALL SELECT 'May 12 (today on demo day)', COUNT(*)::text FROM appointments WHERE scheduled_start::date = DATE '2026-05-12'
UNION ALL SELECT 'May 11 (yesterday)',         COUNT(*)::text FROM appointments WHERE scheduled_start::date = DATE '2026-05-11'
UNION ALL SELECT 'Future (>= May 13)',         COUNT(*)::text FROM appointments WHERE scheduled_start::date >= DATE '2026-05-13'
UNION ALL SELECT 'Older than May 11 (should be 0)', COUNT(*)::text FROM appointments WHERE scheduled_start::date < DATE '2026-05-11'
UNION ALL SELECT 'Prescriptions',              COUNT(*)::text FROM prescriptions
UNION ALL SELECT 'Status history rows',        COUNT(*)::text FROM appointment_status_history
UNION ALL SELECT 'Patients (unchanged)',       COUNT(*)::text FROM patients
UNION ALL SELECT 'Doctors (unchanged)',        COUNT(*)::text FROM doctors
UNION ALL SELECT 'Rooms (unchanged)',          COUNT(*)::text FROM rooms;
