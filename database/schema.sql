-- ============================================================
-- School Inventory & Borrowing System — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- 1. CATEGORIES
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'box',
  custom_fields JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ITEMS
CREATE TABLE items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),
  available_quantity INTEGER DEFAULT 1 CHECK (available_quantity >= 0),
  condition VARCHAR(50) DEFAULT 'Good',
  location VARCHAR(255),
  images JSONB DEFAULT '[]'::jsonb,
  custom_data JSONB DEFAULT '{}'::jsonb,
  is_available BOOLEAN DEFAULT true,
  allow_booking BOOLEAN DEFAULT true,
  allow_borrowing BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ADMINS
CREATE TABLE admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BORROW REQUESTS
CREATE TABLE borrow_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  student_id VARCHAR(50) NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  student_email VARCHAR(255),
  student_department VARCHAR(255),
  purpose TEXT,
  quantity INTEGER DEFAULT 1 CHECK (quantity >= 1),
  borrow_date DATE NOT NULL,
  expected_return_date DATE NOT NULL,
  actual_return_date DATE,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','borrowed','returned','overdue')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BOOKINGS
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  student_id VARCHAR(50) NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  student_email VARCHAR(255),
  student_department VARCHAR(255),
  purpose TEXT,
  quantity INTEGER DEFAULT 1 CHECK (quantity >= 1),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','cancelled','completed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_items_available ON items(is_available);
CREATE INDEX idx_borrow_requests_status ON borrow_requests(status);
CREATE INDEX idx_borrow_requests_student ON borrow_requests(student_id);
CREATE INDEX idx_borrow_requests_item ON borrow_requests(item_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_student ON bookings(student_id);
CREATE INDEX idx_bookings_item ON bookings(item_id);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_categories_updated
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_items_updated
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_borrow_requests_updated
  BEFORE UPDATE ON borrow_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_bookings_updated
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SUPABASE STORAGE — Create bucket for item images
-- (Run this separately or via Dashboard → Storage → New Bucket)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('item-images', 'item-images', true);

-- ============================================================
-- SAMPLE DATA (optional)
-- ============================================================
INSERT INTO categories (name, description, icon, custom_fields) VALUES
  ('Computers', 'Laptops, desktops, and peripherals', 'monitor', '[{"name":"Serial Number","type":"text","required":true},{"name":"Brand","type":"text","required":false},{"name":"Model","type":"text","required":false},{"name":"RAM (GB)","type":"number","required":false}]'),
  ('Tools', 'Hand tools, power tools, and equipment', 'wrench', '[{"name":"Brand","type":"text","required":false},{"name":"Voltage","type":"text","required":false}]'),
  ('Audio/Visual', 'Projectors, speakers, and AV equipment', 'speaker', '[{"name":"Serial Number","type":"text","required":true},{"name":"Resolution","type":"text","required":false}]'),
  ('Lab Equipment', 'Science and lab instruments', 'flask', '[{"name":"Serial Number","type":"text","required":true},{"name":"Calibration Date","type":"text","required":false}]'),
  ('Sports Equipment', 'Balls, rackets, and sports gear', 'trophy', '[{"name":"Sport","type":"text","required":false},{"name":"Size","type":"text","required":false}]');
