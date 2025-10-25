-- COMPLETE RLS FIX for Admin Access
-- This will completely remove problematic RLS policies and allow admin access
-- Run this in your Supabase SQL Editor

-- First, disable RLS temporarily to fix the recursion
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can view all users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can update all users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
-- Allow any authenticated user to access all data (for admin purposes)
CREATE POLICY "Allow all authenticated users" ON public.users
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all authenticated users" ON public.transactions
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all authenticated users" ON public.audit_logs
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all authenticated users" ON public.admin_users
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'transactions', 'audit_logs', 'admin_users');
