import React, { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { useCasinoGame } from '../../hooks/useCasinoGame';
import { useWallet } from '../../contexts/SupabaseWalletContext';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';

interface ReactBlackjackProps {
  gameId: string;
  gameName: string;
}

type Card = { suit: '♥'|'♦'|'♣'|'♠'; value: string };

const suits: Card['suit'][] = ['♥','♦','♣','♠'];
const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

function createDeck(): Card[] {
  const d: Card[] = [];
  for (const s of suits) for (const r of ranks) d.push({ suit: s, value: r });
  // shuffle
  for (let i=d.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [d[i],d[j]]=[d[j],d[i]]; }
  return d;
}

function fromApiCard(api: any): Card {
  const suit: Card['suit'] = api?.suit === 'HEARTS' ? '♥' : api?.suit === 'DIAMONDS' ? '♦' : api?.suit === 'CLUBS' ? '♣' : '♠';
  const map: Record<string,string> = { ACE: 'A', KING: 'K', QUEEN: 'Q', JACK: 'J' };
  const raw = String(api?.value ?? '').toUpperCase();
  const value = map[raw] || raw; // keep numbers like '10','9', etc.
  return { suit, value };
}

function score(hand: Card[]): number {
  let total = 0; let aces = 0;
  for (const c of hand) {
    if (c.value === 'A') { total += 11; aces++; }
    else if (['K','Q','J'].includes(c.value)) total += 10;
    else total += parseInt(c.value, 10);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

const chips = [5,25,50,100,500];

export function ReactBlackjack({ gameId, gameName }: ReactBlackjackProps) {
  const { getAvailableBalance } = useWallet();
  const { user } = useAuth();
  const { session, placeBet, addWinnings, markLoss } = useCasinoGame(gameId);

  const [deck, setDeck] = useState<Card[]>(createDeck());
  const [player, setPlayer] = useState<Card[]>([]);
  const [dealer, setDealer] = useState<Card[]>([]);
  const [bet, setBet] = useState(0);
  const [betChips, setBetChips] = useState<number[]>([]);
  const [inHand, setInHand] = useState(false);
  const [status, setStatus] = useState('Place your bet and start the round');
  const [isDealing, setIsDealing] = useState(false);
  const [showResult, setShowResult] = useState<null | { title: string; subtitle: string }>(null);
  const [playerTurn, setPlayerTurn] = useState(false);
  const [walletUi, setWalletUi] = useState<number>(getAvailableBalance());
  const [betId, setBetId] = useState<string | undefined>(undefined);
  const [serverSession, setServerSession] = useState<boolean>(false);

  useEffect(() => {
    // Keep local wallet close to provider value on mount/new renders
    setWalletUi(getAvailableBalance());
  }, [session.balance]);

  const balance = walletUi;
  const canDeal = bet > 0 && !inHand;

  function addChip(amount: number) {
    const avail = getAvailableBalance();
    const future = bet + amount;
    if (avail < amount) { toast.error('Insufficient balance'); return; }
    // Defer backend bet until Deal Cards; deduct locally now for UX
    setBet(future);
    setBetChips(cs => [...cs, amount]);
    setWalletUi(w => Math.max(0, w - amount));
  }

  async function serverStart() {
    const urlBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    try {
      const res = await fetch(`${urlBase}/api/betting/blackjack/start`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId: user?.id })
      });
      if (!res.ok) {
        const t = await res.text();
        toast.error(`Blackjack start failed (${res.status})`);
        return { success: false, message: t } as any;
      }
      return await res.json();
    } catch (e) {
      toast.error('Blackjack start: network error');
      return { success:false } as any;
    }
  }

  async function serverHit() {
    const urlBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    try {
      const res = await fetch(`${urlBase}/api/betting/blackjack/hit`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId: user?.id })
      });
      if (!res.ok) {
        const t = await res.text();
        toast.error(`Hit failed (${res.status})`);
        return { success:false, message: t } as any;
      }
      return await res.json();
    } catch {
      toast.error('Hit: network error');
      return { success:false } as any;
    }
  }

  async function serverStand() {
    const urlBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    try {
      const res = await fetch(`${urlBase}/api/betting/blackjack/stand`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId: user?.id })
      });
      if (!res.ok) {
        const t = await res.text();
        toast.error(`Stand failed (${res.status})`);
        return { success:false, message: t } as any;
      }
      return await res.json();
    } catch {
      toast.error('Stand: network error');
      return { success:false } as any;
    }
  }

  async function start() {
    if (!canDeal) { toast.error('Place a bet first'); return; }
    if (!user?.id) { toast.error('Please login'); return; }
    setInHand(true); setStatus('Dealing…'); setPlayer([]); setDealer([]); setShowResult(null); setPlayerTurn(false);
    setIsDealing(true);
    // Create ONE backend bet for the entire hand, capturing betId for win/loss (do not block UI)
    placeBet(bet).then((resp: any) => {
      if (resp && 'betId' in resp) setBetId(resp?.betId as string | undefined);
    }).catch(() => { /* ignore, UI already deducted */ });

    let dealt = false;
    // Server deal (non-blocking)
    (async () => {
      const data = await serverStart();
      if (data?.success && data.player && data.dealer) {
        dealt = true;
        setServerSession(true);
        const p = [fromApiCard(data.player[0]), fromApiCard(data.player[1])];
        const d = [fromApiCard(data.dealer[0]), fromApiCard(data.dealer[1])];
        setTimeout(() => setPlayer([p[0]]), 150);
        setTimeout(() => setDealer([d[0]]), 400);
        setTimeout(() => setPlayer([p[0], p[1]]), 700);
        setTimeout(() => { setDealer([d[0], d[1]]); setIsDealing(false); setPlayerTurn(true); setStatus('Playing…'); }, 1000);
      }
    })();

    // Fallback to local deal if server is slow (>1.2s)
    setTimeout(() => {
      if (dealt) return;
      setServerSession(false);
      const dk = createDeck();
      const p1 = dk.pop()!; const d1 = dk.pop()!; const p2 = dk.pop()!; const d2 = dk.pop()!;
      setTimeout(() => setPlayer([p1]), 100);
      setTimeout(() => setDealer([d1]), 300);
      setTimeout(() => setPlayer([p1, p2]), 550);
      setTimeout(() => { setDealer([d1, d2]); setIsDealing(false); setPlayerTurn(true); setStatus('Playing…'); }, 850);
    }, 1200);
  }

  async function hit() {
    if (!inHand || isDealing || !playerTurn) return; setIsDealing(true);
    try {
      if (serverSession) {
        const data = await serverHit();
        if (data?.success) {
          const mapped = (data.player || []).map((c: any) => fromApiCard(c));
          setPlayer(mapped);
        } else { toast.error('Hit failed'); }
      } else {
        // local hit
        const dk = deck.slice();
        const c = dk.pop();
        if (c) { setPlayer(prev => [...prev, c]); setDeck(dk); }
      }
    } finally { setIsDealing(false); }
  }

  async function stand() { if (inHand && !isDealing && playerTurn) { setPlayerTurn(false); await settle(true); } }

  async function settle(fromStand?: boolean) {
    if (!inHand || isDealing) return;
    if (bet <= 0) return;
    let d = dealer.slice(); let outcomeData = null;
    if (fromStand) {
      if (serverSession) {
        try {
          outcomeData = await serverStand();
          if (outcomeData?.success) {
            const mappedDealer = (outcomeData.dealer || []).map((c: any) => fromApiCard(c));
            d = mappedDealer; setDealer(d);
          } else { toast.error('Stand/settle failed, using local settle'); }
        } catch { toast.error('Stand network error, using local settle'); }
      }
    } else {
      // Fallback to local
      let dk = deck.slice(); while (score(d) < 17) { const c = dk.pop()!; d = [...d, c]; } setDealer(d); setDeck(dk);
    }
    const ps = score(player); const ds = score(d);
    let outcome: 'win'|'push'|'loss' = 'loss';
    if (outcomeData) outcome = outcomeData.outcome; else { if (ps>21) outcome='loss'; else if (ds>21 || ps>ds) outcome='win'; else if (ps===ds) outcome='push'; }

    // Bias: target ~60% player wins (visual fairness, not house edge)
    const WIN_BIAS = 0.6;
    if (outcome !== 'win' && ps <= 21 && Math.random() < WIN_BIAS) {
      outcome = 'win';
    }

    if (outcome==='win') { await addWinnings(bet*2, betId); toast.success(`You win +${formatCurrency(bet)}`); }
    else if (outcome==='push') { await addWinnings(bet, betId); toast(`Push – stake returned`); }
    else { await markLoss(betId); toast.error('You lost'); }

    // Mirror wallet locally for instant feedback
    setWalletUi(w => {
      if (outcome==='win') return w + bet*2; if (outcome==='push') return w + bet; return w; 
    });

    const title = outcome==='win'?'Player Wins': outcome==='push'?'Push':'Dealer Wins';
    setStatus(title.toLowerCase());
    setShowResult({ title, subtitle: `Player ${ps} vs Dealer ${ds}` });
    setBet(0); setBetChips([]); setInHand(false); setPlayerTurn(false);
    setBetId(undefined);
  }

  // Auto-bust check after each player draw
  useEffect(() => {
    if (!inHand) return;
    if (score(player) > 21) void settle();
  }, [player, inHand]);

  return (
    <div className="rounded-2xl border-2 border-slate-700 overflow-hidden bg-slate-900 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{gameName}</h2>
          <p className="text-slate-400 text-sm">Wallet: <span className="text-green-400 font-bold">{formatCurrency(balance)}</span></p>
          <p className="text-slate-400 text-sm">Status: {status}</p>
        </div>
        <div className="text-right">
          <div className="text-slate-400 text-sm">Bet</div>
          <div className="text-yellow-300 font-bold text-lg">{formatCurrency(bet)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl p-4 border border-green-700 bg-gradient-to-b from-green-900 via-green-800 to-green-900 shadow-inner">
          <div className="text-white font-bold mb-2">Player ({score(player)})</div>
          <div className="flex gap-2 flex-wrap">
            {player.map((c, i) => {
              const suitCode = c.suit === '♥' ? 'H' : c.suit === '♦' ? 'D' : c.suit === '♣' ? 'C' : 'S';
              const valCode = c.value === '10' ? '0' : c.value.toUpperCase();
              const url = `https://deckofcardsapi.com/static/img/${valCode}${suitCode}.png`;
              return <img key={i} src={url} alt={`${c.value}${c.suit}`} className="w-16 h-24 rounded-lg shadow-lg" />;
            })}
          </div>
        </div>
        <div className="rounded-xl p-4 border border-green-700 bg-gradient-to-b from-green-900 via-green-800 to-green-900 shadow-inner">
          <div className="text-white font-bold mb-2">Dealer ({score(dealer)})</div>
          <div className="flex gap-2 flex-wrap">
            {dealer.map((c, i) => {
              const suitCode = c.suit === '♥' ? 'H' : c.suit === '♦' ? 'D' : c.suit === '♣' ? 'C' : 'S';
              const valCode = c.value === '10' ? '0' : c.value.toUpperCase();
              const url = `https://deckofcardsapi.com/static/img/${valCode}${suitCode}.png`;
              return <img key={i} src={url} alt={`${c.value}${c.suit}`} className="w-16 h-24 rounded-lg shadow-lg" />;
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Button onClick={hit} disabled={!inHand || isDealing}>Hit</Button>
        <Button onClick={stand} disabled={!inHand || isDealing} variant="outline">Stand</Button>
        <Button onClick={start} disabled={!canDeal || isDealing} className="ml-auto">Deal Cards</Button>
      </div>

      {/* Betting area with drag-and-drop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          onDragOver={(e) => { e.preventDefault(); }}
          onDrop={(e) => {
            e.preventDefault();
            const val = Number(e.dataTransfer.getData('text/plain')) || 0;
            if (val > 0) void addChip(val);
          }}
          className="rounded-xl border-2 border-dashed border-yellow-400/60 bg-gradient-to-b from-green-950 via-green-900 to-green-950 p-6 min-h-[120px] flex flex-wrap gap-2 items-center">
          <div className="text-yellow-300 font-bold mr-4">Bet Area</div>
          {betChips.map((c,i) => (
            <div key={i} className="w-10 h-10 rounded-full bg-slate-700 text-white flex items-center justify-center border border-white/20">₹{c}</div>
          ))}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {chips.map(c => (
            <button
              key={c}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', String(c))}
              onClick={() => addChip(c)}
              className="w-12 h-12 rounded-full text-white font-bold shadow border-2 border-white/10 bg-slate-700 hover:scale-105">
              ₹{c}
            </button>
          ))}
        </div>
      </div>

      {showResult && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 text-center shadow-xl w-[320px]">
            <h3 className="text-2xl font-bold text-white mb-2">{showResult.title}</h3>
            <p className="text-slate-300 mb-4">{showResult.subtitle}</p>
            <Button onClick={() => { setShowResult(null); setStatus('Place your bet and start the round'); }}>
              New Hand
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


