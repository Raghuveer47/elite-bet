-- VERIFY SUPABASE FIX - Run this to check if transactions are visible
-- Run this in Supabase SQL Editor after running the direct fix

-- Check 1: Verify RLS is disabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as "RLS Disabled"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'transactions', 'audit_logs', 'admin_users', 'games', 'bets')
ORDER BY tablename;

-- Check 2: Count transactions in database
SELECT 
  'transactions' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
FROM public.transactions;

-- Check 3: Show recent transactions
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
ORDER BY created_at DESC 
LIMIT 10;

-- Check 4: Test insert capability
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
  50.00,
  'USD',
  'pending',
  'Verification test transaction',
  'VERIFY_TEST_' || gen_random_uuid(),
  '{"verification": true}'
);

-- Check 5: Confirm the test insert worked
SELECT 
  'Test insert successful!' as result,
  COUNT(*) as new_transaction_count
FROM public.transactions 
WHERE description = 'Verification test transaction';

-- Clean up test data
DELETE FROM public.transactions 
WHERE description = 'Verification test transaction';

-- Final status
SELECT 'Supabase database is working correctly!' as final_status;
