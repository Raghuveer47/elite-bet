-- SIMPLE DATABASE TEST
-- Run this to test if database inserts work
-- Run this in your Supabase SQL Editor

-- Test 1: Check if we can insert into transactions table
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
  'Test deposit', 
  'TEST_DEPOSIT_123', 
  '{"test": true, "method": "test"}'
);

-- Test 2: Check if the insert worked
SELECT * FROM public.transactions WHERE reference = 'TEST_DEPOSIT_123';

-- Test 3: Clean up test data
DELETE FROM public.transactions WHERE reference = 'TEST_DEPOSIT_123';

-- If this runs without errors, database inserts are working!
SELECT 'Database test completed successfully!' as result;
