-- =============================================================
-- HMS Reset + Reseed
-- Wipes all data and inserts a fresh test dataset.
-- Run:  psql -U postgres -d hms_db -f reset_and_seed.sql
-- All demo passwords: password123
-- =============================================================

BEGIN;

-- ── Wipe everything (children first via CASCADE) ─────────────
TRUNCATE TABLE
    appointment_status_history,
    prescriptions,
    appointments,
    doctor_availability,
    patients,
    doctors,
    rooms,
    users
RESTART IDENTITY CASCADE;

-- ── Users (bcrypt hash of 'password123') ─────────────────────
INSERT INTO users (user_id, email, username, password_hash, role, full_name) VALUES
('a1000000-0000-0000-0000-000000000001', 'sarah.jenkins@hms.lb',  'sarah.jenkins',  '$2b$10$ce2.Iao7lSn/aZd5p7qwZuyEBYGhJS6T8lWYGd4hq3vlkh3T7xEZ2', 'staff',  'Sarah Jenkins'),
('a1000000-0000-0000-0000-000000000002', 'michael.reed@hms.lb',   'michael.reed',   '$2b$10$ce2.Iao7lSn/aZd5p7qwZuyEBYGhJS6T8lWYGd4hq3vlkh3T7xEZ2', 'staff',  'Michael Reed'),
('a1000000-0000-0000-0000-000000000003', 'dr.hassan@hms.lb',      'dr.hassan',      '$2b$10$ce2.Iao7lSn/aZd5p7qwZuyEBYGhJS6T8lWYGd4hq3vlkh3T7xEZ2', 'doctor', 'Dr. Ahmad Hassan'),
('a1000000-0000-0000-0000-000000000004', 'dr.saab@hms.lb',        'dr.saab',        '$2b$10$ce2.Iao7lSn/aZd5p7qwZuyEBYGhJS6T8lWYGd4hq3vlkh3T7xEZ2', 'doctor', 'Dr. Lara Saab'),
('a1000000-0000-0000-0000-000000000005', 'dr.khoury@hms.lb',      'dr.khoury',      '$2b$10$ce2.Iao7lSn/aZd5p7qwZuyEBYGhJS6T8lWYGd4hq3vlkh3T7xEZ2', 'doctor', 'Dr. Georges Khoury'),
('a1000000-0000-0000-0000-000000000006', 'dr.maalouf@hms.lb',     'dr.maalouf',     '$2b$10$ce2.Iao7lSn/aZd5p7qwZuyEBYGhJS6T8lWYGd4hq3vlkh3T7xEZ2', 'doctor', 'Dr. Rita Maalouf');

-- ── Doctors ──────────────────────────────────────────────────
INSERT INTO doctors (doctor_id, user_id, first_name, last_name, specialty, phone) VALUES
('b2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 'Ahmad',   'Hassan',  'General Medicine', '+961-70-111001'),
('b2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000004', 'Lara',    'Saab',    'Cardiology',       '+961-70-111002'),
('b2000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000005', 'Georges', 'Khoury',  'Surgery',          '+961-70-111003'),
('b2000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000006', 'Rita',    'Maalouf', 'Pediatrics',       '+961-70-111004');

-- ── Doctor Availability  (day_of_week: 0=Sun … 6=Sat) ───────
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time) VALUES
-- Hassan: Mon, Wed, Fri 08:00–16:00
('b2000000-0000-0000-0000-000000000001', 1, '08:00', '16:00'),
('b2000000-0000-0000-0000-000000000001', 3, '08:00', '16:00'),
('b2000000-0000-0000-0000-000000000001', 5, '08:00', '16:00'),
-- Saab: Tue, Thu 09:00–17:00
('b2000000-0000-0000-0000-000000000002', 2, '09:00', '17:00'),
('b2000000-0000-0000-0000-000000000002', 4, '09:00', '17:00'),
-- Khoury: Mon–Thu 07:00–15:00
('b2000000-0000-0000-0000-000000000003', 1, '07:00', '15:00'),
('b2000000-0000-0000-0000-000000000003', 2, '07:00', '15:00'),
('b2000000-0000-0000-0000-000000000003', 3, '07:00', '15:00'),
('b2000000-0000-0000-0000-000000000003', 4, '07:00', '15:00'),
-- Maalouf: Mon, Wed, Fri 10:00–18:00
('b2000000-0000-0000-0000-000000000004', 1, '10:00', '18:00'),
('b2000000-0000-0000-0000-000000000004', 3, '10:00', '18:00'),
('b2000000-0000-0000-0000-000000000004', 5, '10:00', '18:00');

