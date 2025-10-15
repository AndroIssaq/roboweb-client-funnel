-- Fix users table to work with Supabase Auth
-- Remove password_hash column as Supabase handles authentication

-- Drop password_hash column if it exists
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- Make sure id column can accept auth.uid()
-- Note: The id should be set to auth.uid() when creating users after signup
