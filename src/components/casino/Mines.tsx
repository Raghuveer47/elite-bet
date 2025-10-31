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
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-slate-300">Bet (₹)</label>
          <input
            type="number"
            min={10}
            step={10}
            value={betAmount}
            disabled={status === 'playing'}
            onChange={(e) => setBetAmount(Math.max(10, Number(e.target.value) || 10))}
            className="w-28 rounded bg-slate-800 border border-slate-700 px-3 py-2 text-white"
          />
          <div className="flex gap-2">
            {[10, 50, 100, 500, 1000].map(v => (
              <button key={v} onClick={() => status !== 'playing' && setBetAmount(v)} className={`px-3 py-1 rounded border ${betAmount === v ? 'border-yellow-400 text-yellow-300' : 'border-slate-600 text-slate-300'}`}>₹{v}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-slate-300">Mines</label>
          <input
            type="number"
            min={1}
            max={24}
            value={minesCount}
            disabled={status === 'playing'}
            onChange={(e) => setMinesCount(Math.min(24, Math.max(1, Number(e.target.value) || 1)))}
            className="w-20 rounded bg-slate-800 border border-slate-700 px-3 py-2 text-white"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-slate-300">Mult: <span className="font-bold text-green-400">{currentMultiplier.toFixed(2)}x</span></div>
          <div className="text-slate-300">Payout: <span className="font-bold text-green-400">₹{potentialPayout.toLocaleString('en-IN')}</span></div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {status !== 'playing' ? (
          <button onClick={startRound} disabled={betAmount > balance} className="px-5 py-3 rounded bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-60">Start</button>
        ) : (
          <>
            <button onClick={cashOut} className="px-5 py-3 rounded bg-yellow-500 hover:bg-yellow-400 text-black font-semibold">Cash Out ₹{potentialPayout.toLocaleString('en-IN')}</button>
            <button onClick={reset} className="px-4 py-3 rounded border border-slate-600 text-slate-300">Give Up</button>
          </>
        )}
        <div className={`ml-auto px-3 py-1 rounded text-sm ${status==='playing'?'bg-blue-500/20 text-blue-300':status==='busted'?'bg-red-500/20 text-red-300':status==='cashed'?'bg-green-500/20 text-green-300':'bg-slate-700 text-slate-300'}`}>{status.toUpperCase()}</div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`, gap: 10 }}>
        {Array.from({ length: TOTAL_CELLS }, (_, idx) => {
          const isRevealed = revealed.has(idx) || (status !== 'playing' && mines.has(idx));
          const isMine = mines.has(idx);
          const cellState: CellState = isRevealed ? (isMine ? 'mine' : 'gem') : 'hidden';
          return (
            <button
              key={idx}
              onClick={() => reveal(idx)}
              disabled={status !== 'playing'}
              className={`aspect-square rounded-xl border flex items-center justify-center text-xl font-bold select-none transition-transform duration-150 ${
                cellState==='hidden' ? 'bg-slate-800 hover:bg-slate-700 border-slate-700' :
                cellState==='gem' ? 'bg-emerald-600/80 border-emerald-400 text-white' :
                'bg-rose-700/80 border-rose-400 text-white'
              }`}
            >
              <span className={`${cellState==='hidden' ? '' : 'text-3xl sm:text-4xl'}`}>
                {cellState==='gem' ? '💎' : cellState==='mine' ? '💣' : ''}
              </span>
            </button>
          );
        })}
      </div>

      {(status==='busted' || status==='cashed') && (
        <div className="flex items-center gap-3">
          <button onClick={reset} className="px-5 py-3 rounded bg-slate-700 hover:bg-slate-600 text-white">New Round</button>
        </div>
      )}
    </div>
  );
}


