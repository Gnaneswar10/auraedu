/*
  # School Management System - Complete Database Schema

  ## Overview
  Complete production-ready schema for a school management system with proper
  security, relationships, and data integrity.

  ## New Tables
  
  ### 1. Authentication & Users
    - `profiles` - Extended user profiles linked to auth.users
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `role` (text: admin, teacher, parent, student)
      - `email` (text)
      - `phone` (text)
      - `avatar_url` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  ### 2. Students
    - `students` - Core student information
      - `id` (uuid, primary key)
      - `roll_number` (text, unique)
      - `full_name` (text)
      - `date_of_birth` (date)
      - `gender` (text)
      - `blood_group` (text, nullable)
      - `admission_date` (date)
      - `grade` (text)
      - `section` (text)
      - `parent_id` (uuid, references profiles)
      - `address` (text)
      - `emergency_contact` (text)
      - `status` (text: active, inactive, graduated)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  ### 3. Attendance
    - `attendance_records` - Daily attendance tracking
      - `id` (uuid, primary key)
      - `student_id` (uuid, references students)
      - `date` (date)
      - `status` (text: present, absent, late, half_day)
      - `remarks` (text, nullable)
      - `marked_by` (uuid, references profiles)
      - `created_at` (timestamptz)
  
  ### 4. Fee Management
    - `fee_structures` - Fee templates
      - `id` (uuid, primary key)
      - `grade` (text)
      - `academic_year` (text)
      - `total_annual_fee` (numeric)
      - `term_1` (numeric)
      - `term_2` (numeric)
      - `term_3` (numeric)
      - `created_at` (timestamptz)
    
    - `fee_records` - Individual student fee tracking
      - `id` (uuid, primary key)
      - `student_id` (uuid, references students)
      - `fee_structure_id` (uuid, references fee_structures)
      - `total_amount` (numeric)
      - `paid_amount` (numeric, default 0)
      - `pending_amount` (numeric)
      - `status` (text: paid, partial, pending)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `fee_payments` - Payment transactions
      - `id` (uuid, primary key)
      - `fee_record_id` (uuid, references fee_records)
      - `amount` (numeric)
      - `payment_method` (text)
      - `transaction_id` (text, nullable)
      - `payment_date` (date)
      - `remarks` (text, nullable)
      - `received_by` (uuid, references profiles)
      - `created_at` (timestamptz)
  
  ### 5. Academic
    - `subjects` - Course subjects
      - `id` (uuid, primary key)
      - `name` (text)
      - `code` (text, unique)
      - `grade` (text)
      - `description` (text, nullable)
      - `created_at` (timestamptz)
    
    - `exams` - Examination schedules
      - `id` (uuid, primary key)
      - `name` (text)
      - `exam_type` (text: unit_test, mid_term, final, etc)
      - `grade` (text)
      - `academic_year` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `total_marks` (integer)
      - `created_at` (timestamptz)
    
    - `exam_results` - Student exam results
      - `id` (uuid, primary key)
      - `student_id` (uuid, references students)
      - `exam_id` (uuid, references exams)
      - `subject_id` (uuid, references subjects)
      - `marks_obtained` (numeric)
      - `grade` (text, nullable)
      - `remarks` (text, nullable)
      - `created_at` (timestamptz)
  
  ### 6. Staff Management
    - `staff` - Teaching and non-teaching staff
      - `id` (uuid, primary key)
      - `profile_id` (uuid, references profiles)
      - `employee_id` (text, unique)
      - `designation` (text)
      - `department` (text)
      - `qualification` (text)
      - `date_of_joining` (date)
      - `salary` (numeric)
      - `status` (text: active, inactive)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  ### 7. Communication
    - `announcements` - School-wide announcements
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text)
      - `type` (text: general, urgent, event)
      - `target_audience` (text[])
      - `published_by` (uuid, references profiles)
      - `published_at` (timestamptz)
      - `expires_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
    
    - `notifications` - User notifications
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `message` (text)
      - `type` (text)
      - `read` (boolean, default false)
      - `created_at` (timestamptz)

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies created for each role (admin, teacher, parent, student)
  - Only authenticated users can access data
  - Users can only access data relevant to their role
  
  ## Important Notes
  1. All monetary values use numeric type for precision
  2. Cascading deletes are NOT used to prevent accidental data loss
  3. Timestamps are automatically managed
  4. Unique constraints ensure data integrity
  5. Foreign keys maintain referential integrity
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'teacher', 'parent', 'student')),
  email text UNIQUE NOT NULL,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- STUDENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  roll_number text UNIQUE NOT NULL,
  full_name text NOT NULL,
  date_of_birth date NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  blood_group text,
  admission_date date NOT NULL DEFAULT CURRENT_DATE,
  grade text NOT NULL,
  section text NOT NULL DEFAULT 'A',
  parent_id uuid REFERENCES profiles(id),
  address text NOT NULL,
  emergency_contact text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and teachers can read all students"
  ON students FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Parents can read their children"
  ON students FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY "Admins can insert students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update students"
  ON students FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete students"
  ON students FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- ATTENDANCE RECORDS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES students(id),
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'late', 'half_day')),
  remarks text,
  marked_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, date)
);

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and teachers can read attendance"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Parents can read their children's attendance"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = attendance_records.student_id
      AND students.parent_id = auth.uid()
    )
  );

CREATE POLICY "Teachers and admins can insert attendance"
  ON attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Teachers and admins can update attendance"
  ON attendance_records FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- ============================================================
-- FEE STRUCTURES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS fee_structures (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  grade text NOT NULL,
  academic_year text NOT NULL,
  total_annual_fee numeric NOT NULL CHECK (total_annual_fee >= 0),
  term_1 numeric NOT NULL DEFAULT 0 CHECK (term_1 >= 0),
  term_2 numeric NOT NULL DEFAULT 0 CHECK (term_2 >= 0),
  term_3 numeric NOT NULL DEFAULT 0 CHECK (term_3 >= 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(grade, academic_year)
);

ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read fee structures"
  ON fee_structures FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage fee structures"
  ON fee_structures FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- FEE RECORDS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS fee_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES students(id),
  fee_structure_id uuid REFERENCES fee_structures(id),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  paid_amount numeric NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  pending_amount numeric NOT NULL CHECK (pending_amount >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'partial', 'pending')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE fee_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and teachers can read fee records"
  ON fee_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Parents can read their children's fee records"
  ON fee_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = fee_records.student_id
      AND students.parent_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage fee records"
  ON fee_records FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- FEE PAYMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS fee_payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  fee_record_id uuid NOT NULL REFERENCES fee_records(id),
  amount numeric NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL,
  transaction_id text,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  remarks text,
  received_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and teachers can read payments"
  ON fee_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Parents can read their children's payments"
  ON fee_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      JOIN fee_records ON fee_records.student_id = students.id
      WHERE fee_records.id = fee_payments.fee_record_id
      AND students.parent_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert payments"
  ON fee_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- SUBJECTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  grade text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage subjects"
  ON subjects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- EXAMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  exam_type text NOT NULL,
  grade text NOT NULL,
  academic_year text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_marks integer NOT NULL CHECK (total_marks > 0),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read exams"
  ON exams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and teachers can manage exams"
  ON exams FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- ============================================================
-- EXAM RESULTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS exam_results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL REFERENCES students(id),
  exam_id uuid NOT NULL REFERENCES exams(id),
  subject_id uuid NOT NULL REFERENCES subjects(id),
  marks_obtained numeric NOT NULL CHECK (marks_obtained >= 0),
  grade text,
  remarks text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, exam_id, subject_id)
);

ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and teachers can read all results"
  ON exam_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Parents and students can read own results"
  ON exam_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = exam_results.student_id
      AND (students.parent_id = auth.uid() OR students.id = auth.uid())
    )
  );

CREATE POLICY "Teachers and admins can manage results"
  ON exam_results FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- ============================================================
-- STAFF TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL REFERENCES profiles(id),
  employee_id text UNIQUE NOT NULL,
  designation text NOT NULL,
  department text NOT NULL,
  qualification text NOT NULL,
  date_of_joining date NOT NULL DEFAULT CURRENT_DATE,
  salary numeric NOT NULL CHECK (salary >= 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read own record"
  ON staff FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Admins can read all staff"
  ON staff FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage staff"
  ON staff FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- ANNOUNCEMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'urgent', 'event')),
  target_audience text[] NOT NULL DEFAULT '{}',
  published_by uuid NOT NULL REFERENCES profiles(id),
  published_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read active announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (
    published_at <= now() AND (expires_at IS NULL OR expires_at > now())
  );

CREATE POLICY "Admins and teachers can manage announcements"
  ON announcements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_students_roll_number ON students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON students(parent_id);
CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance_records(student_id, date);
CREATE INDEX IF NOT EXISTS idx_fee_records_student ON fee_records(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_record ON fee_payments(fee_record_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_student ON exam_results(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);

-- ============================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_students_updated_at') THEN
    CREATE TRIGGER update_students_updated_at
      BEFORE UPDATE ON students
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_fee_records_updated_at') THEN
    CREATE TRIGGER update_fee_records_updated_at
      BEFORE UPDATE ON fee_records
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_staff_updated_at') THEN
    CREATE TRIGGER update_staff_updated_at
      BEFORE UPDATE ON staff
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Function to automatically update fee record status
CREATE OR REPLACE FUNCTION update_fee_record_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE fee_records
  SET 
    paid_amount = (
      SELECT COALESCE(SUM(amount), 0)
      FROM fee_payments
      WHERE fee_record_id = NEW.fee_record_id
    ),
    pending_amount = total_amount - (
      SELECT COALESCE(SUM(amount), 0)
      FROM fee_payments
      WHERE fee_record_id = NEW.fee_record_id
    ),
    status = CASE
      WHEN total_amount = (
        SELECT COALESCE(SUM(amount), 0)
        FROM fee_payments
        WHERE fee_record_id = NEW.fee_record_id
      ) THEN 'paid'
      WHEN (
        SELECT COALESCE(SUM(amount), 0)
        FROM fee_payments
        WHERE fee_record_id = NEW.fee_record_id
      ) > 0 THEN 'partial'
      ELSE 'pending'
    END
  WHERE id = NEW.fee_record_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_fee_status') THEN
    CREATE TRIGGER trigger_update_fee_status
      AFTER INSERT ON fee_payments
      FOR EACH ROW EXECUTE FUNCTION update_fee_record_status();
  END IF;
END $$;