-- NUCLEAR RLS FIX - Complete Removal of RLS
-- This will completely disable RLS to fix the infinite recursion
-- Run this in your Supabase SQL Editor

-- COMPLETELY DISABLE RLS on all tables (nuclear option)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.games DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies to ensure no conflicts
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
DROP POLICY IF EXISTS "Allow all authenticated users" ON public.users;
DROP POLICY IF EXISTS "Allow all authenticated users" ON public.transactions;
DROP POLICY IF EXISTS "Allow all authenticated users" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow all authenticated users" ON public.admin_users;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'transactions', 'audit_logs', 'admin_users', 'games', 'bets');

-- Test query to verify access
SELECT COUNT(*) as user_count FROM public.users;
SELECT COUNT(*) as transaction_count FROM public.transactions;
