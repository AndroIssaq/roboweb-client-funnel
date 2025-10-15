-- Create a test affiliate user for testing
-- This creates both auth user and affiliate record

-- Step 1: First create the user in Supabase Dashboard
-- Go to: Authentication > Users > Add User
-- Email: testaffiliate@roboweb.com
-- Password: Test123456
-- After creating, copy the User ID and replace USER_ID_HERE below

-- Step 2: Run this SQL (replace USER_ID_HERE with actual ID)
DO $$
DECLARE
  test_user_id UUID := 'USER_ID_HERE'; -- Replace with actual user ID from auth.users
  test_referral_code TEXT := 'AFF' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
BEGIN
  -- Update user metadata to set role as affiliate
  -- Note: This needs to be done via Supabase Dashboard or Admin API
  
  -- Insert into public.users
  INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
  VALUES (
    test_user_id,
    'testaffiliate@roboweb.com',
    'شريك تجريبي',
    'affiliate',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'affiliate',
    updated_at = NOW();
  
  -- Insert into affiliates table
  INSERT INTO public.affiliates (user_id, referral_code, commission_rate, status)
  VALUES (
    test_user_id,
    test_referral_code,
    10, -- 10% commission
    'active'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    status = 'active',
    commission_rate = 10;
  
  RAISE NOTICE 'Test affiliate created successfully!';
  RAISE NOTICE 'Referral Code: %', test_referral_code;
END $$;

-- Verify affiliate was created
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  a.referral_code,
  a.commission_rate,
  a.status,
  '✅ Test affiliate ready' as status_message
FROM public.users u
JOIN public.affiliates a ON a.user_id = u.id
WHERE u.email = 'testaffiliate@roboweb.com';
