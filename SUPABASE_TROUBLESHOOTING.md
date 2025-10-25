# SUPABASE DATABASE TROUBLESHOOTING GUIDE

## 🚨 **Issue: Unable to see transaction data in Supabase**

### **Step 1: Run the Database Fix Script**

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste the contents of `supabase-final-fix.sql`**
4. **Click "Run" to execute the script**

This script will:
- ✅ Disable RLS (Row Level Security) on all tables
- ✅ Remove all existing policies
- ✅ Test insert/select operations
- ✅ Show current table counts

### **Step 2: Verify Environment Variables**

Check your `.env` file has these variables:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### **Step 3: Test Database Connection**

1. **Run the quick test script** (`supabase-quick-test.sql`)
2. **Check browser console** for any Supabase errors
3. **Verify network requests** in browser DevTools

### **Step 4: Check Common Issues**

**Issue 1: RLS Policies Blocking Inserts**
- **Solution**: Run the final fix script to disable RLS

**Issue 2: Missing Environment Variables**
- **Solution**: Add correct Supabase URL and anon key to `.env`

**Issue 3: Network Connectivity**
- **Solution**: Check if Supabase URL is accessible

**Issue 4: Authentication Issues**
- **Solution**: Ensure user is properly authenticated

### **Step 5: Debug Steps**

1. **Open Browser DevTools** (F12)
2. **Go to Console tab**
3. **Look for Supabase errors**
4. **Go to Network tab**
5. **Check for failed requests to Supabase**

### **Step 6: Manual Database Check**

1. **Go to Supabase Dashboard**
2. **Navigate to Table Editor**
3. **Check if tables exist**:
   - `users`
   - `transactions`
   - `audit_logs`
   - `admin_users`
   - `games`
   - `bets`

### **Step 7: Test Insert Manually**

Run this in Supabase SQL Editor:
```sql
INSERT INTO public.transactions (
  user_id,
  type,
  amount,
  currency,
  status,
  description,
  reference
) VALUES (
  'faf28610-32bc-445c-8880-a9a66f0f4f51',
  'deposit',
  100.00,
  'USD',
  'pending',
  'Manual test',
  'MANUAL_TEST_' || gen_random_uuid()
);
```

### **Expected Results After Fix**

- ✅ **RLS disabled** on all tables
- ✅ **No policies** blocking operations
- ✅ **Insert operations** work
- ✅ **Select operations** work
- ✅ **Transaction data** visible in Supabase
- ✅ **Frontend can** create transactions

### **If Still Not Working**

1. **Check Supabase project status** - ensure it's not paused
2. **Verify billing** - ensure project is not suspended
3. **Check API limits** - ensure not hitting rate limits
4. **Contact Supabase support** if issues persist

### **Fallback Solution**

If Supabase continues to have issues, the app will:
- ✅ **Store transactions locally** in localStorage
- ✅ **Show in admin dashboard** via local storage
- ✅ **Work offline** until Supabase is fixed
- ✅ **Sync when** Supabase is working again
