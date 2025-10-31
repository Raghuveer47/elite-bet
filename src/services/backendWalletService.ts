const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api/betting';

export interface TransactionData {
  userId: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'refund' | 'bonus' | 'fee';
  amount: number;
  description: string;
  metadata?: any;
}

export interface BetData {
  userId: string;
  gameId: string;
  gameType: string;
  amount: number;
  details?: any;
}

export interface BetResultData {
  betId: string;
  userId: string;
  result: 'won' | 'lost';
  payout: number;
  details?: any;
}

export class BackendWalletService {
  // Get user balance from backend
  static async getUserBalance(userId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/balance/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          balance: data.balance,
          stats: data.stats
        };
      }
      
      return { success: false, message: data.message };
    } catch (error: any) {
      console.error('BackendWalletService: Get balance error:', error);
      return { success: false, message: error.message };
    }
  }

  // Update user balance
  static async updateBalance(userId: string, amount: number, reason: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/balance/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, amount, reason })
      });
      
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          newBalance: data.newBalance,
          adjustment: data.adjustment
        };
      }
      
      return { success: false, message: data.message };
    } catch (error: any) {
      console.error('BackendWalletService: Update balance error:', error);
      return { success: false, message: error.message };
    }
  }

  // Create transaction
  static async createTransaction(transactionData: TransactionData) {
    try {
      const response = await fetch(`${API_BASE_URL}/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transactionData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          transaction: data.transaction,
          newBalance: data.newBalance
        };
      }
      
      return { success: false, message: data.message };
    } catch (error: any) {
      console.error('BackendWalletService: Create transaction error:', error);
      return { success: false, message: error.message };
    }
  }

  // Place a bet
  static async placeBet(betData: BetData) {
    try {
      const response = await fetch(`${API_BASE_URL}/bet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(betData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          bet: data.bet,
          newBalance: data.newBalance
        };
      }
      
      return { success: false, message: data.message };
    } catch (error: any) {
      console.error('BackendWalletService: Place bet error:', error);
      return { success: false, message: error.message };
    }
  }

  // Process bet result
  static async processBetResult(betResultData: BetResultData) {
    try {
      const response = await fetch(`${API_BASE_URL}/bet/result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(betResultData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          bet: data.bet,
          newBalance: data.newBalance
        };
      }
      
      return { success: false, message: data.message };
    } catch (error: any) {
      console.error('BackendWalletService: Process bet result error:', error);
      return { success: false, message: error.message };
    }
  }

  // Get user transactions
  static async getTransactions(userId: string, page = 1, limit = 50) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/transactions/${userId}?page=${page}&limit=${limit}`
      );
      
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          transactions: data.transactions,
          pagination: data.pagination
        };
      }
      
      return { success: false, message: data.message };
    } catch (error: any) {
      console.error('BackendWalletService: Get transactions error:', error);
      return { success: false, message: error.message };
    }
  }

  // Get user bets
  static async getBets(userId: string, page = 1, limit = 50) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/bets/${userId}?page=${page}&limit=${limit}`
      );
      
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          bets: data.bets,
          pagination: data.pagination
        };
      }
      
      return { success: false, message: data.message };
    } catch (error: any) {
      console.error('BackendWalletService: Get bets error:', error);
      return { success: false, message: error.message };
    }
  }

  // Get game statistics
  static async getGameStats(userId: string, gameType: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/stats/${userId}/${gameType}`);
      
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          stats: data.stats
        };
      }
      
      return { success: false, message: data.message };
    } catch (error: any) {
      console.error('BackendWalletService: Get game stats error:', error);
      return { success: false, message: error.message };
    }
  }
}