-- ── Rooms ────────────────────────────────────────────────────
INSERT INTO rooms (room_id, room_number, room_type, floor, capacity, status) VALUES
('c3000000-0000-0000-0000-000000000001', '101', 'consultation', 1, 1, 'available'),
('c3000000-0000-0000-0000-000000000002', '102', 'consultation', 1, 1, 'available'),
('c3000000-0000-0000-0000-000000000003', '103', 'consultation', 1, 1, 'available'),
('c3000000-0000-0000-0000-000000000004', '104', 'consultation', 1, 1, 'occupied'),
('c3000000-0000-0000-0000-000000000005', '201', 'treatment',    2, 2, 'available'),
('c3000000-0000-0000-0000-000000000006', '202', 'treatment',    2, 2, 'available'),
('c3000000-0000-0000-0000-000000000007', '203', 'treatment',    2, 2, 'maintenance'),
('c3000000-0000-0000-0000-000000000008', '301', 'surgery',      3, 1, 'available'),
('c3000000-0000-0000-0000-000000000009', '302', 'surgery',      3, 1, 'available'),
('c3000000-0000-0000-0000-00000000000a', '303', 'surgery',      3, 1, 'maintenance');

-- ── Patients ─────────────────────────────────────────────────
INSERT INTO patients (patient_id, first_name, last_name, date_of_birth, gender, phone, email, blood_type, medical_notes, address, created_by) VALUES
('d4000000-0000-0000-0000-000000000001', 'Sara',     'Mansour',   '1990-04-15', 'Female', '+961-71-200001', 'sara.mansour@email.com',  'A+',  'Penicillin allergy',                'Hamra St., Beirut',          'a1000000-0000-0000-0000-000000000001'),
('d4000000-0000-0000-0000-000000000002', 'Karim',    'Bitar',     '1985-09-22', 'Male',   '+961-71-200002', 'karim.bitar@email.com',   'O-',  NULL,                                'Achrafieh, Beirut',          'a1000000-0000-0000-0000-000000000001'),
('d4000000-0000-0000-0000-000000000003', 'Nadia',    'Frem',      '2001-01-30', 'Female', '+961-71-200003', NULL,                      'B+',  'Lactose intolerant',                'Jounieh, Mount Lebanon',     'a1000000-0000-0000-0000-000000000001'),
('d4000000-0000-0000-0000-000000000004', 'Joseph',   'Abi Nader', '1975-07-08', 'Male',   '+961-71-200004', 'joseph.an@email.com',     'AB+', 'Aspirin allergy; hypertension',     'Zalka, Mount Lebanon',       'a1000000-0000-0000-0000-000000000001'),
('d4000000-0000-0000-0000-000000000005', 'Lina',     'Haddad',    '1968-11-20', 'Female', '+961-71-200005', 'lina.h@email.com',        'A-',  'Diabetes Type 2',                   'Tripoli, North Lebanon',     'a1000000-0000-0000-0000-000000000002'),
('d4000000-0000-0000-0000-000000000006', 'Rami',     'Khalil',    '1993-03-05', 'Male',   '+961-71-200006', NULL,                      'O+',  NULL,                                'Sin El Fil, Mount Lebanon',  'a1000000-0000-0000-0000-000000000002'),
('d4000000-0000-0000-0000-000000000007', 'Maya',     'Tannous',   '2015-08-12', 'Female', '+961-71-200007', 'maya.parents@email.com',  'A+',  'Asthma; uses inhaler',              'Byblos, Mount Lebanon',      'a1000000-0000-0000-0000-000000000001'),
('d4000000-0000-0000-0000-000000000008', 'Omar',     'Nassar',    '1982-12-01', 'Male',   '+961-71-200008', 'omar.nassar@email.com',   'B-',  'Smoker; family history of CAD',     'Saida, South Lebanon',       'a1000000-0000-0000-0000-000000000002'),
('d4000000-0000-0000-0000-000000000009', 'Yara',     'Daher',     '1996-06-18', 'Female', '+961-71-200009', 'yara.daher@email.com',    'AB-', 'Migraine, on prophylaxis',          'Verdun, Beirut',             'a1000000-0000-0000-0000-000000000001'),
('d4000000-0000-0000-0000-00000000000a', 'Tarek',    'Saliba',    '2018-02-25', 'Male',   '+961-71-200010', 'tarek.parents@email.com', 'O+',  'No known allergies',                'Dora, Mount Lebanon',        'a1000000-0000-0000-0000-000000000001');

-- =============================================================
-- APPOINTMENTS
-- Today (per server clock) is treated as the reference point.
-- Doctor specialties intentionally match each patient's reason.
-- =============================================================

-- ── Today ──────────────────────────────────────────────────────
INSERT INTO appointments (appointment_id, patient_id, doctor_id, room_id, scheduled_start, scheduled_end, status, reason, created_by) VALUES
('e5000000-0000-0000-0000-000000000001', 'd4000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-000000000001',
 CURRENT_DATE + TIME '09:00', CURRENT_DATE + TIME '09:30', 'scheduled', 'Routine check-up',                'a1000000-0000-0000-0000-000000000001'),
