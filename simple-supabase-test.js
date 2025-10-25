// SIMPLIFIED SUPABASE TEST
// This creates a minimal Supabase client to test basic connectivity

// Test with minimal configuration
const testSupabase = (url, key) => {
  console.log('Testing with minimal Supabase configuration...');
  
  // Create minimal client
  const { createClient } = window.supabase || {};
  if (!createClient) {
    console.error('Supabase client not available');
    return;
  }
  
  const client = createClient(url, key);
  
  // Test basic connection
  client.from('transactions').select('id').limit(1).then(({ data, error }) => {
    if (error) {
      console.error('Minimal client test failed:', error);
    } else {
      console.log('Minimal client test successful:', data);
    }
  });
};

// Run the test
testSupabase(
  'https://rrchgxrcugsrabvuuggb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyY2hneHJjdWdzcmFidnV1Z2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMzIxMTgsImV4cCI6MjA3NjkwODExOH0.TMFy-m9stP0EvWC1hiDeLqPUt2ihYCZattvIeXxChRo'
);
