-- Fix clients table RLS to allow users to create their own client record
-- This is needed when a user logs in for the first time

-- Drop the old admin-only insert policy
DROP POLICY IF EXISTS "Admins can insert clients" ON clients;

-- Create new policy that allows users to create their own client record
CREATE POLICY "Users can create own client record" ON clients
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- Re-create admin insert policy
CREATE POLICY "Admins can insert any client" ON clients
  FOR INSERT WITH CHECK (
    (SELECT user_metadata->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );
