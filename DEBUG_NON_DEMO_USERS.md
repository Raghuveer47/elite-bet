# Debug Guide for Non-Demo Users Casino Issue

## Changes Made
Added detailed logging to `processBet` function in SupabaseWalletContext.tsx to track where it might be failing for database users.

## Testing Steps
1. Login with a NON-demo account (database user)
2. Navigate to Casino page
3. Open Mega Fortune Slots
4. Click SPIN button
5. Open browser console (F12)
6. Look for these log messages in order:

```
WalletContext: Processing bet: [amount] [gameType]
WalletContext: Getting balance for currency: [currency]
WalletContext: Current balance: [balance] Bet amount: [amount]
WalletContext: New balance after bet: [balance]
WalletContext: Updating balance...
WalletContext: Balance updated, updating accounts...
WalletContext: Accounts updated
WalletContext: Bet processed successfully (balance updated) [reference]
useCasinoGame: Bet placed successfully
```

## What to Check
If the game is not spinning, check the console for:

1. **Where the logs stop** - This shows where the function is failing
2. **Any error messages** - Check for JavaScript errors or exceptions
3. **Network tab** - Check if any API calls are failing or timing out

## Expected Behavior
- Game should start spinning immediately
- Balance should update right away
- No backend calls should block the game

## Common Issues
1. **Missing currency** - User might not have currency set
2. **Balance check fails** - validateBalance might be failing
3. **updateBalance fails** - Auth context updateBalance might be throwing an error

## Quick Fixes
If you see an error in the console, share it and I can fix it immediately.

