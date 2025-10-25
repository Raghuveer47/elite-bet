const API_BASE_URL = 'http://localhost:3001/api/betting';

export class BettingService {
  // Place a bet
  static async placeBet(userId: string, gameId: string, gameType: string, amount: number, details: any = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/bet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          gameId,
          gameType,
          amount,
          details
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to place bet');
      }

      return data;
    } catch (error) {
      console.error('Place bet error:', error);
      throw error;
    }
  }

  // Process bet result
  static async processBetResult(betId: string, userId: string, result: 'won' | 'lost', payout: number, details: any = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/bet/result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          betId,
          userId,
          result,
          payout,
          details
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to process bet result');
      }

      return data;
    } catch (error) {
      console.error('Process bet result error:', error);
      throw error;
    }
  }

  // Get user transactions
  static async getTransactions(userId: string, page: number = 1, limit: number = 10) {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/${userId}?page=${page}&limit=${limit}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get transactions');
      }

      return data;
    } catch (error) {
      console.error('Get transactions error:', error);
      throw error;
    }
  }

  // Get user bets
  static async getBets(userId: string, page: number = 1, limit: number = 10) {
    try {
      const response = await fetch(`${API_BASE_URL}/bets/${userId}?page=${page}&limit=${limit}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get bets');
      }

      return data;
    } catch (error) {
      console.error('Get bets error:', error);
      throw error;
    }
  }

  // Get game statistics
  static async getGameStats(userId: string, gameType: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/stats/${userId}/${gameType}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get game stats');
      }

      return data;
    } catch (error) {
      console.error('Get game stats error:', error);
      throw error;
    }
  }

  // Create transaction
  static async createTransaction(userId: string, type: string, amount: number, description: string, metadata: any = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          type,
          amount,
          description,
          metadata
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create transaction');
      }

      return data;
    } catch (error) {
      console.error('Create transaction error:', error);
      throw error;
    }
  }

  // Check server health
  static async checkHealth() {
    try {
      const response = await fetch('http://localhost:3001/health');
      const data = await response.json();
      return data.status === 'OK';
    } catch (error) {
      console.error('Health check error:', error);
      return false;
    }
  }
}
