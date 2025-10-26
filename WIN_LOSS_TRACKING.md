# Win/Loss Tracking System

## Overview
The Elite Bet platform automatically tracks all betting activity, wins, and losses for both users and administrators. The system updates balances in real-time and maintains a complete transaction history.

## How It Works

### 1. **When User Places a Bet**
- The bet amount is deducted from the user's balance
- A transaction record is created with type: `'bet'`
- Transaction is stored in:
  - Supabase database (for admin tracking)
  - Local storage (for offline functionality)
  - Transaction history (visible to user in wallet)

### 2. **When User Wins**
- The win amount is added to the user's balance
- A transaction record is created with type: `'win'`
- Transaction includes:
  - Win amount
  - Game name
  - Bet details
  - Timestamp

### 3. **When User Loses**
- No additional transaction is created (already recorded as bet)
- Loss is calculated as: `totalBets - totalWinnings`

## Implementation Details

### Game Example: Baccarat
```typescript
// When betting
bets.forEach(bet => placeBet(bet.amount));

// When winning
if (totalWinnings > 0) {
  addWinnings(totalWinnings);
}
```

### Transaction Flow
1. **Bet Placed**: `processBet(betAmount, gameType, description, metadata)`
   - Creates transaction: `{ type: 'bet', amount: betAmount }`
   - Deducts from balance
   
2. **Win Detected**: `processWin(winAmount, gameType, description, metadata)`
   - Creates transaction: `{ type: 'win', amount: winAmount }`
   - Adds to balance

### Storage Locations

#### For Users
- **Transaction History**: `/wallet` page
- **Local Storage**: `localStorage.getItem('transactions')`
- **Balance**: Displayed in wallet and game screens

#### For Admins
- **User Management**: See total wagered, won, and profit per user
- **Financial Dashboard**: Aggregate statistics
- **Transaction Log**: Complete transaction history for each user
- **Database**: Stored in Supabase `transactions` table

## Transaction History Structure

```typescript
interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'refund';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  reference: string;
  createdAt: Date;
  metadata: {
    gameId?: string;
    gameName?: string;
    gameType?: string;
    winAmount?: number;
    betAmount?: number;
    // ... other game-specific data
  }
}
```

## Admin Features

### Viewing User Activity
1. Navigate to `/admin/users`
2. Click on any user
3. View their transaction history
4. See:
   - Total Deposited
   - Total Withdrawn
   - Total Wagered
   - Total Won
   - Net Profit/Loss

### Financial Dashboard
1. Navigate to `/admin/financial`
2. View overall statistics:
   - Total house edge
   - Revenue by game type
   - User win/loss distribution
   - Active bet tracking

## User Features

### Viewing Personal History
1. Navigate to `/wallet`
2. View transaction list
3. Filter by:
   - Deposit
   - Withdrawal
   - Bet
   - Win
   - Date range

### Balance Updates
- Balance updates in real-time
- Automatically synced across all pages
- Persistent across sessions

## Games Supported

All casino games implement this tracking:
- ✅ Baccarat (`BaccaratGame.tsx`)
- ✅ Roulette (`RouletteGame.tsx`)
- ✅ Blackjack (`BlackjackGame.tsx`)
- ✅ Slots (coming soon)

## Database Schema

```sql
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL, -- 'bet', 'win', 'deposit', 'withdrawal'
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'completed',
  description TEXT NOT NULL,
  reference TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);
```

## Security Features

- ✅ All transactions are immutable
- ✅ Cannot delete transaction records
- ✅ Timestamp verification
- ✅ User ID validation
- ✅ Balance checks before bets
- ✅ Admin audit logging

## Testing

### Test Win
1. Play any casino game
2. Place a bet
3. If you win:
   - Check balance increases
   - View transaction in `/wallet`
   - Verify in admin panel

### Test Loss
1. Play any casino game
2. Place a bet
3. If you lose:
   - Balance stays the same (already deducted on bet)
   - Transaction shows in history
   - No refund

## Notes

- All transactions are permanent records
- Cannot be modified or deleted
- Used for auditing and compliance
- Visible to both user and admin
- Real-time synchronization
- Offline support with local storage fallback
