-- Run this once in Supabase SQL Editor if borrow_requests already exists.
-- The main schema.sql includes these fields for fresh installations.

ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS ticket_number VARCHAR(30) UNIQUE;
ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS requester_type VARCHAR(20) DEFAULT 'student';
ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS department VARCHAR(20);
ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium';
ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES admins(id) ON DELETE SET NULL;
ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS ticket_category VARCHAR(30) DEFAULT 'borrow';
ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE borrow_requests ALTER COLUMN borrow_date DROP NOT NULL;
ALTER TABLE borrow_requests ALTER COLUMN expected_return_date DROP NOT NULL;

ALTER TABLE borrow_requests DROP CONSTRAINT IF EXISTS borrow_requests_requester_type_check;
ALTER TABLE borrow_requests ADD CONSTRAINT borrow_requests_requester_type_check CHECK (requester_type IN ('student', 'teacher', 'admin'));
ALTER TABLE borrow_requests DROP CONSTRAINT IF EXISTS borrow_requests_ticket_category_check;
ALTER TABLE borrow_requests ADD CONSTRAINT borrow_requests_ticket_category_check CHECK (ticket_category IN ('borrow', 'tech_support', 'tool_borrow', 'manpower', 'other'));
ALTER TABLE borrow_requests DROP CONSTRAINT IF EXISTS borrow_requests_status_check;
ALTER TABLE borrow_requests ADD CONSTRAINT borrow_requests_status_check CHECK (status IN ('pending', 'open', 'closed', 'approved', 'rejected', 'borrowed', 'returned', 'overdue'));

UPDATE borrow_requests
SET requester_type = COALESCE(requester_type, 'student'),
    department = COALESCE(department, student_department, 'Admin'),
    priority = COALESCE(priority, 'medium'),
    ticket_category = COALESCE(ticket_category, 'borrow'),
    ticket_number = COALESCE(ticket_number, 'BR-' || UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 12)))
WHERE ticket_number IS NULL OR requester_type IS NULL OR department IS NULL OR priority IS NULL OR ticket_category IS NULL;

ALTER TABLE borrow_requests ALTER COLUMN requester_type SET DEFAULT 'student';
ALTER TABLE borrow_requests ALTER COLUMN priority SET DEFAULT 'medium';
ALTER TABLE borrow_requests ALTER COLUMN status SET DEFAULT 'open';
