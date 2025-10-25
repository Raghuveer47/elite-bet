-- TEST WITHOUT IMAGE DATA
-- This tests the same data but without the large base64 image
-- Run this in your Supabase SQL Editor

-- Test with the same data but without the image
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
  'DEPOSIT_NO_IMAGE_TEST',
  '{"method": "union_bank_india", "paymentMethodId": null, "transactionId": "DEPOSIT_NO_IMAGE_TEST", "paymentProof": "NO_IMAGE_FOR_TEST", "manual": true, "bankDetails": {"bankName": "Union Bank of India", "accountName": "Elite Bet", "accountNumber": "034312010001727", "ifscCode": "UBIN0803430", "phoneNumber": "8712243286", "branchName": "Main Branch"}}'
);

-- Check if it was inserted
SELECT * FROM public.transactions WHERE reference = 'DEPOSIT_NO_IMAGE_TEST';

-- Clean up
DELETE FROM public.transactions WHERE reference = 'DEPOSIT_NO_IMAGE_TEST';

SELECT 'No image test completed!' as result;
