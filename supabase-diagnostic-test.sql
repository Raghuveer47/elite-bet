-- COMPREHENSIVE SUPABASE DIAGNOSTIC TEST
-- Run this in Supabase SQL Editor to diagnose the exact issue

-- Step 1: Check if tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'transactions', 'audit_logs', 'admin_users', 'games', 'bets')
ORDER BY table_name;

-- Step 2: Check RLS status
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'transactions', 'audit_logs', 'admin_users', 'games', 'bets')
ORDER BY tablename;

-- Step 3: Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'transactions', 'audit_logs', 'admin_users', 'games', 'bets')
ORDER BY tablename, policyname;

-- Step 4: Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'transactions'
ORDER BY ordinal_position;

-- Step 5: Test basic insert
INSERT INTO public.transactions (
  user_id,
  type,
  amount,
  currency,
  status,
  description,
  reference,
  metadata
) VALUES (
  'faf28610-32bc-445c-8880-a9a66f0f4f51',
  'deposit',
  1.00,
  'USD',
  'pending',
  'Diagnostic test transaction',
  'DIAGNOSTIC_TEST_' || gen_random_uuid(),
  '{"diagnostic": true}'
);

-- Step 6: Verify insert worked
SELECT 
  id,
  user_id,
  type,
  amount,
  currency,
  status,
  description,
  reference,
  created_at
FROM public.transactions 
WHERE description = 'Diagnostic test transaction'
ORDER BY created_at DESC;

-- Step 7: Check if user exists
SELECT 
  id,
  email,
  first_name,
  last_name,
  balance
FROM public.users 
WHERE id = 'faf28610-32bc-445c-8880-a9a66f0f4f51';

-- Step 8: Show current transaction count
SELECT 
  COUNT(*) as total_transactions,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
FROM public.transactions;

-- Step 9: Clean up test data
DELETE FROM public.transactions 
WHERE description = 'Diagnostic test transaction';

-- Step 10: Final status
SELECT 'Diagnostic test completed. Check results above.' as status;