('e5000000-0000-0000-0000-000000000002', 'd4000000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-000000000002',
 CURRENT_DATE + TIME '10:00', CURRENT_DATE + TIME '10:30', 'scheduled', 'Hypertension follow-up',          'a1000000-0000-0000-0000-000000000001'),
('e5000000-0000-0000-0000-000000000003', 'd4000000-0000-0000-0000-000000000007', 'b2000000-0000-0000-0000-000000000004', 'c3000000-0000-0000-0000-000000000003',
 CURRENT_DATE + TIME '11:00', CURRENT_DATE + TIME '11:30', 'scheduled', 'Pediatric asthma review',         'a1000000-0000-0000-0000-000000000002'),
('e5000000-0000-0000-0000-000000000004', 'd4000000-0000-0000-0000-00000000000a', 'b2000000-0000-0000-0000-000000000004', 'c3000000-0000-0000-0000-000000000003',
 CURRENT_DATE + TIME '13:30', CURRENT_DATE + TIME '14:00', 'scheduled', 'Vaccination — DTP booster',        'a1000000-0000-0000-0000-000000000001'),
('e5000000-0000-0000-0000-000000000005', 'd4000000-0000-0000-0000-000000000006', 'b2000000-0000-0000-0000-000000000001', NULL,
 CURRENT_DATE + TIME '14:30', CURRENT_DATE + TIME '15:00', 'scheduled', 'New-patient intake',              'a1000000-0000-0000-0000-000000000002');

-- ── Yesterday (completed) ──────────────────────────────────────
INSERT INTO appointments (appointment_id, patient_id, doctor_id, room_id, scheduled_start, scheduled_end, status, reason, created_by) VALUES
('e5000000-0000-0000-0000-000000000010', 'd4000000-0000-0000-0000-000000000005', 'b2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000005',
 CURRENT_DATE - INTERVAL '1 day' + TIME '10:00', CURRENT_DATE - INTERVAL '1 day' + TIME '10:30',
 'completed', 'Diabetes management review',                     'a1000000-0000-0000-0000-000000000001'),
('e5000000-0000-0000-0000-000000000011', 'd4000000-0000-0000-0000-000000000008', 'b2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000005',
 CURRENT_DATE - INTERVAL '1 day' + TIME '11:00', CURRENT_DATE - INTERVAL '1 day' + TIME '11:45',
 'completed', 'Cardiac evaluation — chest pain',                 'a1000000-0000-0000-0000-000000000001'),
('e5000000-0000-0000-0000-000000000012', 'd4000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-000000000008',
 CURRENT_DATE - INTERVAL '1 day' + TIME '13:00', CURRENT_DATE - INTERVAL '1 day' + TIME '13:30',
 'completed', 'Pre-surgical consultation',                      'a1000000-0000-0000-0000-000000000002');

-- ── Earlier last week (mixed outcomes) ─────────────────────────
INSERT INTO appointments (appointment_id, patient_id, doctor_id, room_id, scheduled_start, scheduled_end, status, reason, created_by) VALUES
('e5000000-0000-0000-0000-000000000020', 'd4000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-000000000001',
 CURRENT_DATE - INTERVAL '4 days' + TIME '09:00', CURRENT_DATE - INTERVAL '4 days' + TIME '09:30',
 'completed', 'Annual physical',                                'a1000000-0000-0000-0000-000000000001'),
('e5000000-0000-0000-0000-000000000021', 'd4000000-0000-0000-0000-000000000009', 'b2000000-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-000000000002',
 CURRENT_DATE - INTERVAL '5 days' + TIME '11:00', CURRENT_DATE - INTERVAL '5 days' + TIME '11:30',
 'cancelled', 'Migraine consult — patient cancelled same-day',   'a1000000-0000-0000-0000-000000000001'),
('e5000000-0000-0000-0000-000000000022', 'd4000000-0000-0000-0000-000000000006', 'b2000000-0000-0000-0000-000000000003', NULL,
 CURRENT_DATE - INTERVAL '6 days' + TIME '08:00', CURRENT_DATE - INTERVAL '6 days' + TIME '08:30',
 'no_show', 'Surgical follow-up',                               'a1000000-0000-0000-0000-000000000002');

-- ── Tomorrow & next week (scheduled) ───────────────────────────
INSERT INTO appointments (appointment_id, patient_id, doctor_id, room_id, scheduled_start, scheduled_end, status, reason, created_by) VALUES
-- Mon (+3 days): Hassan, Khoury, Maalouf available
('e5000000-0000-0000-0000-000000000030', 'd4000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000005',
 CURRENT_DATE + INTERVAL '4 days' + TIME '09:30', CURRENT_DATE + INTERVAL '4 days' + TIME '10:00',
 'scheduled', 'Cardiology follow-up',                           'a1000000-0000-0000-0000-000000000001'),
