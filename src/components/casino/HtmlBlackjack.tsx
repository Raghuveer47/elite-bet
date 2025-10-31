import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { useCasinoGame } from '../../hooks/useCasinoGame';
import { useWallet } from '../../contexts/SupabaseWalletContext';
import { formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';

interface HtmlBlackjackProps {
  gameId: string;
  gameName: string;
}

type ResultMessage = {
  type: 'result';
  outcome: 'win' | 'loss' | 'push';
  payout?: number; // positive payout on win or returned stake on push
};

export function HtmlBlackjack({ gameId, gameName }: HtmlBlackjackProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const { getAvailableBalance } = useWallet();
  const { session, isPlaying, setIsPlaying, placeBet, addWinnings, markLoss } = useCasinoGame(gameId);

  const [betAmount] = useState(100); // Flat demo bet
  const [status, setStatus] = useState<string>('Place your bet and start the round');
  const [childReady, setChildReady] = useState(false);

  const onMessage = useCallback(async (ev: MessageEvent) => {
    // Same origin expected; still guard
    if (!ev?.data || typeof ev.data !== 'object') return;
    const data = ev.data as any;
    if (data.type === 'ready') {
      setChildReady(true);
      return;
    }
    if (data.type === 'startRequest') {
      // Chips are already deducted via chipRequest; just start the round
      const requested = Number(data.bet) || 0;
      iframeRef.current?.contentWindow?.postMessage({ type: 'start', bet: requested }, '*');
      setIsPlaying(true);
      setStatus('Round in progress…');
      return;
    }
    if (data.type === 'chipRequest') {
      const amount = Number(data.amount) || 0;
      if (amount <= 0) return;
      const balance = getAvailableBalance();
      if (balance < amount) {
        iframeRef.current?.contentWindow?.postMessage({ type: 'chipRejected', amount }, '*');
        toast.error('Insufficient balance');
        return;
      }
      try {
        await placeBet(amount);
        iframeRef.current?.contentWindow?.postMessage({ type: 'chipAccepted', amount }, '*');
      } catch {
        iframeRef.current?.contentWindow?.postMessage({ type: 'chipRejected', amount }, '*');
      }
      return;
    }
    if (data.type === 'result') {
      const msg = data as ResultMessage;
      try {
        if (msg.outcome === 'win' && (msg.payout || 0) > 0) {
          await addWinnings(msg.payout || 0);
          toast.success(`🎉 ${gameName}: +${formatCurrency(msg.payout || 0)}`);
        } else if (msg.outcome === 'push') {
          // Return stake on push
          await addWinnings(betAmount);
          toast(`Push – stake returned (${formatCurrency(betAmount)})`);
        } else {
          await markLoss();
          toast.error('Hand lost');
        }
      } finally {
        setStatus('Round complete');
        setIsPlaying(false);
      }
    }
  }, [addWinnings, betAmount, gameName, markLoss, setIsPlaying]);

  useEffect(() => {
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onMessage]);

  // Sync wallet balance into the iframe whenever it reports ready or our balance changes
  useEffect(() => {
    if (!childReady) return;
    try {
      iframeRef.current?.contentWindow?.postMessage({ type: 'setBalance', balance: session.balance }, '*');
    } catch {}
  }, [childReady, session.balance]);

  const startRound = async () => {
    const balance = getAvailableBalance();
    if (balance < betAmount) {
      toast.error('Insufficient balance');
      return;
    }
    try {
      setIsPlaying(true);
      setStatus('Starting round…');
      await placeBet(betAmount);
      // Tell child game to start with our bet (child should listen to this message)
      iframeRef.current?.contentWindow?.postMessage({ type: 'start', bet: betAmount }, '*');
      setStatus('Round in progress…');
    } catch (e) {
      setIsPlaying(false);
      toast.error('Could not start round');
    }
  };

  return (
    <div className="rounded-2xl border-2 border-slate-700 overflow-hidden bg-slate-900">
      <div className="p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{gameName}</h2>
          <p className="text-slate-400 text-sm">Balance: <span className="text-green-400 font-bold">{formatCurrency(session.balance)}</span></p>
          <p className="text-slate-400 text-sm">Status: {status}{childReady ? '' : ' (loading game…)'}
          </p>
        </div>
        {/* Start button removed – round starts from inside the game after chips are approved */}
      </div>
      <div className="h-[70vh] bg-black relative">
        {/* Overlay our wallet balance so we don't rely on game's internal banner */}
        <div className="absolute top-3 left-4 z-10 bg-black/70 text-white px-3 py-1 rounded-lg border border-white/20 pointer-events-none">
          Wallet: <span className="text-green-400 font-bold">{formatCurrency(session.balance)}</span>
        </div>
        <iframe
          ref={iframeRef}
          src="/games/Blackjack/index.html"
          className="w-full h-full border-0"
        />
      </div>
      <div className="text-center text-slate-400 text-xs py-2">Game runs in an iframe; wallet settles via bridge events.</div>
    </div>
  );
}


