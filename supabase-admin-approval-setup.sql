-- Elite Bet Admin Approval System Setup
-- Run this in Supabase SQL Editor

-- 1. Disable RLS for demo (admin can see all data)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;

-- 3. Give all existing users $100 by default
UPDATE public.users SET balance = 100.00 WHERE balance IS NULL OR balance = 0;

-- 4. Create function for new users to get $100 automatically
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user record with $100 balance
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    balance,
    status,
    is_verified,
    kyc_status,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    100.00, -- Default $100 balance
    'active',
    true, -- Auto-verify for demo
    'approved' -- Auto-approve KYC for demo
  );
  
  -- Auto-confirm email for demo
  UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 6. Test: Create a test deposit for admin to approve
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
  'Test deposit for admin approval',
  'TEST_DEPOSIT_' || extract(epoch from now())::text,
  '{"customerName": "Test User", "email": "test@example.com", "method": "union_bank_india", "bankTransactionId": "TEST123"}'
);

-- 7. Show current setup
SELECT 'Setup completed!' as status;
SELECT 'Users with $100 balance:' as info, count(*) as count FROM public.users WHERE balance = 100.00;
SELECT 'Pending deposits for admin approval:' as info, count(*) as count FROM public.transactions WHERE status = 'pending' AND type = 'deposit';
