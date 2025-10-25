// SUPABASE CONNECTION TEST
// Run this in browser console to test Supabase connection

// Test 1: Check if Supabase client is working
console.log('Testing Supabase connection...');
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

// Test 2: Import and test Supabase client
import { supabase } from './src/lib/supabase.js';

// Test 3: Check current session
const { data: sessionData } = await supabase.auth.getSession();
console.log('Current session:', sessionData.session ? 'Active' : 'None');

// Test 4: Test database connection
const { data: testData, error: testError } = await supabase
  .from('transactions')
  .select('id')
  .limit(1);

if (testError) {
  console.error('Database connection failed:', testError);
} else {
  console.log('Database connection successful!');
}

// Test 5: Try to insert a test transaction
const testTransaction = {
  user_id: 'faf28610-32bc-445c-8880-a9a66f0f4f51',
  type: 'deposit',
  amount: 1.00,
  currency: 'USD',
  status: 'pending',
  description: 'Browser console test',
  reference: 'CONSOLE_TEST_' + Date.now(),
  metadata: { test: true }
};

const { data: insertData, error: insertError } = await supabase
  .from('transactions')
  .insert(testTransaction)
  .select()
  .single();

if (insertError) {
  console.error('Insert failed:', insertError);
} else {
  console.log('Insert successful!', insertData);
  
  // Clean up test data
  await supabase
    .from('transactions')
    .delete()
    .eq('id', insertData.id);
  console.log('Test data cleaned up');
}

console.log('Supabase connection test completed!');
