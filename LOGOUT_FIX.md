# Logout Issue Fix

## Issue
User was getting logged out when navigating to wallet page and refreshing. Error: `mergedTransactions is not defined`

## Root Cause
In `SupabaseAdminContext.tsx`, the code was trying to use a variable `mergedTransactions` that was never defined. This was likely a leftover from an earlier refactoring where transactions were being merged from multiple sources.

## Fix
Changed all references from `mergedTransactions` to `allTransactions` throughout the file:

### Changes Made
- Line 446: Changed `mergedTransactions.length` to `allTransactions.length`
- Line 449: Changed comment and log to use `allTransactions`
- Lines 455, 461, 468, 472, 476, 480: Changed all filter/reduce operations to use `allTransactions`
- Lines 490, 494: Changed pending deposits/withdrawals counts to use `allTransactions`

### Why This Works
- `allTransactions` is properly defined in the function (line 368)
- It contains all transactions loaded from either MongoDB backend or Supabase
- This variable is consistently used throughout the function for transaction operations

## Testing
1. Login to the app
2. Play a game in the casino
3. Navigate to Wallet page
4. Refresh the page
5. Should stay logged in without errors

