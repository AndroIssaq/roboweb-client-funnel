-- Create Admin User for Testing
-- This script creates an admin user that you can use to access the admin panel

-- IMPORTANT: Change the email and update the user_id after creating the user in Supabase Auth

-- Step 1: First, create the user in Supabase Dashboard:
-- Go to Authentication > Users > Add User
-- Email: admin@roboweb.com (or your preferred email)
-- Password: (set a strong password)
-- After creating, copy the user ID

-- Step 2: Update the user's metadata to set role as admin
-- Replace 'YOUR-USER-ID-HERE' with the actual user ID from step 1

-- Update user metadata in auth.users (run this in SQL Editor)
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin", "full_name": "Admin User"}'::jsonb
WHERE email = 'admin@roboweb.com';  -- Change this to your admin email

-- Step 3: Create corresponding record in public.users table
-- Replace 'YOUR-USER-ID-HERE' with the actual user ID

INSERT INTO public.users (id, email, full_name, role)
VALUES (
  'YOUR-USER-ID-HERE',  -- Replace with actual user ID
  'admin@roboweb.com',   -- Your admin email
  'Admin User',          -- Admin name
  'admin'
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin';

-- Verify the admin user was created
SELECT id, email, full_name, role 
FROM public.users 
WHERE role = 'admin';
