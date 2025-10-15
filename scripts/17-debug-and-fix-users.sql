-- Debug and fix users sync issue

-- Step 1: Check current state
SELECT 'Auth Users Count' as info, COUNT(*) as count FROM auth.users;
SELECT 'Public Users Count' as info, COUNT(*) as count FROM public.users;

-- Step 2: Show missing users
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name' as full_name,
  au.raw_user_meta_data->>'role' as role,
  'Missing in public.users' as status
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
);

-- Step 3: Force sync ALL users from auth to public
INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  COALESCE(au.raw_user_meta_data->>'role', 'client'),
  au.created_at,
  NOW()
FROM auth.users au
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
  role = COALESCE(EXCLUDED.role, public.users.role),
  updated_at = NOW();

-- Step 4: Verify sync
SELECT 
  'After Sync - Public Users Count' as info, 
  COUNT(*) as count 
FROM public.users;

-- Step 5: Show all users with their sync status
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'role' as auth_role,
  pu.role as public_role,
  CASE 
    WHEN pu.id IS NULL THEN '❌ Missing'
    ELSE '✅ Synced'
  END as status
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
ORDER BY au.created_at DESC;
