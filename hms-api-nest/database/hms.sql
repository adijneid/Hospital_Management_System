-- =============================================================
-- HMS Database Schema + Seed Data
-- Hospital Management System – CSIS279, University of Balamand
-- Run:  psql -U postgres -d hms_db -f hms.sql
-- =============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── ENUM types ───────────────────────────────────────────────
CREATE TYPE user_role          AS ENUM ('staff', 'doctor');
CREATE TYPE room_type          AS ENUM ('consultation', 'treatment', 'surgery');
CREATE TYPE room_status        AS ENUM ('available', 'occupied', 'maintenance');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE gender_type        AS ENUM ('Male', 'Female', 'Other');

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE users (
    user_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email          VARCHAR(255) NOT NULL UNIQUE,
    username       VARCHAR(100) NOT NULL UNIQUE,
    password_hash  TEXT         NOT NULL,
    role           user_role    NOT NULL DEFAULT 'staff',
    full_name      VARCHAR(255) NOT NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Doctors ──────────────────────────────────────────────────
CREATE TABLE doctors (
    doctor_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID         UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    first_name  VARCHAR(100) NOT NULL,
    last_name   VARCHAR(100) NOT NULL,
    specialty   VARCHAR(150) NOT NULL,
    phone       VARCHAR(30),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Doctor Availability ──────────────────────────────────────
CREATE TABLE doctor_availability (
    availability_id SERIAL PRIMARY KEY,
    doctor_id       UUID    NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    day_of_week     INT     NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sun … 6=Sat
    start_time      TIME    NOT NULL,
    end_time        TIME    NOT NULL,
    UNIQUE (doctor_id, day_of_week, start_time)
);

-- ── Rooms ────────────────────────────────────────────────────
CREATE TABLE rooms (
    room_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_number  VARCHAR(20)  NOT NULL UNIQUE,
    room_type    room_type    NOT NULL,
    floor        INT          NOT NULL,
    capacity     INT          NOT NULL DEFAULT 1,
    status       room_status  NOT NULL DEFAULT 'available',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Patients ─────────────────────────────────────────────────
CREATE TABLE patients (
    patient_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name     VARCHAR(100) NOT NULL,
    last_name      VARCHAR(100) NOT NULL,
    date_of_birth  DATE         NOT NULL,
    gender         gender_type  NOT NULL,
    phone          VARCHAR(30)  NOT NULL,
    email          VARCHAR(255),
    blood_type     VARCHAR(5),
    medical_notes  TEXT,
    created_by     UUID         NOT NULL REFERENCES users(user_id),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Appointments ─────────────────────────────────────────────
CREATE TABLE appointments (
    appointment_id  UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID               NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    doctor_id       UUID               NOT NULL REFERENCES doctors(doctor_id)   ON DELETE CASCADE,
    room_id         UUID               REFERENCES rooms(room_id),
    scheduled_start TIMESTAMPTZ        NOT NULL,
    scheduled_end   TIMESTAMPTZ        NOT NULL,
    status          appointment_status NOT NULL DEFAULT 'scheduled',
    reason          TEXT,
    created_by      UUID               NOT NULL REFERENCES users(user_id),
    created_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

-- ── Views ───────────────────────────────────────────────────
CREATE OR REPLACE VIEW vw_todays_appointments AS
SELECT a.*,
       p.first_name || ' ' || p.last_name AS patient_name,
       d.first_name || ' ' || d.last_name AS doctor_name,
       d.specialty  AS doctor_specialty,
       r.room_number
FROM appointments a
JOIN patients p ON p.patient_id = a.patient_id
JOIN doctors  d ON d.doctor_id  = a.doctor_id
LEFT JOIN rooms r ON r.room_id  = a.room_id
WHERE a.scheduled_start::date = CURRENT_DATE;

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX idx_appointments_doctor   ON appointments(doctor_id);
CREATE INDEX idx_appointments_patient  ON appointments(patient_id);
CREATE INDEX idx_appointments_date     ON appointments(scheduled_start);
CREATE INDEX idx_patients_name         ON patients(last_name, first_name);


-- =============================================================
-- SEED DATA
-- All demo passwords: password123
-- =============================================================

-- ── Users (bcrypt hash of 'password123') ─────────────────────
INSERT INTO users (user_id, email, username, password_hash, role, full_name) VALUES
('a1000000-0000-0000-0000-000000000001', 'sarah.jenkins@hms.lb',  'sarah.jenkins',  '$2b$10$ce2.Iao7lSn/aZd5p7qwZuyEBYGhJS6T8lWYGd4hq3vlkh3T7xEZ2', 'staff',  'Sarah Jenkins'),
('a1000000-0000-0000-0000-000000000002', 'michael.reed@hms.lb',   'michael.reed',   '$2b$10$ce2.Iao7lSn/aZd5p7qwZuyEBYGhJS6T8lWYGd4hq3vlkh3T7xEZ2', 'staff',  'Michael Reed'),
('a1000000-0000-0000-0000-000000000003', 'dr.hassan@hms.lb',      'dr.hassan',      '$2b$10$ce2.Iao7lSn/aZd5p7qwZuyEBYGhJS6T8lWYGd4hq3vlkh3T7xEZ2', 'doctor', 'Dr. Ahmad Hassan'),
('a1000000-0000-0000-0000-000000000004', 'dr.saab@hms.lb',        'dr.saab',        '$2b$10$ce2.Iao7lSn/aZd5p7qwZuyEBYGhJS6T8lWYGd4hq3vlkh3T7xEZ2', 'doctor', 'Dr. Lara Saab'),
('a1000000-0000-0000-0000-000000000005', 'dr.khoury@hms.lb',      'dr.khoury',      '$2b$10$ce2.Iao7lSn/aZd5p7qwZuyEBYGhJS6T8lWYGd4hq3vlkh3T7xEZ2', 'doctor', 'Dr. Georges Khoury');

-- ── Doctors ──────────────────────────────────────────────────
INSERT INTO doctors (doctor_id, user_id, first_name, last_name, specialty, phone) VALUES
('b2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 'Ahmad',   'Hassan', 'General Medicine', '+961-70-111001'),
('b2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000004', 'Lara',    'Saab',   'Cardiology',       '+961-70-111002'),
('b2000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000005', 'Georges', 'Khoury', 'Surgery',          '+961-70-111003');

-- ── Doctor Availability ──────────────────────────────────────
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time) VALUES
('b2000000-0000-0000-0000-000000000001', 1, '08:00', '16:00'),
('b2000000-0000-0000-0000-000000000001', 3, '08:00', '16:00'),
('b2000000-0000-0000-0000-000000000001', 5, '08:00', '16:00'),
('b2000000-0000-0000-0000-000000000002', 2, '09:00', '17:00'),
('b2000000-0000-0000-0000-000000000002', 4, '09:00', '17:00'),
('b2000000-0000-0000-0000-000000000003', 1, '07:00', '15:00'),
('b2000000-0000-0000-0000-000000000003', 2, '07:00', '15:00'),
('b2000000-0000-0000-0000-000000000003', 3, '07:00', '15:00'),
('b2000000-0000-0000-0000-000000000003', 4, '07:00', '15:00');

-- ── Rooms ────────────────────────────────────────────────────
INSERT INTO rooms (room_id, room_number, room_type, floor, capacity, status) VALUES
('c3000000-0000-0000-0000-000000000001', '101', 'consultation', 1, 1, 'available'),
('c3000000-0000-0000-0000-000000000002', '102', 'consultation', 1, 1, 'available'),
('c3000000-0000-0000-0000-000000000003', '103', 'consultation', 1, 1, 'available'),
('c3000000-0000-0000-0000-000000000004', '201', 'treatment',    2, 2, 'available'),
('c3000000-0000-0000-0000-000000000005', '202', 'treatment',    2, 2, 'available'),
('c3000000-0000-0000-0000-000000000006', '203', 'treatment',    2, 2, 'maintenance'),
('c3000000-0000-0000-0000-000000000007', '301', 'surgery',      3, 1, 'available'),
('c3000000-0000-0000-0000-000000000008', '302', 'surgery',      3, 1, 'available');

-- ── Patients ─────────────────────────────────────────────────
INSERT INTO patients (patient_id, first_name, last_name, date_of_birth, gender, phone, email, blood_type, medical_notes, created_by) VALUES
('d4000000-0000-0000-0000-000000000001', 'Sara',   'Mansour',   '1990-04-15', 'Female', '+961-71-200001', 'sara.mansour@email.com', 'A+',  'Penicillin Allergy',  'a1000000-0000-0000-0000-000000000001'),
('d4000000-0000-0000-0000-000000000002', 'Karim',  'Bitar',     '1985-09-22', 'Male',   '+961-71-200002', 'karim.bitar@email.com',  'O-',  NULL,                  'a1000000-0000-0000-0000-000000000001'),
('d4000000-0000-0000-0000-000000000003', 'Nadia',  'Frem',      '2001-01-30', 'Female', '+961-71-200003', NULL,                     'B+',  'Lactose Intolerant',  'a1000000-0000-0000-0000-000000000001'),
('d4000000-0000-0000-0000-000000000004', 'Joseph', 'Abi Nader', '1975-07-08', 'Male',   '+961-71-200004', 'joseph.an@email.com',    'AB+', 'Aspirin Allergy',     'a1000000-0000-0000-0000-000000000001'),
('d4000000-0000-0000-0000-000000000005', 'Lina',   'Haddad',    '1968-11-20', 'Female', '+961-71-200005', 'lina.h@email.com',       'A-',  'Diabetes Type 2',     'a1000000-0000-0000-0000-000000000002'),
('d4000000-0000-0000-0000-000000000006', 'Rami',   'Khalil',    '1993-03-05', 'Male',   '+961-71-200006', NULL,                     'O+',  NULL,                  'a1000000-0000-0000-0000-000000000002');

-- ── Appointments (today) ─────────────────────────────────────
INSERT INTO appointments (patient_id, doctor_id, room_id, scheduled_start, scheduled_end, status, reason, created_by) VALUES
('d4000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-000000000001',
 CURRENT_DATE + TIME '09:00', CURRENT_DATE + TIME '09:30', 'scheduled', 'Routine check-up',         'a1000000-0000-0000-0000-000000000001'),
('d4000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000004',
 CURRENT_DATE + TIME '09:00', CURRENT_DATE + TIME '09:45', 'scheduled', 'Cardiac evaluation',       'a1000000-0000-0000-0000-000000000001'),
('d4000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-000000000007',
 CURRENT_DATE + TIME '10:00', CURRENT_DATE + TIME '10:30', 'scheduled', 'Pre-surgical consultation', 'a1000000-0000-0000-0000-000000000001'),
('d4000000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000001', NULL,
 CURRENT_DATE + TIME '11:00', CURRENT_DATE + TIME '11:30', 'scheduled', 'Follow-up visit',          'a1000000-0000-0000-0000-000000000001');

-- ── Appointments (yesterday – completed) ─────────────────────
INSERT INTO appointments (patient_id, doctor_id, room_id, scheduled_start, scheduled_end, status, reason, created_by) VALUES
('d4000000-0000-0000-0000-000000000005', 'b2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000005',
 CURRENT_DATE - INTERVAL '1 day' + TIME '14:00', CURRENT_DATE - INTERVAL '1 day' + TIME '14:30',
 'completed', 'Diabetes management review', 'a1000000-0000-0000-0000-000000000001'),
('d4000000-0000-0000-0000-000000000006', 'b2000000-0000-0000-0000-000000000001', NULL,
 CURRENT_DATE - INTERVAL '1 day' + TIME '10:00', CURRENT_DATE - INTERVAL '1 day' + TIME '10:30',
 'completed', 'General check-up', 'a1000000-0000-0000-0000-000000000002');

-- ── Appointments (future) ────────────────────────────────────
INSERT INTO appointments (patient_id, doctor_id, room_id, scheduled_start, scheduled_end, status, reason, created_by) VALUES
('d4000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000002',
 CURRENT_DATE + INTERVAL '1 day' + TIME '09:00', CURRENT_DATE + INTERVAL '1 day' + TIME '09:30',
 'scheduled', 'Cardiology follow-up', 'a1000000-0000-0000-0000-000000000001'),
('d4000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-000000000008',
 CURRENT_DATE + INTERVAL '2 days' + TIME '08:00', CURRENT_DATE + INTERVAL '2 days' + TIME '10:00',
 'scheduled', 'Surgery pre-op', 'a1000000-0000-0000-0000-000000000001');
