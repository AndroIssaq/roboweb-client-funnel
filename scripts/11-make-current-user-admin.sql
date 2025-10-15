-- Make Current User Admin
-- This script converts your current logged-in user to admin role

-- OPTION 1: Make a specific user admin by email
-- Replace 'your-email@example.com' with your actual email

UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'androisshaq@gmail.com';  -- CHANGE THIS TO YOUR EMAIL

-- Also update or create the user in public.users table
INSERT INTO public.users (id, email, full_name, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email),
  'admin'
FROM auth.users
WHERE email = 'androisshaq@gmail.com'  -- CHANGE THIS TO YOUR EMAIL
ON CONFLICT (id) 
DO UPDATE SET role = 'admin';

-- Verify the change
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'role' as metadata_role,
  pu.role as users_table_role
FROM auth.users u
LEFT JOIN public.users pu ON pu.id = u.id
WHERE u.email = 'androisshaq@gmail.com';  -- CHANGE THIS TO YOUR EMAIL
