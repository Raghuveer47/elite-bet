import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useWallet } from '../contexts/SupabaseWalletContext';
import { GameSession } from '../types/casino';

export function useCasinoGame(gameId: string, initialBalance?: number) {
  const { user } = useAuth();
  const { getBalance, processBet, processWin, validateBalance } = useWallet();
  
  const [session, setSession] = useState<GameSession>({
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    gameId,
    balance: getBalance(), // Get current balance
    totalWagered: 0,
    totalWon: 0,
    spinsPlayed: 0,
    startTime: new Date()
  });

  const [isPlaying, setIsPlaying] = useState(false);

  const placeBet = useCallback(async (betAmount: number) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!validateBalance(betAmount)) {
      throw new Error('Insufficient balance');
    }

    console.log('useCasinoGame: Placing bet:', { gameId, userId: user.id, amount: betAmount });

    try {
      // Process bet through wallet context (for UI updates)
      await processBet(betAmount, `Casino Game - ${gameId}`, `${gameId} - Bet placed`, {
        gameId,
        sessionId: session.id,
        betAmount
      });
      
      // Update session stats
      setSession(prev => ({
        ...prev,
        balance: getBalance() - betAmount, // Get current balance
        totalWagered: prev.totalWagered + betAmount,
        spinsPlayed: prev.spinsPlayed + 1
      }));

      console.log('useCasinoGame: Bet placed successfully');
      return { bet: { id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` } };
    } catch (error) {
      console.error('useCasinoGame: Failed to place bet:', error);
      throw error;
    }
  }, [user, gameId, session.id, getBalance, validateBalance, processBet]);

  const addWinnings = useCallback(async (winAmount: number, betId?: string) => {
    if (!user || winAmount <= 0) return;

    console.log('useCasinoGame: Adding winnings:', { gameId, userId: user.id, amount: winAmount });

    try {
      // Process win through wallet context (for UI updates)
      await processWin(winAmount, `Casino Game - ${gameId}`, `${gameId} - Win awarded`, {
        gameId,
        sessionId: session.id,
        winAmount,
        betId
      });
      
      // Update session stats
      setSession(prev => ({
        ...prev,
        balance: getBalance() + winAmount, // Get current balance
        totalWon: prev.totalWon + winAmount
      }));

      console.log('useCasinoGame: Winnings added successfully');
    } catch (error) {
      console.error('useCasinoGame: Failed to add winnings:', error);
      throw error;
    }
  }, [user, gameId, session.id, getBalance, processWin]);

  const resetSession = useCallback(() => {
    console.log('useCasinoGame: Resetting session for game:', gameId);
    
    setSession(prev => ({
      ...prev,
      totalWagered: 0,
      totalWon: 0,
      spinsPlayed: 0,
      startTime: new Date()
    }));
  }, [gameId]);

  return {
    session: { ...session, balance: getBalance() }, // Get current balance
    isPlaying,
    setIsPlaying,
    placeBet,
    addWinnings,
    resetSession
  };
}