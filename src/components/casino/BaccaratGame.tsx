import React, { useState, useEffect } from 'react';
import { Crown, Coins, Volume2, VolumeX, Trophy, Zap, Target, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useWallet } from '../../contexts/SupabaseWalletContext';
import toast from 'react-hot-toast';
import { useCasinoGame } from '../../hooks/useCasinoGame';
import { formatCurrency } from '../../lib/utils';
import { eventBus } from '../../utils/eventBus';

interface BaccaratGameProps {
  gameId: string;
  gameName: string;
}

interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: string;
  value: number;
}

interface BaccaratHand {
  cards: Card[];
  value: number;
  isNatural: boolean;
}

interface Bet {
  type: 'player' | 'banker' | 'tie' | 'player_pair' | 'banker_pair';
  amount: number;
  payout: number;
}

const CARD_SUITS = {
  hearts: { symbol: '♥', color: 'text-red-500' },
  diamonds: { symbol: '♦', color: 'text-red-500' },
  clubs: { symbol: '♣', color: 'text-gray-800' },
  spades: { symbol: '♠', color: 'text-gray-800' }
};

export function BaccaratGame({ gameId, gameName }: BaccaratGameProps) {
  const { user } = useAuth();
  const { processBet, processWin, getAvailableBalance } = useWallet();
  const { session, isPlaying, setIsPlaying, placeBet, addWinnings, markLoss, resetSession } = useCasinoGame(gameId);
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<BaccaratHand | null>(null);
  const [bankerHand, setBankerHand] = useState<BaccaratHand | null>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [gamePhase, setGamePhase] = useState<'betting' | 'dealing' | 'finished'>('betting');
  const [message, setMessage] = useState('Place your bets on Player, Banker, or Tie');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cardAnimation, setCardAnimation] = useState<string | null>(null);
  const [gameStats, setGameStats] = useState({
    handsPlayed: 0,
    playerWins: 0,
    bankerWins: 0,
    ties: 0,
    naturals: 0
  });
  const [showRules, setShowRules] = useState(false);
  const [winAnimation, setWinAnimation] = useState(false);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [trends, setTrends] = useState({ player: 0, banker: 0, tie: 0 });

  // Always-read available balance to avoid stale session.balance checks
  const availableBalance = getAvailableBalance();

  // Ensure clean state after refresh/navigation so first hand can start
  useEffect(() => {
    try {
      setIsPlaying(false);
      setGamePhase('betting');
      setBets([]);
      setPlayerHand(null);
      setBankerHand(null);
      setWinAnimation(false);
    } catch {}
    const t = setTimeout(() => {
      try { setIsPlaying(false); } catch {}
    }, 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setDeck(createDeck());
  }, []);

  useEffect(() => {
    if (gameHistory.length > 0) {
      const recent = gameHistory.slice(0, 10);
      setTrends({
        player: recent.filter(r => r.winner === 'player').length,
        banker: recent.filter(r => r.winner === 'banker').length,
        tie: recent.filter(r => r.winner === 'tie').length
      });
    }
  }, [gameHistory]);

  const createDeck = (): Card[] => {
    const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = [
      { rank: 'A', value: 1 },
      { rank: '2', value: 2 }, { rank: '3', value: 3 }, { rank: '4', value: 4 },
      { rank: '5', value: 5 }, { rank: '6', value: 6 }, { rank: '7', value: 7 },
      { rank: '8', value: 8 }, { rank: '9', value: 9 }, { rank: '10', value: 0 },
      { rank: 'J', value: 0 }, { rank: 'Q', value: 0 }, { rank: 'K', value: 0 }
    ];
    
    const deck: Card[] = [];
    for (let deckCount = 0; deckCount < 8; deckCount++) {
      suits.forEach(suit => {
        ranks.forEach(rankData => {
          deck.push({ suit, rank: rankData.rank, value: rankData.value });
        });
      });
    }

    return shuffleDeck(deck);
  };

  const shuffleDeck = (deck: Card[]): Card[] => {
    const shuffled = [...deck];
    for (let pass = 0; pass < 3; pass++) {
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
    }
    return shuffled;
  };

  const calculateBaccaratValue = (cards: Card[]): number => {
    const total = cards.reduce((sum, card) => sum + card.value, 0);
    return total % 10;
  };

  const createBaccaratHand = (cards: Card[]): BaccaratHand => {
    const value = calculateBaccaratValue(cards);
    const isNatural = cards.length === 2 && (value === 8 || value === 9);
    return { cards, value, isNatural };
  };

  const dealCard = (currentDeck: Card[]): { card: Card; newDeck: Card[] } => {
    const newDeck = [...currentDeck];
    const card = newDeck.pop()!;
    
    if (soundEnabled) {
      setCardAnimation('dealing');
      setTimeout(() => setCardAnimation(null), 500);
      console.log('🔊 Card deal sound...');
    }
    
    return { card, newDeck };
  };

  const placeBetOnOption = (type: Bet['type'], payout: number) => {
    // Flat chip size (you can wire this to UI later)
    const chip = 100;

    if (!user) {
      toast.error('Please login to place bets');
      return;
    }

    setBets(prev => {
      // Current total other bets (excluding this type)
      const otherTotal = prev.filter(b => b.type !== type).reduce((s, b) => s + b.amount, 0);
      const existing = prev.find(b => b.type === type);
      const nextAmount = (existing?.amount || 0) + chip;

      if (otherTotal + nextAmount > availableBalance) {
        toast.error('Insufficient balance!');
        return prev;
      }

      const updated: Bet = { type, amount: nextAmount, payout };
      const next = [...prev.filter(b => b.type !== type), updated];

      if (soundEnabled) {
        console.log('🔊 Chip placed sound...');
      }

      return next;
    });
  };

  const startGame = async () => {
    if (bets.length === 0) {
      toast.error('Please place at least one bet!');
      return;
    }

    const totalBetAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);
    if (!user || totalBetAmount > availableBalance) {
      toast.error('Insufficient balance for all bets!');
      return;
    }

    try {
      // Start UI immediately – never block on network
      setIsPlaying(true);
      setGamePhase('dealing');
      setMessage('Dealing cards...');
      setWinAnimation(false);

      // Safety net: if UI gets stuck in dealing, auto-deal after 1.2s
      // This prevents rare cases where an awaited delay is interrupted by re-renders
      // and users see an endless "Dealing cards..." message.
      setTimeout(() => {
        try {
          // Only run if no cards are shown (avoid stale phase checks in closure)
          if (!playerHand && !bankerHand) {
            // Minimal immediate deal (no animation) to unblock the round
            let fallbackDeck = createDeck();
            const p1 = fallbackDeck.pop()!;
            const b1 = fallbackDeck.pop()!;
            const p2 = fallbackDeck.pop()!;
            const b2 = fallbackDeck.pop()!;

            const ph = createBaccaratHand([p1, p2]);
            const bh = createBaccaratHand([b1, b2]);

            setPlayerHand(ph);
            setBankerHand(bh);
            setDeck(fallbackDeck);
            setMessage(`Player: ${ph.value} | Banker: ${bh.value}`);
            // The normal flow will pick up from here (naturals/third card/finish)
          }
        } catch {}
      }, 1200);

      // Deduct all bets with short timeouts so dealing can proceed
      const withTimeout = async <T,>(p: Promise<T>, ms: number): Promise<T> => {
        return await Promise.race<T>([
          p,
          new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)) as Promise<T>
        ]);
      };

      // Deduct locally (fast, never block)
      await Promise.allSettled(bets.map(b => placeBet(b.amount)));

      // Persist to backend wallet in background (non-blocking)
      (async () => {
        for (const bet of bets) {
          try {
            const optionLabel = ({ player: 'PLAYER', banker: 'BANKER', tie: 'TIE', player_pair: 'PLAYER PAIR', banker_pair: 'BANKER PAIR' } as const)[bet.type];
            await withTimeout(
              processBet(
                bet.amount,
                'Casino Game',
                `${gameName} - ${optionLabel} (${bet.payout}:1)`,
                { gameId, gameName, betOption: bet.type, betAmount: bet.amount, payoutRatio: bet.payout }
              ),
              5000
            );
          } catch (e) {
            // Non-critical; UI continues
          }
        }
      })();
      
      console.log('[Baccarat] Creating deck and starting animated deal');
      let currentDeck = createDeck();
      
      // Deal initial cards with snappy animation, revealing one by one
      await new Promise(resolve => setTimeout(resolve, 120));
      
      const { card: playerCard1, newDeck: deck1 } = dealCard(currentDeck);
      console.log('[Baccarat] Dealt P1', playerCard1);
      setPlayerHand(createBaccaratHand([playerCard1]));
      await new Promise(resolve => setTimeout(resolve, 140));
      
      const { card: bankerCard1, newDeck: deck2 } = dealCard(deck1);
      console.log('[Baccarat] Dealt B1', bankerCard1);
      setBankerHand(createBaccaratHand([bankerCard1]));
      await new Promise(resolve => setTimeout(resolve, 140));
      
      const { card: playerCard2, newDeck: deck3 } = dealCard(deck2);
      console.log('[Baccarat] Dealt P2', playerCard2);
      let newPlayerHand = createBaccaratHand([playerCard1, playerCard2]);
      setPlayerHand(newPlayerHand);
      await new Promise(resolve => setTimeout(resolve, 140));
      
      const { card: bankerCard2, newDeck: finalDeck } = dealCard(deck3);
      console.log('[Baccarat] Dealt B2', bankerCard2);
      let newBankerHand = createBaccaratHand([bankerCard1, bankerCard2]);
      setBankerHand(newBankerHand);
      setDeck(finalDeck);
      
      setMessage(`Player: ${newPlayerHand.value} | Banker: ${newBankerHand.value}`);
      
      // Check for naturals – finish immediately for snappy UX
      if (newPlayerHand.isNatural || newBankerHand.isNatural) {
        setMessage(`🌟 Natural ${newPlayerHand.value > newBankerHand.value ? 'Player' : newBankerHand.value > newPlayerHand.value ? 'Banker' : 'Tie'}!`);
        setGameStats(prev => ({ ...prev, naturals: prev.naturals + 1 }));
        console.log('[Baccarat] Natural detected → finishing');
        return finishGame(newPlayerHand, newBankerHand, finalDeck);
      }
      
      // Third card rules
      let updatedDeck = finalDeck;
      
      // Player third card rule
      if (newPlayerHand.value <= 5) {
        await new Promise(resolve => setTimeout(resolve, 220));
        setMessage('Player draws third card...');
        const { card: playerCard3, newDeck: deck4 } = dealCard(updatedDeck);
        newPlayerHand = createBaccaratHand([...newPlayerHand.cards, playerCard3]);
        setPlayerHand(newPlayerHand);
        updatedDeck = deck4;
        await new Promise(resolve => setTimeout(resolve, 180));
      }
      
      // Banker third card rule
      const shouldBankerDraw = shouldBankerDrawThirdCard(newBankerHand.value, newPlayerHand.cards[2]?.value);
      if (shouldBankerDraw) {
        setMessage('Banker draws third card...');
        const { card: bankerCard3, newDeck: finalDeck2 } = dealCard(updatedDeck);
        newBankerHand = createBaccaratHand([...newBankerHand.cards, bankerCard3]);
        setBankerHand(newBankerHand);
        updatedDeck = finalDeck2;
        await new Promise(resolve => setTimeout(resolve, 180));
      }
      
      setDeck(updatedDeck);
      console.log('[Baccarat] No natural → finishing');
      return finishGame(newPlayerHand, newBankerHand, updatedDeck);
      
    } catch (error) {
      console.error('Deal error:', error);
      setIsPlaying(false);
      setGamePhase('betting');
    }
  };

  const shouldBankerDrawThirdCard = (bankerValue: number, playerThirdCard?: number): boolean => {
    if (bankerValue >= 7) return false;
    if (bankerValue <= 2) return true;
    
    if (!playerThirdCard) {
      return bankerValue <= 5;
    }
    
    switch (bankerValue) {
      case 3: return playerThirdCard !== 8;
      case 4: return [2, 3, 4, 5, 6, 7].includes(playerThirdCard);
      case 5: return [4, 5, 6, 7].includes(playerThirdCard);
      case 6: return [6, 7].includes(playerThirdCard);
      default: return false;
    }
  };

  const finishGame = async (
    finalPlayerHand: BaccaratHand,
    finalBankerHand: BaccaratHand,
    _finalDeck: Card[]
  ) => {
    console.log('[Baccarat] finishGame()', { player: finalPlayerHand, banker: finalBankerHand });
    setGamePhase('finished');
    
    const playerValue = finalPlayerHand.value;
    const bankerValue = finalBankerHand.value;
    
    let winner: 'player' | 'banker' | 'tie';
    if (playerValue > bankerValue) {
      winner = 'player';
      setMessage(`🎉 Player wins! ${playerValue} beats ${bankerValue}`);
    } else if (bankerValue > playerValue) {
      winner = 'banker';
      setMessage(`🏦 Banker wins! ${bankerValue} beats ${playerValue}`);
    } else {
      winner = 'tie';
      setMessage(`🤝 Tie! Both have ${playerValue}`);
    }
    
    const playerPair = finalPlayerHand.cards.length >= 2 && 
                      finalPlayerHand.cards[0].rank === finalPlayerHand.cards[1].rank;
    const bankerPair = finalBankerHand.cards.length >= 2 && 
                      finalBankerHand.cards[0].rank === finalBankerHand.cards[1].rank;
    
    let totalWinnings = 0;
    const totalStake = bets.reduce((s, b) => s + b.amount, 0);
    
    for (const bet of bets) {
      switch (bet.type) {
        case 'player':
          totalWinnings += winner === 'player' ? bet.amount * bet.payout : winner === 'tie' ? bet.amount : 0;
          break;
        case 'banker':
          totalWinnings += winner === 'banker' ? bet.amount * bet.payout : winner === 'tie' ? bet.amount : 0;
          break;
        case 'tie':
          totalWinnings += winner === 'tie' ? bet.amount * bet.payout : 0;
          break;
        case 'player_pair':
          totalWinnings += playerPair ? bet.amount * bet.payout : 0;
          break;
        case 'banker_pair':
          totalWinnings += bankerPair ? bet.amount * bet.payout : 0;
          break;
      }
    }
    
    // Update stats
    setGameStats(prev => ({
      ...prev,
      handsPlayed: prev.handsPlayed + 1,
      playerWins: prev.playerWins + (winner === 'player' ? 1 : 0),
      bankerWins: prev.bankerWins + (winner === 'banker' ? 1 : 0),
      ties: prev.ties + (winner === 'tie' ? 1 : 0),
      naturals: prev.naturals + ((finalPlayerHand.isNatural || finalBankerHand.isNatural) ? 1 : 0)
    }));
    
    try {
    if (totalWinnings > 0) {
        await addWinnings(totalWinnings);
      setWinAnimation(true);
        setTimeout(() => setWinAnimation(false), 1000);
      } else {
        await markLoss();
      }
    } catch (e) {
      console.warn('[Baccarat] wallet settlement failed (non-fatal):', e);
    }
    
    try {
    eventBus.emit('casinoWin', {
      gameId,
      userId: user?.id || '',
      gameName,
        betAmount: totalStake,
      winAmount: totalWinnings,
        result: {
          winner,
          playerValue,
          bankerValue,
          playerPair,
          bankerPair,
          isNatural: finalPlayerHand.isNatural || finalBankerHand.isNatural,
          timestamp: new Date()
        },
      timestamp: new Date()
    });
    } catch {}
    
    setIsPlaying(false);
    setBets([]);
  };

  const newGame = () => {
    setGamePhase('betting');
    setPlayerHand(null);
    setBankerHand(null);
    setBets([]);
    setMessage('Place your bets on Player, Banker, or Tie');
    setDeck(createDeck());
    setWinAnimation(false);
  };

  const renderCard = (card: Card, isDealing = false) => {
    const suit = CARD_SUITS[card.suit];
    const isRed = card.suit === 'hearts' || card.suit === 'diamonds';

    return (
      <div className={`w-20 h-32 bg-gradient-to-br from-white to-gray-100 rounded-xl border-3 border-gray-300 flex flex-col items-center justify-between p-2 shadow-2xl transform hover:scale-110 transition-all duration-300 ${
        isDealing ? 'animate-bounce' : ''
      } relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-xl"></div>
        
        <div className={`text-sm font-bold ${isRed ? 'text-red-500' : 'text-gray-800'} relative z-10`}>
          {card.rank}
        </div>
        <div className="text-4xl relative z-10">
          {suit.symbol}
        </div>
        <div className={`text-sm font-bold transform rotate-180 ${isRed ? 'text-red-500' : 'text-gray-800'} relative z-10`}>
          {card.rank}
        </div>
      </div>
    );
  };

  const renderHand = (hand: BaccaratHand, title: string, color: string) => (
    <div className={`bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-2xl p-6 border-3 border-${color}-500/50 shadow-2xl`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-2xl font-bold text-${color}-400 flex items-center space-x-2`}>
          <Crown className="w-6 h-6" />
          <span>{title}</span>
        </h3>
        <div className="text-right">
          <span className={`text-4xl font-bold ${
            hand.isNatural ? `text-yellow-400 animate-pulse` : `text-${color}-400`
          }`}>
            {hand.value}
          </span>
          {hand.isNatural && (
            <div className="text-lg text-yellow-400 font-bold animate-bounce">🌟 NATURAL!</div>
          )}
        </div>
      </div>
      
      <div className="flex justify-center space-x-3">
        {hand.cards.map((card, index) => (
          <div key={index}>
            {renderCard(card, cardAnimation === 'dealing')}
          </div>
        ))}
      </div>
    </div>
  );

  const getBetButtonStyle = (type: Bet['type']) => {
    const hasBet = bets.some(bet => bet.type === type);
    const baseStyle = "h-24 font-bold text-xl rounded-2xl disabled:opacity-50 transition-all duration-300 transform hover:scale-110 border-3 shadow-2xl relative overflow-hidden";
    
    if (hasBet) {
      return `${baseStyle} ring-4 ring-yellow-400 ring-opacity-60 scale-105`;
    }
    
    switch (type) {
      case 'player':
        return `${baseStyle} bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white border-blue-500 shadow-blue-500/30`;
      case 'banker':
        return `${baseStyle} bg-gradient-to-br from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white border-red-500 shadow-red-500/30`;
      case 'tie':
        return `${baseStyle} bg-gradient-to-br from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-white border-green-500 shadow-green-500/30`;
      case 'player_pair':
        return `${baseStyle} bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white border-purple-500 shadow-purple-500/30`;
      case 'banker_pair':
        return `${baseStyle} bg-gradient-to-br from-orange-600 to-orange-800 hover:from-orange-500 hover:to-orange-700 text-white border-orange-500 shadow-orange-500/30`;
      default:
        return baseStyle;
    }
  };

  const totalBetAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);

  return (
    <div className="bg-gradient-to-b from-slate-800 via-purple-900/20 to-slate-900 rounded-3xl p-8 border-2 border-purple-500/30 relative overflow-hidden shadow-2xl">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 left-1/3 w-36 h-36 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Win Animation Overlay */}
      {winAnimation && (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/80 via-pink-400/80 to-red-500/80 flex items-center justify-center z-40 rounded-3xl animate-pulse">
          <div className="text-center">
            <Crown className="w-24 h-24 text-yellow-200 mx-auto mb-4 animate-bounce" />
            <h2 className="text-6xl font-bold text-white mb-4 animate-bounce">WINNER!</h2>
            <p className="text-3xl font-bold text-yellow-200">👑 Baccarat Victory! 👑</p>
          </div>
        </div>
      )}

      {/* Game Header */}
      <div className="relative z-10 text-center mb-8">
        <div className="flex items-center justify-center space-x-4 mb-6">
          <Crown className="w-10 h-10 text-purple-400 animate-pulse" />
          <h2 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
            {gameName}
          </h2>
          <Crown className="w-10 h-10 text-purple-400 animate-pulse" />
        </div>
        
        <div className="flex justify-center space-x-12 text-lg">
          <div className="text-center">
            <p className="text-slate-400 font-medium">Balance</p>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(session.balance)}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 font-medium">Total Bets</p>
            <p className="text-2xl font-bold text-blue-400">{formatCurrency(totalBetAmount)}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 font-medium">Hands Played</p>
            <p className="text-2xl font-bold text-purple-400">{gameStats.handsPlayed}</p>
          </div>
        </div>
      </div>

      {/* Game Message */}
      <div className="relative z-10 text-center mb-8">
        <div className="bg-gradient-to-r from-slate-800 via-purple-800/30 to-slate-800 rounded-2xl p-6 border-2 border-purple-500/30 shadow-xl">
          <p className="text-2xl font-bold text-yellow-400">{message}</p>
        </div>
      </div>

      {/* Trends Display */}
      <div className="relative z-10 mb-8">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 border-2 border-slate-700 shadow-xl">
          <h4 className="text-xl font-bold text-center text-white mb-4">Recent Trends (Last 10 Hands)</h4>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="bg-blue-600/20 rounded-xl p-4 border border-blue-500/30">
              <p className="text-blue-400 font-bold text-lg">Player</p>
              <p className="text-2xl font-bold text-white">{trends.player}</p>
            </div>
            <div className="bg-red-600/20 rounded-xl p-4 border border-red-500/30">
              <p className="text-red-400 font-bold text-lg">Banker</p>
              <p className="text-2xl font-bold text-white">{trends.banker}</p>
            </div>
            <div className="bg-green-600/20 rounded-xl p-4 border border-green-500/30">
              <p className="text-green-400 font-bold text-lg">Tie</p>
              <p className="text-2xl font-bold text-white">{trends.tie}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Game Table */}
      {(playerHand || bankerHand) && (
        <div className="relative z-10 bg-gradient-to-br from-green-800 via-green-900 to-black rounded-3xl p-8 mb-8 border-4 border-green-600 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Player Hand */}
            {playerHand && renderHand(playerHand, 'Player', 'blue')}
            
            {/* Banker Hand */}
            {bankerHand && renderHand(bankerHand, 'Banker', 'red')}
          </div>
        </div>
      )}

      {/* Betting Area */}
      {gamePhase === 'betting' && (
        <div className="relative z-10 mb-8">
          <div className="bg-gradient-to-br from-green-800 via-green-900 to-black rounded-3xl p-8 border-4 border-green-600 shadow-2xl">
            <h4 className="text-2xl font-bold text-center text-green-400 mb-8">Place Your Bets</h4>
            
            {/* Main Bets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <button
                onClick={() => placeBetOnOption('player', 2)}
                disabled={isPlaying}
                className={getBetButtonStyle('player')}
              >
                <div className="relative z-10">
                  <div className="text-2xl font-bold">PLAYER</div>
                  <div className="text-lg opacity-90">Pays 2:1</div>
                  {bets.find(b => b.type === 'player') && (
                    <div className="text-sm text-yellow-300 font-bold">
                      {formatCurrency(bets.find(b => b.type === 'player')!.amount)}
                    </div>
                  )}
                </div>
              </button>
              
              <button
                onClick={() => placeBetOnOption('tie', 9)}
                disabled={isPlaying}
                className={getBetButtonStyle('tie')}
              >
                <div className="relative z-10">
                  <div className="text-2xl font-bold">TIE</div>
                  <div className="text-lg opacity-90">Pays 9:1</div>
                  {bets.find(b => b.type === 'tie') && (
                    <div className="text-sm text-yellow-300 font-bold">
                      {formatCurrency(bets.find(b => b.type === 'tie')!.amount)}
                    </div>
                  )}
                </div>
              </button>
              
              <button
                onClick={() => placeBetOnOption('banker', 1.95)}
                disabled={isPlaying}
                className={getBetButtonStyle('banker')}
              >
                <div className="relative z-10">
                  <div className="text-2xl font-bold">BANKER</div>
                  <div className="text-lg opacity-90">Pays 1.95:1</div>
                  {bets.find(b => b.type === 'banker') && (
                    <div className="text-sm text-yellow-300 font-bold">
                      {formatCurrency(bets.find(b => b.type === 'banker')!.amount)}
                    </div>
                  )}
                </div>
              </button>
            </div>

            {/* Side Bets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => placeBetOnOption('player_pair', 12)}
                disabled={isPlaying}
                className={getBetButtonStyle('player_pair')}
              >
                <div className="relative z-10">
                  <div className="text-xl font-bold">PLAYER PAIR</div>
                  <div className="text-lg opacity-90">Pays 12:1</div>
                  {bets.find(b => b.type === 'player_pair') && (
                    <div className="text-sm text-yellow-300 font-bold">
                      {formatCurrency(bets.find(b => b.type === 'player_pair')!.amount)}
                    </div>
                  )}
                </div>
              </button>
              
              <button
                onClick={() => placeBetOnOption('banker_pair', 12)}
                disabled={isPlaying}
                className={getBetButtonStyle('banker_pair')}
              >
                <div className="relative z-10">
                  <div className="text-xl font-bold">BANKER PAIR</div>
                  <div className="text-lg opacity-90">Pays 12:1</div>
                  {bets.find(b => b.type === 'banker_pair') && (
                    <div className="text-sm text-yellow-300 font-bold">
                      {formatCurrency(bets.find(b => b.type === 'banker_pair')!.amount)}
                    </div>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="relative z-10 space-y-6">
        {gamePhase === 'betting' && (
          <div className="flex justify-center space-x-6">
            <Button
              onClick={startGame}
              disabled={bets.length === 0 || totalBetAmount > availableBalance}
              className="px-16 py-6 text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-500 hover:via-pink-500 hover:to-red-500 transform hover:scale-110 transition-all duration-300 shadow-2xl shadow-purple-500/30 rounded-2xl border-2 border-purple-400"
            >
              <Crown className="w-8 h-8 mr-3" />
              DEAL CARDS
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setBets([])} 
              disabled={isPlaying || bets.length === 0}
              className="px-8 py-6 text-xl font-bold border-2 border-yellow-500 hover:bg-yellow-500/20"
            >
              Clear Bets
            </Button>
          </div>
        )}

        {gamePhase === 'finished' && (
          <div className="flex justify-center space-x-6">
            <Button 
              onClick={newGame} 
              className="px-12 py-6 text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 transform hover:scale-110 transition-all duration-300 shadow-xl rounded-2xl"
            >
              <Crown className="w-6 h-6 mr-3" />
              New Hand
            </Button>
            <Button 
              variant="outline" 
              onClick={resetSession}
              className="px-8 py-6 text-xl font-bold border-2 border-purple-500 hover:bg-purple-500/20"
            >
              <RotateCcw className="w-6 h-6 mr-3" />
              Reset Session
            </Button>
          </div>
        )}

        {/* Settings */}
        <div className="flex justify-center space-x-6">
          <Button
            variant="ghost"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-4"
          >
            {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => setShowRules(!showRules)}
            className="p-4"
          >
            <Trophy className="w-6 h-6 mr-2" />
            Rules
          </Button>
        </div>
      </div>

      {/* Game Statistics */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-5 gap-4 text-center mt-8">
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl p-4 border-2 border-slate-600 shadow-lg">
          <p className="text-slate-400 font-medium">Hands</p>
          <p className="text-2xl font-bold text-white">{gameStats.handsPlayed}</p>
        </div>
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl p-4 border-2 border-slate-600 shadow-lg">
          <p className="text-slate-400 font-medium">Player Wins</p>
          <p className="text-2xl font-bold text-blue-400">{gameStats.playerWins}</p>
        </div>
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl p-4 border-2 border-slate-600 shadow-lg">
          <p className="text-slate-400 font-medium">Banker Wins</p>
          <p className="text-2xl font-bold text-red-400">{gameStats.bankerWins}</p>
        </div>
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl p-4 border-2 border-slate-600 shadow-lg">
          <p className="text-slate-400 font-medium">Ties</p>
          <p className="text-2xl font-bold text-green-400">{gameStats.ties}</p>
        </div>
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl p-4 border-2 border-slate-600 shadow-lg">
          <p className="text-slate-400 font-medium">Naturals</p>
          <p className="text-2xl font-bold text-yellow-400">{gameStats.naturals}</p>
        </div>
      </div>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-8 border-2 border-purple-500 max-w-4xl w-full max-h-[90vh] overflow-auto shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                👑 Baccarat Rules & Payouts
              </h3>
              <Button variant="ghost" onClick={() => setShowRules(false)} className="text-2xl">
                ✕
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-700/30 to-blue-800/30 rounded-xl p-6 border-2 border-blue-500/30">
                <h4 className="text-xl font-bold text-blue-400 mb-4">🎯 How to Play</h4>
                <ul className="text-lg text-slate-300 space-y-2">
                  <li>• Bet on Player, Banker, or Tie</li>
                  <li>• Closest to 9 wins the hand</li>
                  <li>• Cards 2-9 = face value</li>
                  <li>• 10, J, Q, K = 0 points</li>
                  <li>• Ace = 1 point</li>
                  <li>• Only last digit counts (15 = 5)</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-green-700/30 to-green-800/30 rounded-xl p-6 border-2 border-green-500/30">
                <h4 className="text-xl font-bold text-green-400 mb-4">💰 Payouts</h4>
                <ul className="text-lg text-slate-300 space-y-2">
                  <li>• Player bet: <span className="text-blue-400 font-bold">2:1</span></li>
                  <li>• Banker bet: <span className="text-red-400 font-bold">1.95:1</span></li>
                  <li>• Tie bet: <span className="text-green-400 font-bold">9:1</span></li>
                  <li>• Player Pair: <span className="text-purple-400 font-bold">12:1</span></li>
                  <li>• Banker Pair: <span className="text-orange-400 font-bold">12:1</span></li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-700/30 to-yellow-800/30 rounded-xl p-6 border-2 border-yellow-500/30">
                <h4 className="text-xl font-bold text-yellow-400 mb-4">🌟 Natural Wins</h4>
                <ul className="text-lg text-slate-300 space-y-2">
                  <li>• 8 or 9 with first 2 cards</li>
                  <li>• Automatic win (no third card)</li>
                  <li>• Higher natural beats lower</li>
                  <li>• Same natural = Tie</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-purple-700/30 to-purple-800/30 rounded-xl p-6 border-2 border-purple-500/30">
                <h4 className="text-xl font-bold text-purple-400 mb-4">📋 Third Card Rules</h4>
                <ul className="text-lg text-slate-300 space-y-2">
                  <li>• Player draws on 0-5, stands on 6-7</li>
                  <li>• Banker rules depend on player's third card</li>
                  <li>• Natural 8 or 9 = no more cards</li>
                  <li>• Complex but automatic!</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}