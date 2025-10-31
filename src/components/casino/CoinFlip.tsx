import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Coins, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useCasinoGame } from '../../hooks/useCasinoGame';
import { useCasinoSocket } from '../../contexts/SocketContext';
import { formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';

const gameId = 'coin-flip';

function getClientSeed() {
  const arr = new Uint32Array(4);
  window.crypto.getRandomValues(arr);
  return Array.from(arr).map(n => n.toString(16).padStart(8, '0')).join('');
}

export default function CoinFlip() {
  const { user } = useAuth();
  const { socket, isConnected, sendCoinBet } = useCasinoSocket();
  const { session, placeBet, addWinnings, markLoss, setIsPlaying } = useCasinoGame(gameId);

  const [choice, setChoice] = useState<'heads'|'tails'>('heads');
  const [bet, setBet] = useState<number>(100);
  const [flipping, setFlipping] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [result, setResult] = useState<'heads'|'tails'|null>(null);
  const animRef = useRef<number | null>(null);

  const canPlay = !!user && bet > 0 && session.balance >= bet && !flipping;

  // Flush any pending result saved earlier
  useEffect(() => {
    const key = `elitebet_pending_slot_result_${gameId}`;
    const raw = sessionStorage.getItem(key);
    if (!raw) return;
    try {
      const pending = JSON.parse(raw) as { winAmount?: number; lossAmount?: number };
      (async () => {
        try {
          if (pending.winAmount) await addWinnings(pending.winAmount);
          else if (pending.lossAmount) await markLoss();
        } finally {
          sessionStorage.removeItem(key);
        }
      })();
    } catch {}
  }, [addWinnings, markLoss]);

  const startAnimation = () => {
    setFlipping(true);
    setResult(null);
  };
  const endAnimation = () => {
    setFlipping(false);
  };

  const doLocalOutcome = () => {
    const rand = new Uint32Array(1);
    window.crypto.getRandomValues(rand);
    return (rand[0] % 2 === 0) ? 'heads' : 'tails';
  };

  const handleFlip = async () => {
    if (!user) { toast.error('Login required'); return; }
    if (bet <= 0 || bet > session.balance) { toast.error('Insufficient balance'); return; }

    try {
      setIsPlaying(true);
      await placeBet(bet); // deduct immediately
    } catch (e:any) {
      toast.error(e?.message || 'Bet failed');
      setIsPlaying(false);
      return;
    }

    startAnimation();

    const clientSeed = getClientSeed();
    let settled = false;

    const settle = async (outcome: 'heads'|'tails') => {
      if (settled) return; settled = true;
      setResult(outcome);
      const isWin = outcome === choice;
      const winAmount = isWin ? bet * 2 : 0;
      try {
        if (isWin) {
          await addWinnings(winAmount);
          setLastWin(winAmount);
          toast.success(`You won ${formatCurrency(winAmount)}`);
        } else {
          await markLoss();
          setLastWin(0);
          toast.error(`You lost ${formatCurrency(bet)}`);
        }
      } catch {
        try {
          const key = `elitebet_pending_slot_result_${gameId}`;
          sessionStorage.setItem(key, JSON.stringify(isWin ? { winAmount } : { lossAmount: bet }));
        } catch {}
      } finally {
        endAnimation();
        setIsPlaying(false);
      }
    };

    // Socket path
    if (isConnected && socket) {
      try {
        sendCoinBet({ userId: user.id, amount: bet, currency: user.currency || 'INR', choice, gameId, clientSeed });
        const onResult = (data: any) => {
          if (!data || data.gameId !== gameId) return;
          settle(data.outcome === 'heads' ? 'heads' : 'tails');
          socket.off('coin:result', onResult);
        };
        socket.on('coin:result', onResult);
        // Safety: if no socket result in 2s, use local outcome
        setTimeout(() => settle(doLocalOutcome()), 2000);
        return;
      } catch {}
    }

    // Fallback: local outcome after 1.2s
    setTimeout(() => settle(doLocalOutcome()), 1200);
  };

  return (
    <div className="max-w-[900px] mx-auto w-full p-4 md:p-8">
      <div className="text-center mb-6">
        <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">Coin Flip</h2>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-slate-400">Balance</p>
            <p className="text-green-400 font-bold text-xl">{formatCurrency(session.balance)}</p>
          </div>
          <div>
            <p className="text-slate-400">Last Win</p>
            <p className="text-yellow-400 font-bold text-xl">{formatCurrency(lastWin)}</p>
          </div>
          <div>
            <p className="text-slate-400">Choice</p>
            <p className="text-purple-400 font-bold text-xl capitalize">{choice}</p>
          </div>
        </div>
      </div>

      {/* Coin */}
      <div className="flex items-center justify-center my-8">
        <div className={`w-28 h-28 md:w-40 md:h-40 rounded-full border-4 ${result ? (result==='heads'?'border-green-400':'border-red-400') : 'border-slate-500'} bg-gradient-to-br from-slate-700 to-slate-900 shadow-2xl flex items-center justify-center transition-all duration-300 ${flipping ? 'animate-spin' : ''}`}>
          <span className="text-3xl md:text-5xl">{result ? (result==='heads'?'🪙':'🎰') : '🪙'}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gradient-to-r from-slate-800 via-purple-800/30 to-slate-800 rounded-2xl p-6 border-2 border-purple-500/30 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bet */}
          <div className="text-center">
            <label className="block text-lg font-bold text-purple-300 mb-2">Bet</label>
            <div className="flex items-center space-x-3 justify-center">
              <Button variant="outline" size="sm" onClick={() => setBet(10)} disabled={flipping}>Min</Button>
              <div className="flex items-center space-x-3">
                <Coins className="w-6 h-6 text-yellow-400" />
                <Input type="number" value={bet} onChange={e => setBet(Math.max(1, parseInt(e.target.value)||1))} className="text-center text-xl font-bold w-28" min={1} disabled={flipping} />
              </div>
              <Button variant="outline" size="sm" onClick={() => setBet(Math.max(1, Math.floor(session.balance)))} disabled={flipping}>Max</Button>
            </div>
            <p className="text-sm text-slate-400 mt-2">Total: <span className="font-bold text-white">{formatCurrency(bet)}</span></p>
          </div>

          {/* Choice */}
          <div className="text-center">
            <label className="block text-lg font-bold text-blue-300 mb-2">Choose</label>
            <div className="flex items-center justify-center space-x-3">
              <Button variant={choice==='heads'?undefined:'outline'} onClick={() => setChoice('heads')} disabled={flipping}>Heads</Button>
              <Button variant={choice==='tails'?undefined:'outline'} onClick={() => setChoice('tails')} disabled={flipping}>Tails</Button>
            </div>
          </div>

          {/* Actions */}
          <div className="text-center">
            <label className="block text-lg font-bold text-green-300 mb-2">Actions</label>
            <div className="flex items-center justify-center space-x-3">
              <Button onClick={handleFlip} disabled={!canPlay} className="px-8 py-4 text-xl font-bold">
                {flipping ? (
                  <div className="flex items-center space-x-2"><div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div><span>FLIPPING...</span></div>
                ) : (
                  <><Play className="w-6 h-6 mr-2" /> Flip {formatCurrency(bet)}</>
                )}
              </Button>
              <Button variant="outline" onClick={() => { setBet(100); setChoice('heads'); setResult(null); setLastWin(0); }} disabled={flipping}>
                <RotateCcw className="w-5 h-5 mr-2" /> Reset
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



