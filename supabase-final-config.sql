-- Supabase Database Configuration for Elite Bet
-- Run this in your Supabase SQL Editor to ensure proper setup

-- 1. Check if RLS is enabled (it should be disabled for demo purposes)
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'transactions', 'admin_users');

-- 2. Disable RLS on all tables (for demo purposes)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.games DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets DISABLE ROW LEVEL SECURITY;

-- 3. Drop all existing policies (clean slate)
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can manage all data" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.transactions;

-- 4. Test insert capability
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
  100.00,
  'USD',
  'pending',
  'Test deposit transaction',
  'TEST_' || extract(epoch from now())::text,
  '{"test": true, "method": "test_deposit"}'
);

-- 5. Verify the insert worked
SELECT * FROM public.transactions 
WHERE reference LIKE 'TEST_%' 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Show table counts
SELECT 
  'users' as table_name, count(*) as count FROM public.users
UNION ALL
SELECT 
  'transactions' as table_name, count(*) as count FROM public.transactions
UNION ALL
SELECT 
  'admin_users' as table_name, count(*) as count FROM public.admin_users;

-- 7. Clean up test data
DELETE FROM public.transactions WHERE reference LIKE 'TEST_%';

-- Success message
SELECT 'Database configuration completed successfully!' as status;
