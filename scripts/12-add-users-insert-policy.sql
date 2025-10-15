-- Add policy to allow admins to insert users
-- This is needed when creating contracts for new clients

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Admins can insert users" ON users;

-- Allow admins to insert new users
CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin')
    )
  );

-- Also allow affiliates to insert users (for creating contracts)
DROP POLICY IF EXISTS "Affiliates can insert users" ON users;

CREATE POLICY "Affiliates can insert users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'affiliate')
    )
  );

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
