// BROWSER SUPABASE CONNECTION TEST
// Run this in browser console (F12) to test Supabase connection

console.log('=== SUPABASE CONNECTION TEST ===');

// Test 1: Check environment variables
console.log('1. Environment Variables:');
console.log('   Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('   Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

// Test 2: Import Supabase client
console.log('2. Importing Supabase client...');
try {
  const { supabase } = await import('./src/lib/supabase.js');
  console.log('   ✅ Supabase client imported successfully');
  
  // Test 3: Check session
  console.log('3. Checking session...');
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error('   ❌ Session error:', sessionError);
  } else {
    console.log('   ✅ Session check:', sessionData.session ? 'Active' : 'None');
    if (sessionData.session) {
      console.log('   User ID:', sessionData.session.user.id);
    }
  }
  
  // Test 4: Test database connection
  console.log('4. Testing database connection...');
  const { data: testData, error: testError } = await supabase
    .from('transactions')
    .select('id')
    .limit(1);
  
  if (testError) {
    console.error('   ❌ Database connection failed:', testError);
  } else {
    console.log('   ✅ Database connection successful');
  }
  
  // Test 5: Test insert
  console.log('5. Testing insert operation...');
  const testTransaction = {
    user_id: 'faf28610-32bc-445c-8880-a9a66f0f4f51',
    type: 'deposit',
    amount: 0.01,
    currency: 'USD',
    status: 'pending',
    description: 'Browser console test',
    reference: 'BROWSER_TEST_' + Date.now(),
    metadata: { test: true }
  };
  
  const { data: insertData, error: insertError } = await supabase
    .from('transactions')
    .insert(testTransaction)
    .select()
    .single();
  
  if (insertError) {
    console.error('   ❌ Insert failed:', insertError);
    console.error('   Error details:', {
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint
    });
  } else {
    console.log('   ✅ Insert successful!', insertData);
    
    // Clean up test data
    await supabase
      .from('transactions')
      .delete()
      .eq('id', insertData.id);
    console.log('   ✅ Test data cleaned up');
  }
  
} catch (error) {
  console.error('❌ Import failed:', error);
}

console.log('=== TEST COMPLETED ===');
