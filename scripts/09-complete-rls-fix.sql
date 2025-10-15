-- Complete RLS Fix for Roboweb Client Funnel
-- This script fixes all RLS issues including infinite recursion and client creation

-- ============================================
-- Part 1: Fix users table infinite recursion
-- ============================================

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Allow user creation" ON users;

-- Create a security definer function to check if user is admin
-- This function bypasses RLS to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT raw_user_meta_data->>'role' INTO user_role
  FROM auth.users
  WHERE id = auth.uid();
  
  RETURN user_role = 'admin';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Create new policies using the security definer function

-- Users can view their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (is_admin());

-- Allow new user creation during signup
CREATE POLICY "Allow user creation" ON users
  FOR INSERT WITH CHECK (
    auth.uid() = id OR is_admin()
  );

-- Admins can update all users
CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE USING (is_admin());

-- Admins can delete users
CREATE POLICY "Admins can delete users" ON users
  FOR DELETE USING (is_admin());

-- ============================================
-- Part 2: Fix clients table policies
-- ============================================

-- Drop old insert policy
DROP POLICY IF EXISTS "Admins can insert clients" ON clients;
DROP POLICY IF EXISTS "Users can create own client record" ON clients;
DROP POLICY IF EXISTS "Admins can insert any client" ON clients;

-- Allow users to create their own client record
CREATE POLICY "Users can create own client record" ON clients
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- Allow admins to insert any client
CREATE POLICY "Admins can insert any client" ON clients
  FOR INSERT WITH CHECK (is_admin());

-- ============================================
-- Part 3: Update other policies to use is_admin()
-- ============================================

-- Update contracts policies
DROP POLICY IF EXISTS "Admins can insert contracts" ON contracts;
DROP POLICY IF EXISTS "Admins can update contracts" ON contracts;
DROP POLICY IF EXISTS "Admins can delete contracts" ON contracts;

CREATE POLICY "Admins can insert contracts" ON contracts
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update contracts" ON contracts
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete contracts" ON contracts
  FOR DELETE USING (is_admin());

-- Update projects policies
DROP POLICY IF EXISTS "Admins can insert projects" ON projects;
DROP POLICY IF EXISTS "Admins can update projects" ON projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON projects;

CREATE POLICY "Admins can insert projects" ON projects
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update projects" ON projects
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete projects" ON projects
  FOR DELETE USING (is_admin());

-- Update portfolio policies
DROP POLICY IF EXISTS "Admins can view all portfolio" ON portfolio;
DROP POLICY IF EXISTS "Admins can insert portfolio" ON portfolio;
DROP POLICY IF EXISTS "Admins can update portfolio" ON portfolio;
DROP POLICY IF EXISTS "Admins can delete portfolio" ON portfolio;

CREATE POLICY "Admins can view all portfolio" ON portfolio
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert portfolio" ON portfolio
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update portfolio" ON portfolio
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete portfolio" ON portfolio
  FOR DELETE USING (is_admin());

-- Update affiliates policies
DROP POLICY IF EXISTS "Admins can insert affiliates" ON affiliates;
DROP POLICY IF EXISTS "Admins can update all affiliates" ON affiliates;
DROP POLICY IF EXISTS "Admins can delete affiliates" ON affiliates;

CREATE POLICY "Admins can insert affiliates" ON affiliates
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update all affiliates" ON affiliates
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete affiliates" ON affiliates
  FOR DELETE USING (is_admin());

-- Update payouts policies
DROP POLICY IF EXISTS "Admins can insert payouts" ON payouts;
DROP POLICY IF EXISTS "Admins can update payouts" ON payouts;
DROP POLICY IF EXISTS "Admins can delete payouts" ON payouts;

CREATE POLICY "Admins can insert payouts" ON payouts
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update payouts" ON payouts
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete payouts" ON payouts
  FOR DELETE USING (is_admin());

-- Update notifications policies
DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;

CREATE POLICY "Admins can insert notifications" ON notifications
  FOR INSERT WITH CHECK (is_admin());

-- Update clients view/update policies to avoid infinite recursion
DROP POLICY IF EXISTS "Clients can view own profile" ON clients;
DROP POLICY IF EXISTS "Admins can update all clients" ON clients;
DROP POLICY IF EXISTS "Admins can delete clients" ON clients;

CREATE POLICY "Clients can view own profile" ON clients
  FOR SELECT USING (
    user_id = auth.uid() OR is_admin()
  );

CREATE POLICY "Admins can update all clients" ON clients
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete clients" ON clients
  FOR DELETE USING (is_admin());

-- Update contracts view policies
DROP POLICY IF EXISTS "Clients can view own contracts" ON contracts;

CREATE POLICY "Clients can view own contracts" ON contracts
  FOR SELECT USING (
    client_id = auth.uid() OR is_admin()
  );

-- Update projects view policies
DROP POLICY IF EXISTS "Clients can view own projects" ON projects;

CREATE POLICY "Clients can view own projects" ON projects
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM clients WHERE id = projects.client_id AND user_id = auth.uid()) OR
    is_admin()
  );

-- Update payouts view policies
DROP POLICY IF EXISTS "Affiliates can view own payouts" ON payouts;

CREATE POLICY "Affiliates can view own payouts" ON payouts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM affiliates WHERE id = payouts.affiliate_id AND user_id = auth.uid()) OR
    is_admin()
  );

-- Update notifications view policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (
    user_id = auth.uid() OR is_admin()
  );

-- Update activity_log policies
DROP POLICY IF EXISTS "Admins can view activity logs" ON activity_log;

CREATE POLICY "Admins can view activity logs" ON activity_log
  FOR SELECT USING (is_admin());
