-- Check if affiliate record exists for the user

-- Check users table
SELECT 
  id,
  email,
  full_name,
  role,
  'User record' as type
FROM public.users
WHERE email = 'androashk88@gmail.com';

-- Check affiliates table
SELECT 
  a.id,
  a.user_id,
  a.referral_code,
  a.commission_rate,
  a.status,
  u.email,
  u.full_name,
  'Affiliate record' as type
FROM public.affiliates a
LEFT JOIN public.users u ON u.id = a.user_id
WHERE u.email = 'androashk88@gmail.com';

-- If affiliate record is missing, create it
INSERT INTO public.affiliates (user_id, referral_code, commission_rate, status)
SELECT 
  id,
  'AFF' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6)),
  10,
  'active'
FROM public.users
WHERE email = 'androashk88@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.affiliates WHERE user_id = public.users.id
  )
RETURNING 
  id,
  user_id,
  referral_code,
  '✅ Affiliate record created' as status;

-- Final verification
SELECT 
  u.id as user_id,
  u.email,
  u.full_name,
  u.role,
  a.id as affiliate_id,
  a.referral_code,
  a.commission_rate,
  a.status,
  CASE 
    WHEN a.id IS NULL THEN '❌ Missing affiliate record'
    ELSE '✅ Complete'
  END as status_check
FROM public.users u
LEFT JOIN public.affiliates a ON a.user_id = u.id
WHERE u.email = 'androashk88@gmail.com';
