-- Allow users to create their own affiliate record during signup
-- This is needed when a user signs up as an affiliate

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Users can create their own affiliate record" ON affiliates;

-- Allow users to insert their own affiliate record
CREATE POLICY "Users can create their own affiliate record" ON affiliates
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Allow users to view their own affiliate record
DROP POLICY IF EXISTS "Users can view their own affiliate record" ON affiliates;

CREATE POLICY "Users can view their own affiliate record" ON affiliates
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'affiliates'
ORDER BY policyname;