-- Mon
('e5000000-0000-0000-0000-000000000031', 'd4000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-000000000009',
 CURRENT_DATE + INTERVAL '3 days' + TIME '08:00', CURRENT_DATE + INTERVAL '3 days' + TIME '10:00',
 'scheduled', 'Surgery — appendectomy',                         'a1000000-0000-0000-0000-000000000001'),
-- Wed
('e5000000-0000-0000-0000-000000000032', 'd4000000-0000-0000-0000-000000000007', 'b2000000-0000-0000-0000-000000000004', 'c3000000-0000-0000-0000-000000000003',
 CURRENT_DATE + INTERVAL '5 days' + TIME '11:00', CURRENT_DATE + INTERVAL '5 days' + TIME '11:30',
 'scheduled', 'Pediatric follow-up',                            'a1000000-0000-0000-0000-000000000002'),
-- Fri (+7)
('e5000000-0000-0000-0000-000000000033', 'd4000000-0000-0000-0000-000000000008', 'b2000000-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-000000000001',
 CURRENT_DATE + INTERVAL '7 days' + TIME '14:00', CURRENT_DATE + INTERVAL '7 days' + TIME '14:30',
 'scheduled', 'Smoking cessation counselling',                  'a1000000-0000-0000-0000-000000000002');

-- ── Prescriptions (attached to completed appointments) ─────────
INSERT INTO prescriptions (appointment_id, medication, dosage, frequency, duration, instructions) VALUES
('e5000000-0000-0000-0000-000000000010', 'Metformin',     '500 mg', 'twice daily',     '30 days', 'Take with meals'),
('e5000000-0000-0000-0000-000000000010', 'Atorvastatin',  '20 mg',  'once daily',      '30 days', 'Take in the evening'),
('e5000000-0000-0000-0000-000000000011', 'Aspirin',       '81 mg',  'once daily',      '90 days', 'Low-dose; cardioprotective'),
('e5000000-0000-0000-0000-000000000011', 'Bisoprolol',    '5 mg',   'once daily',      '30 days', 'Monitor heart rate'),
('e5000000-0000-0000-0000-000000000020', 'Vitamin D3',    '1000 IU','once daily',      '60 days', 'With breakfast'),
('e5000000-0000-0000-0000-000000000012', 'Paracetamol',   '500 mg', 'every 6 hours',   '5 days',  'PRN for pain, max 4 g/day');

-- ── Appointment status history ─────────────────────────────────
-- Every appointment gets a 'created' row; completed/cancelled/no_show get a transition row too.
INSERT INTO appointment_status_history (appointment_id, old_status, new_status, changed_by, changed_at)
SELECT appointment_id, NULL, 'scheduled', created_by, created_at
FROM appointments;

-- Yesterday's completed appointments
INSERT INTO appointment_status_history (appointment_id, old_status, new_status, changed_by, changed_at) VALUES
('e5000000-0000-0000-0000-000000000010', 'scheduled', 'completed', 'a1000000-0000-0000-0000-000000000003', CURRENT_DATE - INTERVAL '1 day' + TIME '10:35'),
('e5000000-0000-0000-0000-000000000011', 'scheduled', 'completed', 'a1000000-0000-0000-0000-000000000004', CURRENT_DATE - INTERVAL '1 day' + TIME '11:50'),
('e5000000-0000-0000-0000-000000000012', 'scheduled', 'completed', 'a1000000-0000-0000-0000-000000000005', CURRENT_DATE - INTERVAL '1 day' + TIME '13:35'),
('e5000000-0000-0000-0000-000000000020', 'scheduled', 'completed', 'a1000000-0000-0000-0000-000000000003', CURRENT_DATE - INTERVAL '4 days' + TIME '09:35'),
('e5000000-0000-0000-0000-000000000021', 'scheduled', 'cancelled', 'a1000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '5 days' + TIME '08:30'),
('e5000000-0000-0000-0000-000000000022', 'scheduled', 'no_show',   'a1000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '6 days' + TIME '08:45');

COMMIT;

-- ── Quick verification ───────────────────────────────────────
SELECT 'users'                AS table_name, COUNT(*) AS rows FROM users
UNION ALL SELECT 'doctors',                  COUNT(*) FROM doctors
UNION ALL SELECT 'doctor_availability',      COUNT(*) FROM doctor_availability
UNION ALL SELECT 'rooms',                    COUNT(*) FROM rooms
UNION ALL SELECT 'patients',                 COUNT(*) FROM patients
UNION ALL SELECT 'appointments',             COUNT(*) FROM appointments
UNION ALL SELECT 'prescriptions',            COUNT(*) FROM prescriptions
UNION ALL SELECT 'appointment_status_history', COUNT(*) FROM appointment_status_history;
