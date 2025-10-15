-- Fix missing columns in various tables

-- Add missing columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS name TEXT;

-- Update existing records to use project_name as name
UPDATE projects SET name = project_name WHERE name IS NULL;

-- Add missing columns to affiliates table  
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS email TEXT;

-- Populate affiliate name and email from users table
UPDATE affiliates a
SET 
  name = u.full_name,
  email = u.email
FROM users u
WHERE a.user_id = u.id AND (a.name IS NULL OR a.email IS NULL);

-- Add missing columns to portfolio table for better data structure
ALTER TABLE portfolio ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
CREATE INDEX IF NOT EXISTS idx_affiliates_email ON affiliates(email);
