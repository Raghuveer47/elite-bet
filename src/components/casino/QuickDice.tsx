import React, { useMemo, useState } from 'react';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Crown } from 'lucide-react';
import { Button } from '../ui/Button';
import { useCasinoGame } from '../../hooks/useCasinoGame';
import { formatCurrency } from '../../lib/utils';
import { useWallet } from '../../contexts/SupabaseWalletContext';
import { useCasinoSocket } from '../../contexts/SocketContext';
import toast from 'react-hot-toast';

interface QuickDiceProps {
  gameId: string;
  gameName: string;
}

const diceIconByValue: Record<number, JSX.Element> = {
  1: <Dice1 className="w-10 h-10" />, 2: <Dice2 className="w-10 h-10" />, 3: <Dice3 className="w-10 h-10" />,
  4: <Dice4 className="w-10 h-10" />, 5: <Dice5 className="w-10 h-10" />, 6: <Dice6 className="w-10 h-10" />
};

export function QuickDice({ gameId, gameName }: QuickDiceProps) {
  const { session, isPlaying, setIsPlaying, placeBet, addWinnings, resetSession } = useCasinoGame(gameId);
  const { getAvailableBalance } = useWallet();
  const { socket, isConnected } = useCasinoSocket();

  const [selected, setSelected] = useState<number | null>(null);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const balance = getAvailableBalance();

  const betAmount = 100; // flat demo chip
  const canPlay = useMemo(() => !isPlaying && selected !== null && balance >= betAmount, [isPlaying, selected, balance]);

  const roll = async () => {
    if (selected === null) {
      toast.error('Pick a number (1-6)');
      return;
    }
    if (balance < betAmount) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      setIsPlaying(true);
      setRolling(true);
      await placeBet(betAmount); // instant local deduction; backend sync runs in background

      if (isConnected && socket) {
        // Server-authoritative roll
        await new Promise<void>((resolve) => {
          const onResult = async (data: any) => {
            try {
              setLastRoll(data.roll);
              setRolling(false);
              if (data.win && data.win > 0) {
                await addWinnings(data.win);
                toast.success(`🎉 ${gameName}: You rolled ${data.roll} and WON +${formatCurrency(data.win)}!`);
              } else {
                toast.error(`😔 ${gameName}: Rolled ${data.roll}. Better luck next time!`);
              }
            } finally {
              socket.off('dice:result', onResult);
              resolve();
            }
          };
          socket.on('dice:result', onResult);
          socket.emit('dice:play', { userId: session.id, amount: betAmount, choice: selected, gameId, gameName });
        });
      } else {
        // Local fallback RNG
        const rollValue = (() => {
          try {
            const arr = new Uint32Array(1);
            window.crypto.getRandomValues(arr);
            return (arr[0] % 6) + 1;
          } catch {
            return Math.floor(Math.random() * 6) + 1;
          }
        })();
        await new Promise(r => setTimeout(r, 350));
        setLastRoll(rollValue);
        setRolling(false);
        if (rollValue === selected) {
          const win = betAmount * 5;
          await addWinnings(win);
          toast.success(`🎉 ${gameName}: You rolled ${rollValue} and WON +${formatCurrency(win)}!`);
        } else {
          toast.error(`😔 ${gameName}: Rolled ${rollValue}. Better luck next time!`);
        }
      }
    } catch (e) {
      toast.error('Could not play — please try again');
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-800 via-slate-900 to-black rounded-3xl p-8 border-2 border-purple-500/30 shadow-2xl">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-3">
          <Crown className="w-6 h-6 text-yellow-400" />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">{gameName}</h2>
          <Crown className="w-6 h-6 text-yellow-400" />
        </div>
        <p className="text-slate-400 mt-2">Balance: <span className="text-green-400 font-bold">{formatCurrency(balance)}</span></p>
      </div>

      <div className="grid grid-cols-6 gap-3 mb-8">
        {[1,2,3,4,5,6].map(v => (
          <button
            key={v}
            onClick={() => setSelected(v)}
            disabled={isPlaying}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 shadow-xl transition-all ${
              selected === v ? 'border-yellow-400 ring-4 ring-yellow-300/40 bg-slate-800' : 'border-slate-600 hover:border-slate-500 bg-slate-900'
            }`}
          >
            <div className="text-white">{diceIconByValue[v]}</div>
            <span className="text-slate-300 mt-2 font-semibold">{v}</span>
          </button>
        ))}
      </div>

      <div className="text-center mb-6">
        <p className="text-slate-300">Bet Amount: <span className="text-blue-400 font-bold">{formatCurrency(betAmount)}</span> • Pays <span className="text-yellow-300 font-bold">5:1</span></p>
      </div>

      <div className="flex items-center justify-center space-x-4">
        <Button onClick={roll} disabled={!canPlay} className="px-10 py-5 text-xl font-bold">
          {rolling ? 'Rolling…' : 'Roll Dice'}
        </Button>
        <Button variant="outline" onClick={resetSession} disabled={isPlaying}>Reset</Button>
      </div>

      {lastRoll !== null && (
        <div className="text-center mt-8">
          <div className="inline-flex items-center space-x-3 px-5 py-3 rounded-2xl border-2 border-slate-600 bg-slate-800/50">
            <span className="text-slate-300">Last roll:</span>
            <span className="text-white">{diceIconByValue[lastRoll]}</span>
            <span className="text-slate-200 font-bold">{lastRoll}</span>
          </div>
        </div>
      )}

      <div className="text-center text-slate-400 text-sm mt-6">
        This game settles instantly. Wallet syncs to backend in the background.
      </div>
    </div>
  );
}


