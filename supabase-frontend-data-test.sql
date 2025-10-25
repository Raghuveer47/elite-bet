-- TEST EXACT FRONTEND DATA
-- This tests with the exact same data structure that the frontend sends
-- Run this in your Supabase SQL Editor

-- Test with the exact data structure from frontend
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
  200.00,
  'USD',
  'pending',
  'Manual deposit via union_bank_india',
  'DEPOSIT_1761378196448',
  '{"method": "union_bank_india", "paymentMethodId": null, "transactionId": "DEPOSIT_1761378196448", "paymentProof": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...", "manual": true, "bankDetails": {"bankName": "Union Bank of India", "accountName": "Elite Bet", "accountNumber": "034312010001727", "ifscCode": "UBIN0803430", "phoneNumber": "8712243286", "branchName": "Main Branch"}}'
);

-- Check if it was inserted
SELECT * FROM public.transactions WHERE reference = 'DEPOSIT_1761378196448';

-- Clean up
DELETE FROM public.transactions WHERE reference = 'DEPOSIT_1761378196448';

SELECT 'Frontend data test completed!' as result;
