-- ============================================================
-- DANISHGAH INSTITUTE MANAGEMENT SYSTEM
-- Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor (https://supabase.com)
-- ============================================================

-- ---- USERS (synced with Supabase Auth & Database) ----
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin','teacher','accountant','viewer')),
  password    TEXT,
  phone       TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ---- STUDENTS ----
CREATE TABLE IF NOT EXISTS students (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_number     TEXT NOT NULL,
  name            TEXT NOT NULL,
  father_name     TEXT,
  class           TEXT NOT NULL,
  school_name     TEXT,
  father_phone    TEXT,
  date_of_birth   DATE,
  address         TEXT,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status          TEXT DEFAULT 'Active' CHECK (status IN ('Active','Left','On Leave','Inactive')),
  photo_url       TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ---- TEACHERS ----
CREATE TABLE IF NOT EXISTS teachers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  cnic            TEXT,
  subject         TEXT,
  qualification   TEXT,
  phone           TEXT,
  email           TEXT,
  address         TEXT,
  join_date       DATE DEFAULT CURRENT_DATE,
  salary          NUMERIC(10,2),
  status          TEXT DEFAULT 'Active' CHECK (status IN ('Active','Inactive')),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ---- CLASSES ----
CREATE TABLE IF NOT EXISTS classes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,  -- e.g. "Class 1", "Class 5"
  section     TEXT DEFAULT 'A',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ---- FEE STRUCTURE ----
CREATE TABLE IF NOT EXISTS fee_structure (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name  TEXT NOT NULL UNIQUE,
  amount      NUMERIC(10,2) NOT NULL,
  due_date    INT DEFAULT 10,  -- day of month fee is due
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ---- FEE PAYMENTS ----
CREATE TABLE IF NOT EXISTS fee_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID REFERENCES students(id) ON DELETE CASCADE,
  student_name    TEXT,
  class           TEXT,
  month           TEXT NOT NULL,   -- e.g. "2025-08" or "August 2025"
  amount          NUMERIC(10,2) NOT NULL,
  payment_method  TEXT DEFAULT 'Cash',
  card_issued     TEXT DEFAULT 'No',
  receipt_number  TEXT,
  paid_date       DATE DEFAULT CURRENT_DATE,
  remarks         TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ---- ATTENDANCE ----
CREATE TABLE IF NOT EXISTS attendance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID REFERENCES students(id) ON DELETE CASCADE,
  student_name TEXT,
  date        DATE NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('Present','Absent','Leave')),
  class       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ---- EXPENSES ----
CREATE TABLE IF NOT EXISTS expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  category        TEXT NOT NULL,
  description     TEXT NOT NULL,
  amount          NUMERIC(10,2) NOT NULL,
  paid_by         TEXT,
  payment_method  TEXT DEFAULT 'Cash',
  receipt_number  TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ---- EVENTS ----
CREATE TABLE IF NOT EXISTS events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  date        DATE NOT NULL,
  description TEXT,
  budget      NUMERIC(10,2) DEFAULT 0,
  status      TEXT DEFAULT 'Planned',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- DISABLE STRICT RLS / ALLOW ALL ACCESS FOR APP
-- ============================================================
ALTER TABLE students         DISABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments     DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance       DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses         DISABLE ROW LEVEL SECURITY;
ALTER TABLE users            DISABLE ROW LEVEL SECURITY;
ALTER TABLE events           DISABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structure    DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- SAMPLE DATA
-- ============================================================
INSERT INTO fee_structure (class_name, amount) VALUES
  ('Muntazir (3-4)', 2500),
  ('Muntaqim (5)', 3000),
  ('Zaman (6)', 3000),
  ('Qaim (7-8)', 3500),
  ('Hujjat (9-10)', 4000),
  ('Senior Class', 4500)
ON CONFLICT DO NOTHING;
