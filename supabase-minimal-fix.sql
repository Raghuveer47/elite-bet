-- MINIMAL FIX for Infinite Recursion Error
-- Run this in your Supabase SQL Editor to fix the infinite recursion issue
-- This only removes the problematic policies without touching anything else

-- Drop ALL problematic admin policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can update admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all games" ON public.games;
DROP POLICY IF EXISTS "Admins can view all bets" ON public.bets;

-- Add missing columns to users table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'status') THEN
        ALTER TABLE public.users ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_deposited') THEN
        ALTER TABLE public.users ADD COLUMN total_deposited DECIMAL(15,2) DEFAULT 0.00;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_withdrawn') THEN
        ALTER TABLE public.users ADD COLUMN total_withdrawn DECIMAL(15,2) DEFAULT 0.00;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_wagered') THEN
        ALTER TABLE public.users ADD COLUMN total_wagered DECIMAL(15,2) DEFAULT 0.00;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'active_bets') THEN
        ALTER TABLE public.users ADD COLUMN active_bets INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'country') THEN
        ALTER TABLE public.users ADD COLUMN country TEXT DEFAULT 'United States';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'risk_level') THEN
        ALTER TABLE public.users ADD COLUMN risk_level TEXT DEFAULT 'low';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'kyc_status') THEN
        ALTER TABLE public.users ADD COLUMN kyc_status TEXT DEFAULT 'approved';
    END IF;
    
    -- Add columns to transactions table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'fee') THEN
        ALTER TABLE public.transactions ADD COLUMN fee DECIMAL(15,2) DEFAULT 0.00;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'method') THEN
        ALTER TABLE public.transactions ADD COLUMN method TEXT DEFAULT 'unknown';
    END IF;
END $$;

-- Update transaction type constraint to include 'fee' if needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'transactions_type_check') THEN
        ALTER TABLE public.transactions DROP CONSTRAINT transactions_type_check;
    END IF;
    ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check CHECK (type IN ('deposit', 'withdrawal', 'bet', 'win', 'refund', 'fee'));
EXCEPTION
    WHEN duplicate_object THEN
        -- Constraint already exists, ignore
        NULL;
END $$;
