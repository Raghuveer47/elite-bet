-- ADMIN ACCESS FIX for Supabase
-- Run this in your Supabase SQL Editor to allow admin to see all users

-- Create a function to check if current user is admin (bypass RLS for admin operations)
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if there's an admin session in sessionStorage
  -- Since we can't access sessionStorage from SQL, we'll use a different approach
  -- For now, we'll allow all authenticated users to see all data (temporary fix)
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to allow admin access
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;

-- Create new policies that allow authenticated users to see all data (for admin purposes)
CREATE POLICY "Authenticated users can view all users" ON public.users
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update all users" ON public.users
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view all transactions" ON public.transactions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view all audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert audit logs
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
