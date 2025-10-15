-- Clean up fake/test users that don't exist in auth.users
-- Keep only real authenticated users

-- Step 1: Show users that don't exist in auth.users
SELECT 
  pu.id,
  pu.email,
  pu.full_name,
  pu.role,
  'Will be deleted - not in auth.users' as status
FROM public.users pu
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users au WHERE au.id = pu.id
);

-- Step 2: Delete fake users (those not in auth.users)
DELETE FROM public.users
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users au WHERE au.id = public.users.id
);

-- Step 3: Show remaining valid users
SELECT 
  pu.id,
  pu.email,
  pu.full_name,
  pu.role,
  '✅ Valid user (exists in auth.users)' as status
FROM public.users pu
WHERE EXISTS (
  SELECT 1 FROM auth.users au WHERE au.id = pu.id
)
ORDER BY pu.created_at DESC;

-- Step 4: Final count
SELECT 
  'Valid users count' as info,
  COUNT(*) as count
FROM public.users pu
WHERE EXISTS (
  SELECT 1 FROM auth.users au WHERE au.id = pu.id
);
