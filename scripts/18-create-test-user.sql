-- Create a test user for testing messages
-- This creates a user directly in public.users (for testing only)

-- Generate a random UUID for test user
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
BEGIN
  -- Insert test user
  INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
  VALUES (
    test_user_id,
    'test-client@roboweb.com',
    'عميل تجريبي',
    'client',
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO NOTHING;

  -- Show created user
  RAISE NOTICE 'Test user created with ID: %', test_user_id;
END $$;

-- Verify test user exists
SELECT 
  id,
  email,
  full_name,
  role,
  'Test user ready for messaging' as status
FROM public.users
WHERE email = 'test-client@roboweb.com';

-- Show all users
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM public.users
ORDER BY created_at DESC;
