-- SIMPLE SUPABASE DATABASE TEST
-- Run this to quickly test if your database is working

-- Test 1: Check if we can insert a transaction
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
  'faf28610-32bc-445c-8880-a9a66f0f4f51', -- Replace with your actual user ID
  'test',
  1.00,
  'USD',
  'pending',
  'Quick database test',
  'TEST_' || gen_random_uuid(),
  '{"test": true}'
);

-- Test 2: Check if the insert worked
SELECT 
  id,
  user_id,
  type,
  amount,
  status,
  description,
  reference,
  created_at
FROM public.transactions 
WHERE description = 'Quick database test'
ORDER BY created_at DESC;

-- Test 3: Clean up
DELETE FROM public.transactions 
WHERE description = 'Quick database test';

-- Test 4: Show success message
SELECT 'Database test completed successfully!' as result;