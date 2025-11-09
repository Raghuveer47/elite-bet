import React, { useCallback, useMemo, useState } from 'react';
import { useWallet } from '../../contexts/SupabaseWalletContext';

type CellState = 'hidden' | 'gem' | 'mine';

const GRID_SIZE = 5; // 5x5 = 25 tiles like Stake
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE; // 25

function chooseMines(count: number): Set<number> {
  const picks = new Set<number>();
  while (picks.size < count) {
    picks.add(Math.floor(Math.random() * TOTAL_CELLS));
  }
  return picks;
}

function cumulativeMultiplier(mines: number, safeRevealed: number): number {
  // True fair odds multiplier without house edge:
  // product_{i=0..r-1} (25 - i) / (25 - mines - i) = C(25, r)/C(25-mines, r)
  // Compute in a numerically stable way
  let num = 1;
  let den = 1;
  for (let i = 0; i < safeRevealed; i++) {
    num *= (TOTAL_CELLS - i);
    den *= (TOTAL_CELLS - mines - i);
  }
  return num / den;
}

export default function Mines({ gameId = 'mines', gameName = 'Mines' }: { gameId?: string; gameName?: string }) {
  const { processBet, processWin, processLoss, getBalance } = useWallet();
  const [betAmount, setBetAmount] = useState<number>(100);
  const [minesCount, setMinesCount] = useState<number>(3);
  const [mines, setMines] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState<'idle' | 'playing' | 'busted' | 'cashed'>('idle');
  const [betId, setBetId] = useState<string | undefined>(undefined);

  const balance = getBalance('INR');

  const currentMultiplier = useMemo(() => cumulativeMultiplier(minesCount, revealed.size || 0), [minesCount, revealed.size]);
  const potentialPayout = useMemo(() => Math.floor(betAmount * currentMultiplier), [betAmount, currentMultiplier]);

  const startRound = async () => {
    if (status === 'playing') return;
    if (betAmount <= 0 || betAmount > balance) return;
    const { betId } = (await processBet(betAmount, 'mines', `${gameName} - Start`, {
      gameId,
      gameName,
      minesCount,
    })) as { betId?: string };
    setBetId(betId);
    setMines(chooseMines(minesCount));
    setRevealed(new Set());
    setStatus('playing');
  };

  const reveal = useCallback(async (idx: number) => {
    if (status !== 'playing') return;
    if (revealed.has(idx)) return;
    if (mines.has(idx)) {
      // Hit a mine - lose
      setStatus('busted');
      // notify backend
      if (betId) await processLoss(betId, 'mines', { gameId, minesCount });
      return;
    }
    const next = new Set(revealed);
    next.add(idx);
    setRevealed(next);
  }, [status, revealed, mines, betId, processLoss, gameId, minesCount]);

  const cashOut = useCallback(async () => {
    if (status !== 'playing') return;
    const payout = potentialPayout; // bet * multiplier
    await processWin(payout, 'mines', `${gameName} - Cash out`, { gameId, betId, minesCount, revealed: Array.from(revealed) });
    setStatus('cashed');
  }, [status, potentialPayout, processWin, gameName, gameId, betId, minesCount, revealed]);

  const reset = () => {
    setStatus('idle');
    setBetId(undefined);
    setMines(new Set());
    setRevealed(new Set());
  };

  return (
    <div className="w-full max-w-full sm:max-w-[600px] md:max-w-3xl mx-auto flex flex-col gap-3 sm:gap-4 md:gap-6 p-2 sm:p-4 md:p-6 bg-gradient-to-b from-slate-800 via-emerald-900/20 to-slate-900 rounded-none sm:rounded-2xl border-0 sm:border-2 border-emerald-500/30 shadow-2xl">
      {/* Game Title */}
      <div className="text-center mb-2 sm:mb-3 md:mb-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 bg-clip-text text-transparent mb-1 sm:mb-2">
          💎 {gameName} 💎
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">Find the diamonds, avoid the mines!</p>
      </div>

      {/* Balance & Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className="bg-slate-800/50 rounded-lg p-2 sm:p-3 text-center">
          <p className="text-[10px] sm:text-xs text-slate-400">Balance</p>
          <p className="text-sm sm:text-base md:text-lg font-bold text-green-400">₹{balance.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-2 sm:p-3 text-center">
          <p className="text-[10px] sm:text-xs text-slate-400">Multiplier</p>
          <p className="text-sm sm:text-base md:text-lg font-bold text-yellow-400">{currentMultiplier.toFixed(2)}x</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-2 sm:p-3 text-center col-span-2 sm:col-span-1">
          <p className="text-[10px] sm:text-xs text-slate-400">Potential Win</p>
          <p className="text-sm sm:text-base md:text-lg font-bold text-emerald-400">₹{potentialPayout.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Bet Controls */}
      <div className="bg-gradient-to-r from-slate-800 via-emerald-800/20 to-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-emerald-500/30">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Bet Amount */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-emerald-400 mb-2">Bet Amount (₹)</label>
          <input
            type="number"
            min={10}
            step={10}
            value={betAmount}
            disabled={status === 'playing'}
            onChange={(e) => setBetAmount(Math.max(10, Number(e.target.value) || 10))}
              className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-white text-center font-bold"
          />
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
            {[10, 50, 100, 500, 1000].map(v => (
                <button 
                  key={v} 
                  onClick={() => status !== 'playing' && setBetAmount(v)} 
                  className={`flex-1 min-w-[50px] px-2 py-1 text-xs sm:text-sm rounded border transition-all ${betAmount === v ? 'border-yellow-400 bg-yellow-400/10 text-yellow-300 font-bold' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}`}
                >
                  ₹{v}
                </button>
            ))}
          </div>
        </div>

          {/* Mines Count */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-red-400 mb-2">Number of Mines</label>
          <input
            type="number"
            min={1}
            max={24}
            value={minesCount}
            disabled={status === 'playing'}
            onChange={(e) => setMinesCount(Math.min(24, Math.max(1, Number(e.target.value) || 1)))}
              className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-white text-center font-bold"
          />
            <p className="text-[10px] sm:text-xs text-slate-400 mt-2">Higher mines = Higher multiplier</p>
        </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
        {status !== 'playing' ? (
          <button 
            onClick={startRound} 
            disabled={betAmount > balance} 
            className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-sm sm:text-base md:text-lg disabled:opacity-60 shadow-xl transform active:scale-95 sm:hover:scale-105 transition-all"
          >
            🎮 START GAME
          </button>
        ) : (
          <>
            <button 
              onClick={cashOut} 
              className="w-full sm:flex-1 px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold text-sm sm:text-base md:text-lg shadow-xl transform active:scale-95 sm:hover:scale-105 transition-all"
            >
              💰 CASH OUT ₹{potentialPayout.toLocaleString('en-IN')}
            </button>
            <button 
              onClick={reset} 
              className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-4 rounded-lg border-2 border-slate-600 text-slate-300 hover:bg-slate-700 font-bold text-sm sm:text-base"
            >
              Give Up
            </button>
          </>
        )}
        <div className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-bold ${status==='playing'?'bg-blue-500/20 text-blue-300 border border-blue-500/30':status==='busted'?'bg-red-500/20 text-red-300 border border-red-500/30':status==='cashed'?'bg-green-500/20 text-green-300 border border-green-500/30':'bg-slate-700 text-slate-300'}`}>
          {status.toUpperCase()}
        </div>
      </div>

      {/* Mine Grid */}
      <div className="bg-slate-900/50 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border border-emerald-500/30">
        <div className="grid gap-1.5 sm:gap-2 md:gap-3" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}>
        {Array.from({ length: TOTAL_CELLS }, (_, idx) => {
          const isRevealed = revealed.has(idx) || (status !== 'playing' && mines.has(idx));
          const isMine = mines.has(idx);
          const cellState: CellState = isRevealed ? (isMine ? 'mine' : 'gem') : 'hidden';
          return (
            <button
              key={idx}
              onClick={() => reveal(idx)}
              disabled={status !== 'playing'}
                className={`aspect-square rounded-lg sm:rounded-xl border-2 flex items-center justify-center font-bold select-none transition-all duration-200 transform active:scale-95 sm:hover:scale-105 ${
                  cellState==='hidden' ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-slate-600 shadow-lg' :
                  cellState==='gem' ? 'bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-400 text-white shadow-xl shadow-emerald-500/50 animate-pulse' :
                  'bg-gradient-to-br from-rose-600 to-red-700 border-rose-400 text-white shadow-xl shadow-red-500/50 animate-pulse'
              }`}
            >
                <span className={`${cellState==='hidden' ? 'text-slate-600' : 'text-2xl sm:text-3xl md:text-4xl'}`}>
                  {cellState==='gem' ? '💎' : cellState==='mine' ? '💣' : '?'}
              </span>
            </button>
          );
        })}
        </div>
      </div>

      {/* Result Actions */}
      {(status==='busted' || status==='cashed') && (
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          {status === 'busted' ? (
            <div className="w-full bg-red-900/30 border border-red-500/50 rounded-lg p-3 sm:p-4 text-center">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-400 mb-1">💥 BUSTED!</p>
              <p className="text-xs sm:text-sm text-slate-300">You hit a mine!</p>
            </div>
          ) : (
            <div className="w-full bg-green-900/30 border border-green-500/50 rounded-lg p-3 sm:p-4 text-center">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-400 mb-1">🎉 WINNER!</p>
              <p className="text-xs sm:text-sm text-slate-300">You cashed out ₹{potentialPayout.toLocaleString('en-IN')}</p>
            </div>
          )}
          <button 
            onClick={reset} 
            className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-lg sm:rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm sm:text-base shadow-lg"
          >
            🔄 New Round
          </button>
        </div>
      )}
    </div>
  );
}


