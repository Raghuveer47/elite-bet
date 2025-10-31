import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useWallet } from '../contexts/SupabaseWalletContext';
import { GameSession } from '../types/casino';

export function useCasinoGame(gameId: string, initialBalance?: number) {
  const { user } = useAuth();
  const { getBalance, processBet, processWin, processLoss, validateBalance } = useWallet();
  
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
  const [lastBetId, setLastBetId] = useState<string | undefined>(undefined);
  const apiBase = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:3001/api/betting';

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
      const betResp = await processBet(betAmount, `Casino Game - ${gameId}`, `${gameId} - Bet placed`, {
        gameId,
        sessionId: session.id,
        betAmount
      });
      if (betResp && 'betId' in betResp && betResp.betId) {
        setLastBetId(betResp.betId);
      }
      
      // Also record bet in backend only if we didn't get a betId from processBet (avoid double-POST)
      if (!('betId' in (betResp || {})) || !betResp?.betId) {
        try {
          console.log('useCasinoGame: MIRROR /casino/bet', {
            url: `${apiBase}/casino/bet`,
            userId: user.id,
            amount: Number(betAmount),
            gameId,
            gameType: gameId.toLowerCase().includes('slot') ? 'slots' : 'casino'
          });
          const res = await fetch(`${apiBase}/casino/bet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              amount: Number(betAmount),
              currency: 'INR',
              gameId,
              gameType: gameId.toLowerCase().includes('slot') ? 'slots' : 'casino',
              description: `${gameId} - Bet placed`,
              metadata: { sessionId: session.id, details: { email: (user as any)?.email || `user_${user.id}@example.com` } }
            })
          });
          const data = await res.json().catch(() => ({}));
          if (data?.success && data?.bet?.id) {
            setLastBetId(data.bet.id);
          }
        } catch {}
      }

      // Update session stats
      setSession(prev => ({
        ...prev,
        balance: getBalance() - betAmount, // Get current balance
        totalWagered: prev.totalWagered + betAmount,
        spinsPlayed: prev.spinsPlayed + 1
      }));

      console.log('useCasinoGame: Bet placed successfully');
      return { betId: (betResp && 'betId' in betResp) ? betResp?.betId : undefined };
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
        betId: betId || lastBetId
      });
      
      // Update session stats
      setSession(prev => ({
        ...prev,
        balance: getBalance() + winAmount, // Get current balance
        totalWon: prev.totalWon + winAmount
      }));

      // Mirror to backend ledger
      try {
        await fetch(`${apiBase}/casino/win`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            amount: winAmount,
            currency: 'INR',
            gameId,
            gameType: gameId.toLowerCase().includes('slot') ? 'slots' : 'casino',
            betId: betId || lastBetId,
            metadata: { sessionId: session.id, details: { email: (user as any)?.email || `user_${user.id}@example.com` } }
          })
        });
      } catch {}

      console.log('useCasinoGame: Winnings added successfully');
    } catch (error) {
      console.error('useCasinoGame: Failed to add winnings:', error);
      throw error;
    }
  }, [user, gameId, session.id, getBalance, processWin, lastBetId]);

  const markLoss = useCallback(async (betId?: string) => {
    if (!user) return;
    try {
      await processLoss(betId || lastBetId || '', `Casino Game - ${gameId}`, { gameId, sessionId: session.id });
    } catch {}
    // Mirror to backend ledger only if we have a betId
    try {
      const finalBetId = betId || lastBetId;
      if (finalBetId) {
        await fetch(`${apiBase}/casino/loss`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, betId: finalBetId, gameId, gameType: gameId.toLowerCase().includes('slot') ? 'slots' : 'casino', metadata: { sessionId: session.id } })
        });
      }
    } catch {}
  }, [user, gameId, session.id, processLoss, lastBetId]);

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
    markLoss,
    resetSession
  };
}