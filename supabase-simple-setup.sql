-- Simple Elite Bet Setup - All users get $100 by default
-- Run this in Supabase SQL Editor

-- 1. Disable RLS completely (for demo)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- 2. Drop all policies
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;

-- 3. Update all existing users to have $100 balance
UPDATE public.users SET balance = 100.00 WHERE balance IS NULL OR balance = 0;

-- 4. Create a function to give $100 to new users automatically
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

-- 6. Test the setup
SELECT 'Setup completed! All users now have $100 by default.' as status;

-- 7. Show current users and their balances
SELECT id, email, balance, status FROM public.users LIMIT 5;
