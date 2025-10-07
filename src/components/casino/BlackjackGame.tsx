import React, { useState, useEffect } from 'react';
import { RotateCcw, Coins, Volume2, VolumeX, Trophy, Zap, Split, Shield, Target, Crown } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';
import toast from 'react-hot-toast';
import { useCasinoGame } from '../../hooks/useCasinoGame';
import { formatCurrency } from '../../lib/utils';
import { eventBus } from '../../utils/eventBus';

interface BlackjackGameProps {
  gameId: string;
  gameName: string;
}

interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: string;
  value: number;
}

interface GameHand {
  cards: Card[];
  value: number;
  isBlackjack: boolean;
  isBust: boolean;
  isSoft: boolean;
  canSplit: boolean;
  canDouble: boolean;
}

const CARD_SUITS = {
  hearts: { symbol: '♥', color: 'text-red-500' },
  diamonds: { symbol: '♦', color: 'text-red-500' },
  clubs: { symbol: '♣', color: 'text-gray-800' },
  spades: { symbol: '♠', color: 'text-gray-800' }
};

export function BlackjackGame({ gameId, gameName }: BlackjackGameProps) {
  const { user } = useAuth();
  const { addTransaction } = useWallet();
  const { session, isPlaying, setIsPlaying, placeBet, addWinnings, resetSession } = useCasinoGame(gameId);
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHands, setPlayerHands] = useState<GameHand[]>([]);
  const [dealerHand, setDealerHand] = useState<GameHand | null>(null);
  const [activeHandIndex, setActiveHandIndex] = useState(0);
  const [betAmount, setBetAmount] = useState(10);
  const [sideBets, setSideBets] = useState({ perfectPairs: 0, twentyOnePlusThree: 0 });
  const [gamePhase, setGamePhase] = useState<'betting' | 'dealing' | 'playing' | 'dealer' | 'finished'>('betting');
  const [message, setMessage] = useState('Place your bet to start the hand');
  const [showDealerCard, setShowDealerCard] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cardAnimation, setCardAnimation] = useState<string | null>(null);
  const [gameStats, setGameStats] = useState({
    handsPlayed: 0,
    handsWon: 0,
    blackjacks: 0,
    busts: 0,
    pushes: 0,
    doubles: 0,
    splits: 0
  });
  const [showStrategy, setShowStrategy] = useState(false);
  const [winAnimation, setWinAnimation] = useState(false);
  const [dealingAnimation, setDealingAnimation] = useState(false);

  useEffect(() => {
    setDeck(createDeck());
  }, []);

  const createDeck = (): Card[] => {
    const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = [
      { rank: 'A', value: 11 },
      { rank: '2', value: 2 }, { rank: '3', value: 3 }, { rank: '4', value: 4 },
      { rank: '5', value: 5 }, { rank: '6', value: 6 }, { rank: '7', value: 7 },
      { rank: '8', value: 8 }, { rank: '9', value: 9 }, { rank: '10', value: 10 },
      { rank: 'J', value: 10 }, { rank: 'Q', value: 10 }, { rank: 'K', value: 10 }
    ];
    
    const deck: Card[] = [];
    for (let deckCount = 0; deckCount < 6; deckCount++) {
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

  const calculateHandValue = (cards: Card[]): number => {
    let value = 0;
    let aces = 0;

    cards.forEach(card => {
      if (card.rank === 'A') {
        aces++;
      } else {
        value += card.value;
      }
    });

    for (let i = 0; i < aces; i++) {
      if (value + 11 <= 21) {
        value += 11;
      } else {
        value += 1;
      }
    }

    return value;
  };

  const createGameHand = (cards: Card[]): GameHand => {
    const value = calculateHandValue(cards);
    const isBlackjack = cards.length === 2 && value === 21;
    const isBust = value > 21;
    const isSoft = cards.some(card => card.rank === 'A') && value <= 21 && cards.length >= 2;
    const canSplit = cards.length === 2 && cards[0].rank === cards[1].rank;
    const canDouble = cards.length === 2 && !isBlackjack;

    return { cards, value, isBlackjack, isBust, isSoft, canSplit, canDouble };
  };

  const dealCard = (currentDeck: Card[], animated: boolean = true): { card: Card; newDeck: Card[] } => {
    const newDeck = [...currentDeck];
    const card = newDeck.pop()!;
    
    if (animated && soundEnabled) {
      setCardAnimation('dealing');
      setTimeout(() => setCardAnimation(null), 600);
      console.log('🔊 Card deal sound...');
    }
    
    return { card, newDeck };
  };

  const getBasicStrategy = (playerValue: number, dealerUpCard: number, isSoft: boolean, canSplit: boolean, canDouble: boolean): string => {
    if (canSplit) {
      if (playerValue === 16 || playerValue === 18) return 'SPLIT';
      if (playerValue === 22) return 'SPLIT'; // Aces
    }
    
    if (canDouble && playerValue === 11) return 'DOUBLE';
    if (canDouble && playerValue === 10 && dealerUpCard <= 9) return 'DOUBLE';
    if (canDouble && playerValue === 9 && dealerUpCard >= 3 && dealerUpCard <= 6) return 'DOUBLE';
    
    if (isSoft) {
      if (playerValue >= 19) return 'STAND';
      if (playerValue <= 17) return 'HIT';
      return dealerUpCard >= 7 ? 'HIT' : 'STAND';
    }
    
    if (playerValue >= 17) return 'STAND';
    if (playerValue <= 11) return 'HIT';
    if (playerValue >= 12 && playerValue <= 16) {
      return dealerUpCard >= 7 ? 'HIT' : 'STAND';
    }
    
    return 'HIT';
  };

  const startGame = async () => {
    if (!user || betAmount > session.balance) {
      toast.error('Insufficient balance!');
      return;
    }

    try {
      const totalBet = betAmount + sideBets.perfectPairs + sideBets.twentyOnePlusThree;
      placeBet(totalBet);
      
      addTransaction({
        userId: user.id,
        type: 'bet',
        status: 'completed',
        amount: -totalBet,
        currency: 'USD',
        fee: 0,
        method: 'Casino Game',
        description: `${gameName} - Hand (${sideBets.perfectPairs > 0 || sideBets.twentyOnePlusThree > 0 ? 'with side bets' : 'main bet only'})`,
        metadata: {
          gameId,
          gameName,
          betAmount,
          sideBets
        }
      });
      
      setIsPlaying(true);
      setGamePhase('dealing');
      setShowDealerCard(false);
      setMessage('Dealing cards...');
      setDealingAnimation(true);
      setWinAnimation(false);
      
      let currentDeck = createDeck();
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const { card: playerCard1, newDeck: deck1 } = dealCard(currentDeck);
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const { card: dealerCard1, newDeck: deck2 } = dealCard(deck1);
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const { card: playerCard2, newDeck: deck3 } = dealCard(deck2);
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const { card: dealerCard2, newDeck: finalDeck } = dealCard(deck3);
      
      const newPlayerHand = createGameHand([playerCard1, playerCard2]);
      const newDealerHand = createGameHand([dealerCard1, dealerCard2]);
      
      setPlayerHands([newPlayerHand]);
      setDealerHand(newDealerHand);
      setDeck(finalDeck);
      setActiveHandIndex(0);
      setGamePhase('playing');
      setDealingAnimation(false);
      
      // Check side bets
      let sideBetWinnings = 0;
      
      // Perfect Pairs
      if (sideBets.perfectPairs > 0) {
        const isPair = playerCard1.rank === playerCard2.rank;
        if (isPair) {
          const isSameSuit = playerCard1.suit === playerCard2.suit;
          const isSameColor = (playerCard1.suit === 'hearts' || playerCard1.suit === 'diamonds') === 
                             (playerCard2.suit === 'hearts' || playerCard2.suit === 'diamonds');
          
          let multiplier = 6; // Mixed pair
          if (isSameSuit) multiplier = 25; // Perfect pair
          else if (isSameColor) multiplier = 12; // Colored pair
          
          sideBetWinnings += sideBets.perfectPairs * multiplier;
          toast.success(`🎰 Perfect Pairs wins! +${formatCurrency(sideBets.perfectPairs * multiplier)}`);
        }
      }
      
      // 21+3
      if (sideBets.twentyOnePlusThree > 0) {
        const threeCards = [playerCard1, playerCard2, dealerCard1];
        const isFlush = threeCards.every(card => card.suit === threeCards[0].suit);
        const isStraight = checkStraight(threeCards);
        const isThreeOfKind = threeCards.every(card => card.rank === threeCards[0].rank);
        
        let multiplier = 0;
        if (isFlush && isStraight) multiplier = 40; // Straight flush
        else if (isThreeOfKind) multiplier = 30; // Three of a kind
        else if (isStraight) multiplier = 10; // Straight
        else if (isFlush) multiplier = 9; // Flush
        
        if (multiplier > 0) {
          sideBetWinnings += sideBets.twentyOnePlusThree * multiplier;
          toast.success(`🃏 21+3 wins! +${formatCurrency(sideBets.twentyOnePlusThree * multiplier)}`);
        }
      }
      
      if (sideBetWinnings > 0) {
        addWinnings(sideBetWinnings);
        addTransaction({
          userId: user.id,
          type: 'win',
          status: 'completed',
          amount: sideBetWinnings,
          currency: 'USD',
          fee: 0,
          method: 'Casino Game',
          description: `${gameName} - Side Bet Win`,
          metadata: { gameId, gameName, sideBetWin: sideBetWinnings }
        });
      }
      
      // Check for blackjacks
      if (newPlayerHand.isBlackjack) {
        setShowDealerCard(true);
        if (newDealerHand.isBlackjack) {
          setMessage('🤝 Push! Both have blackjack');
          handleGameEnd('push', betAmount);
          setGameStats(prev => ({ ...prev, pushes: prev.pushes + 1 }));
        } else {
          setMessage('🃏 BLACKJACK! You win 3:2!');
          handleGameEnd('blackjack', betAmount * 2.5);
          setGameStats(prev => ({ ...prev, blackjacks: prev.blackjacks + 1, handsWon: prev.handsWon + 1 }));
        }
      } else if (newDealerHand.isBlackjack) {
        setShowDealerCard(true);
        setMessage('💀 Dealer has blackjack. You lose.');
        handleGameEnd('dealer_blackjack', 0);
      } else {
        const strategy = getBasicStrategy(newPlayerHand.value, dealerCard1.value, newPlayerHand.isSoft, newPlayerHand.canSplit, newPlayerHand.canDouble);
        setMessage(`Your turn! Hand value: ${newPlayerHand.value} | Suggested: ${strategy}`);
      }
      
      setGameStats(prev => ({ ...prev, handsPlayed: prev.handsPlayed + 1 }));
      
    } catch (error) {
      console.error('Deal error:', error);
      setIsPlaying(false);
      setGamePhase('betting');
    }
  };

  const checkStraight = (cards: Card[]): boolean => {
    const values = cards.map(c => {
      if (c.rank === 'A') return 1;
      if (c.rank === 'K') return 13;
      if (c.rank === 'Q') return 12;
      if (c.rank === 'J') return 11;
      return parseInt(c.rank);
    }).sort((a, b) => a - b);
    
    return values[2] - values[0] === 2 && values[1] - values[0] === 1;
  };

  const hit = async () => {
    if (!playerHands[activeHandIndex] || !deck.length) return;
    
    const { card, newDeck } = dealCard(deck);
    const currentHand = playerHands[activeHandIndex];
    const newHand = createGameHand([...currentHand.cards, card]);
    
    setPlayerHands(prev => prev.map((hand, index) => 
      index === activeHandIndex ? newHand : hand
    ));
    setDeck(newDeck);
    
    if (newHand.isBust) {
      setMessage(`💥 Hand ${activeHandIndex + 1} busts! (${newHand.value})`);
      setGameStats(prev => ({ ...prev, busts: prev.busts + 1 }));
      
      if (activeHandIndex < playerHands.length - 1) {
        setActiveHandIndex(prev => prev + 1);
        setTimeout(() => {
          setMessage(`Playing hand ${activeHandIndex + 2}`);
        }, 1000);
      } else {
        setTimeout(() => {
          setGamePhase('dealer');
          setShowDealerCard(true);
          dealerPlay();
        }, 1500);
      }
    } else {
      const strategy = getBasicStrategy(newHand.value, dealerHand?.cards[0].value || 10, newHand.isSoft, false, false);
      setMessage(`Hand ${activeHandIndex + 1}: ${newHand.value} | Suggested: ${strategy}`);
    }
  };

  const stand = () => {
    if (activeHandIndex < playerHands.length - 1) {
      setActiveHandIndex(prev => prev + 1);
      setMessage(`Playing hand ${activeHandIndex + 2}`);
    } else {
      setGamePhase('dealer');
      setShowDealerCard(true);
      dealerPlay();
    }
  };

  const doubleDown = async () => {
    if (!user || betAmount > session.balance) {
      toast.error('Insufficient balance for double down!');
      return;
    }

    placeBet(betAmount);
    setGameStats(prev => ({ ...prev, doubles: prev.doubles + 1 }));
    
    addTransaction({
      userId: user.id,
      type: 'bet',
      status: 'completed',
      amount: -betAmount,
      currency: 'USD',
      fee: 0,
      method: 'Casino Game',
      description: `${gameName} - Double Down`,
      metadata: { gameId, gameName, action: 'double_down' }
    });

    await hit();
    if (!playerHands[activeHandIndex]?.isBust) {
      setTimeout(() => stand(), 1000);
    }
  };

  const split = async () => {
    if (!user || betAmount > session.balance) {
      toast.error('Insufficient balance for split!');
      return;
    }

    const currentHand = playerHands[activeHandIndex];
    if (!currentHand.canSplit) return;

    placeBet(betAmount);
    setGameStats(prev => ({ ...prev, splits: prev.splits + 1 }));
    
    addTransaction({
      userId: user.id,
      type: 'bet',
      status: 'completed',
      amount: -betAmount,
      currency: 'USD',
      fee: 0,
      method: 'Casino Game',
      description: `${gameName} - Split Pair`,
      metadata: { gameId, gameName, action: 'split' }
    });

    const card1 = currentHand.cards[0];
    const card2 = currentHand.cards[1];
    
    const { card: newCard1, newDeck: deck1 } = dealCard(deck);
    const { card: newCard2, newDeck: finalDeck } = dealCard(deck1);
    
    const hand1 = createGameHand([card1, newCard1]);
    const hand2 = createGameHand([card2, newCard2]);
    
    setPlayerHands(prev => {
      const newHands = [...prev];
      newHands[activeHandIndex] = hand1;
      newHands.splice(activeHandIndex + 1, 0, hand2);
      return newHands;
    });
    
    setDeck(finalDeck);
    setMessage(`✂️ Split! Playing hand 1 of 2 (${hand1.value})`);
  };

  const dealerPlay = async () => {
    if (!dealerHand || !deck.length) return;
    
    let currentDealerHand = dealerHand;
    let currentDeck = deck;
    
    setMessage('🤖 Dealer playing...');
    
    while (currentDealerHand.value < 17 || (currentDealerHand.value === 17 && currentDealerHand.isSoft)) {
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const { card, newDeck } = dealCard(currentDeck);
      currentDealerHand = createGameHand([...currentDealerHand.cards, card]);
      currentDeck = newDeck;
      
      setDealerHand(currentDealerHand);
      setDeck(currentDeck);
      
      if (currentDealerHand.isBust) {
        setMessage(`💥 Dealer busts with ${currentDealerHand.value}!`);
        break;
      } else {
        setMessage(`🤖 Dealer hits: ${currentDealerHand.value}`);
      }
    }
    
    if (!currentDealerHand.isBust && currentDealerHand.value >= 17) {
      setMessage(`🤖 Dealer stands on ${currentDealerHand.value}`);
    }
    
    setTimeout(() => {
      setGamePhase('finished');
      evaluateHands(currentDealerHand);
    }, 1500);
  };

  const evaluateHands = (finalDealerHand: GameHand) => {
    let totalWinnings = 0;
    let results: string[] = [];
    let handsWon = 0;
    
    playerHands.forEach((hand, index) => {
      if (hand.isBust) {
        results.push(`Hand ${index + 1}: Bust`);
        return;
      }
      
      if (finalDealerHand.isBust) {
        results.push(`Hand ${index + 1}: Win (Dealer bust)`);
        totalWinnings += betAmount * 2;
        handsWon++;
      } else if (hand.isBlackjack && !finalDealerHand.isBlackjack) {
        results.push(`Hand ${index + 1}: Blackjack!`);
        totalWinnings += betAmount * 2.5;
        handsWon++;
      } else if (hand.value > finalDealerHand.value) {
        results.push(`Hand ${index + 1}: Win (${hand.value} vs ${finalDealerHand.value})`);
        totalWinnings += betAmount * 2;
        handsWon++;
      } else if (hand.value === finalDealerHand.value) {
        results.push(`Hand ${index + 1}: Push (${hand.value})`);
        totalWinnings += betAmount;
        setGameStats(prev => ({ ...prev, pushes: prev.pushes + 1 }));
      } else {
        results.push(`Hand ${index + 1}: Lose (${hand.value} vs ${finalDealerHand.value})`);
      }
    });
    
    if (totalWinnings > 0) {
      addWinnings(totalWinnings);
      
      const profit = totalWinnings - (betAmount * playerHands.length);
      if (profit > 0) {
        setGameStats(prev => ({ ...prev, handsWon: prev.handsWon + handsWon }));
        setWinAnimation(true);
        setTimeout(() => setWinAnimation(false), 4000);
      }
      
      addTransaction({
        userId: user.id,
        type: 'win',
        status: 'completed',
        amount: totalWinnings,
        currency: 'USD',
        fee: 0,
        method: 'Casino Game',
        description: `${gameName} - ${results.join(', ')}`,
        metadata: {
          gameId,
          gameName,
          results,
          originalBet: betAmount * playerHands.length,
          profit,
          dealerValue: finalDealerHand.value,
          playerValues: playerHands.map(h => h.value)
        }
      });
      
      if (soundEnabled) {
        console.log('🔊 Win sound playing...');
      }
      
      if (profit > betAmount * 2) {
        toast.success(`🃏 MEGA WIN! +${formatCurrency(totalWinnings)}`, { duration: 6000 });
      } else if (profit > 0) {
        toast.success(`🎉 You win! +${formatCurrency(totalWinnings)}`);
      } else {
        toast.success(`🤝 Push! Bet returned`);
      }
    } else {
      if (soundEnabled) {
        console.log('🔊 Loss sound playing...');
      }
      toast.error('😔 Dealer wins this round');
    }
    
    setMessage(results.join(' | '));
    setIsPlaying(false);
  };

  const handleGameEnd = (result: string, winAmount: number) => {
    setGamePhase('finished');
    setIsPlaying(false);
    
    if (winAmount > 0) {
      addWinnings(winAmount);
      setWinAnimation(true);
      setTimeout(() => setWinAnimation(false), 4000);
      
      addTransaction({
        userId: user.id,
        type: 'win',
        status: 'completed',
        amount: winAmount,
        currency: 'USD',
        fee: 0,
        method: 'Casino Game',
        description: `${gameName} - ${result}`,
        metadata: { gameId, gameName, result, originalBet: betAmount }
      });
    }
  };

  const newGame = () => {
    setGamePhase('betting');
    setPlayerHands([]);
    setDealerHand(null);
    setActiveHandIndex(0);
    setMessage('Place your bet to start the hand');
    setShowDealerCard(false);
    setDeck(createDeck());
    setSideBets({ perfectPairs: 0, twentyOnePlusThree: 0 });
    setWinAnimation(false);
  };

  const renderCard = (card: Card, hidden = false, isDealing = false) => {
    if (hidden) {
      return (
        <div className="w-24 h-36 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl border-3 border-blue-500 flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="w-16 h-20 bg-gradient-to-br from-blue-700 to-blue-900 rounded-xl border-2 border-blue-400 shadow-inner">
            <div className="w-full h-full bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
              <Crown className="w-8 h-8 text-blue-300 opacity-50" />
            </div>
          </div>
        </div>
      );
    }

    const suit = CARD_SUITS[card.suit];
    const isRed = card.suit === 'hearts' || card.suit === 'diamonds';

    return (
      <div className={`w-24 h-36 bg-gradient-to-br from-white to-gray-100 rounded-2xl border-3 border-gray-300 flex flex-col items-center justify-between p-3 shadow-2xl transform hover:scale-110 transition-all duration-300 ${
        isDealing ? 'animate-bounce' : ''
      } relative overflow-hidden`}>
        {/* Card shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
        
        <div className={`text-lg font-bold ${isRed ? 'text-red-500' : 'text-gray-800'} relative z-10`}>
          {card.rank}
        </div>
        <div className="text-5xl relative z-10">
          {suit.symbol}
        </div>
        <div className={`text-lg font-bold transform rotate-180 ${isRed ? 'text-red-500' : 'text-gray-800'} relative z-10`}>
          {card.rank}
        </div>
      </div>
    );
  };

  const renderHand = (hand: GameHand, title: string, isActive = false, isDealer = false) => (
    <div className={`bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-2xl p-6 border-3 transition-all duration-500 shadow-2xl ${
      isActive ? 'border-yellow-400 shadow-yellow-400/30 scale-105' : 
      isDealer ? 'border-red-500/50 shadow-red-500/20' : 'border-slate-600'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white flex items-center space-x-2">
          {isDealer ? <Target className="w-6 h-6 text-red-400" /> : <Trophy className="w-6 h-6 text-yellow-400" />}
          <span>{title}</span>
        </h3>
        <div className="text-right">
          <span className={`text-3xl font-bold ${
            hand.isBust ? 'text-red-400 animate-pulse' :
            hand.isBlackjack ? 'text-yellow-400 animate-pulse' :
            hand.value === 21 ? 'text-green-400' : 'text-white'
          }`}>
            {hand.value}
          </span>
          {hand.isSoft && hand.value !== 21 && (
            <span className="text-sm text-blue-400 ml-2 font-bold">SOFT</span>
          )}
          {hand.isBlackjack && (
            <div className="text-lg text-yellow-400 font-bold animate-bounce">🃏 BLACKJACK!</div>
          )}
          {hand.isBust && (
            <div className="text-lg text-red-400 font-bold animate-pulse">💥 BUST!</div>
          )}
        </div>
      </div>
      
      <div className="flex justify-center space-x-3 flex-wrap mb-4">
        {hand.cards.map((card, index) => (
          <div key={index} className="mb-3">
            {renderCard(card, isDealer && index === 1 && !showDealerCard, cardAnimation === 'dealing')}
          </div>
        ))}
      </div>
      
      {/* Hand Actions */}
      {isActive && gamePhase === 'playing' && !hand.isBust && (
        <div className="space-y-4">
          {showStrategy && (
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-500/30 rounded-xl p-4 text-center">
              <p className="text-lg text-blue-400 font-bold">
                📊 Basic Strategy: {getBasicStrategy(hand.value, dealerHand?.cards[0].value || 10, hand.isSoft, hand.canSplit, hand.canDouble)}
              </p>
            </div>
          )}
          
          <div className="flex justify-center space-x-3">
            <Button 
              onClick={hit} 
              className="px-8 py-4 text-lg font-bold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 transform hover:scale-110 transition-all duration-200 shadow-xl"
            >
              <Target className="w-5 h-5 mr-2" />
              HIT
            </Button>
            <Button 
              onClick={stand} 
              variant="secondary" 
              className="px-8 py-4 text-lg font-bold transform hover:scale-110 transition-all duration-200 shadow-xl"
            >
              <Shield className="w-5 h-5 mr-2" />
              STAND
            </Button>
            {hand.canDouble && (
              <Button 
                onClick={doubleDown} 
                variant="outline" 
                className="px-6 py-4 text-lg font-bold border-2 border-yellow-500 hover:bg-yellow-500/20 transform hover:scale-110 transition-all duration-200"
              >
                <Zap className="w-5 h-5 mr-2" />
                DOUBLE
              </Button>
            )}
            {hand.canSplit && (
              <Button 
                onClick={split} 
                variant="outline" 
                className="px-6 py-4 text-lg font-bold border-2 border-purple-500 hover:bg-purple-500/20 transform hover:scale-110 transition-all duration-200"
              >
                <Split className="w-5 h-5 mr-2" />
                SPLIT
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const currentHand = playerHands[activeHandIndex];
  const winRate = gameStats.handsPlayed > 0 ? (gameStats.handsWon / gameStats.handsPlayed * 100) : 0;
  const totalSideBets = sideBets.perfectPairs + sideBets.twentyOnePlusThree;

  return (
    <div className="bg-gradient-to-b from-slate-800 via-green-900/20 to-slate-900 rounded-3xl p-8 border-2 border-green-500/30 relative overflow-hidden shadow-2xl">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-to-br from-green-500 to-blue-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-red-500 to-purple-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Win Animation Overlay */}
      {winAnimation && (
        <div className="absolute inset-0 bg-gradient-to-r from-green-400/80 via-yellow-400/80 to-orange-500/80 flex items-center justify-center z-40 rounded-3xl animate-pulse">
          <div className="text-center">
            <Crown className="w-20 h-20 text-yellow-200 mx-auto mb-4 animate-bounce" />
            <h2 className="text-6xl font-bold text-white mb-4 animate-bounce">WINNER!</h2>
            <p className="text-3xl font-bold text-yellow-200">🃏 Blackjack Victory! 🃏</p>
          </div>
        </div>
      )}

      {/* Game Header */}
      <div className="relative z-10 text-center mb-8">
        <div className="flex items-center justify-center space-x-4 mb-6">
          <Trophy className="w-10 h-10 text-green-400 animate-pulse" />
          <h2 className="text-5xl font-bold bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            {gameName}
          </h2>
          <Trophy className="w-10 h-10 text-green-400 animate-pulse" />
        </div>
        
        <div className="flex justify-center space-x-12 text-lg">
          <div className="text-center">
            <p className="text-slate-400 font-medium">Balance</p>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(session.balance)}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 font-medium">Bet</p>
            <p className="text-2xl font-bold text-blue-400">{formatCurrency(betAmount + totalSideBets)}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 font-medium">Win Rate</p>
            <p className="text-2xl font-bold text-purple-400">{winRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Game Message */}
      <div className="relative z-10 text-center mb-8">
        <div className="bg-gradient-to-r from-slate-800 via-blue-800/30 to-slate-800 rounded-2xl p-6 border-2 border-blue-500/30 shadow-xl">
          <p className="text-2xl font-bold text-yellow-400">{message}</p>
        </div>
      </div>

      {/* Game Table */}
      <div className="relative z-10 bg-gradient-to-br from-green-800 via-green-900 to-black rounded-3xl p-8 mb-8 border-4 border-green-600 shadow-2xl">
        {/* Dealer Hand */}
        <div className="mb-12">
          {dealerHand && renderHand(dealerHand, 'Dealer', false, true)}
        </div>

        {/* Player Hands */}
        <div className="space-y-6">
          {playerHands.map((hand, index) => 
            renderHand(hand, `Your Hand ${playerHands.length > 1 ? `#${index + 1}` : ''}`, index === activeHandIndex)
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-10 space-y-6">
        {gamePhase === 'betting' && (
          <>
            {/* Main Bet */}
            <div className="bg-gradient-to-br from-slate-800 via-green-800/20 to-slate-800 rounded-2xl p-8 border-2 border-green-500/30 shadow-xl">
              <h4 className="text-2xl font-bold mb-6 text-center text-green-400">Place Your Bet</h4>
              <div className="flex items-center justify-center space-x-4 mb-8">
                <Button variant="outline" onClick={() => setBetAmount(5)} className="text-lg font-bold px-6 py-3">
                  $5
                </Button>
                <Button variant="outline" onClick={() => setBetAmount(10)} className="text-lg font-bold px-6 py-3">
                  $10
                </Button>
                <Button variant="outline" onClick={() => setBetAmount(25)} className="text-lg font-bold px-6 py-3">
                  $25
                </Button>
                <Button variant="outline" onClick={() => setBetAmount(50)} className="text-lg font-bold px-6 py-3">
                  $50
                </Button>
                <Button variant="outline" onClick={() => setBetAmount(100)} className="text-lg font-bold px-6 py-3">
                  $100
                </Button>
                <div className="flex items-center space-x-3">
                  <Coins className="w-6 h-6 text-yellow-400" />
                  <Input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-32 text-center text-xl font-bold"
                    min="1"
                    max={session.balance}
                  />
                </div>
              </div>
              
              {/* Side Bets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-purple-700/30 to-purple-800/30 rounded-xl p-6 border-2 border-purple-500/30">
                  <h5 className="text-xl font-bold text-purple-400 mb-3 flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Perfect Pairs
                  </h5>
                  <p className="text-sm text-slate-300 mb-4">Win if your first 2 cards are a pair</p>
                  <div className="flex items-center space-x-3">
                    <Input
                      type="number"
                      value={sideBets.perfectPairs}
                      onChange={(e) => setSideBets(prev => ({ ...prev, perfectPairs: parseInt(e.target.value) || 0 }))}
                      className="w-24 text-center text-lg font-bold"
                      min="0"
                      max={50}
                      placeholder="0"
                    />
                    <div className="text-center">
                      <p className="text-lg font-bold text-yellow-400">Pays up to 25:1</p>
                      <p className="text-xs text-slate-400">Perfect • Colored • Mixed</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-700/30 to-orange-800/30 rounded-xl p-6 border-2 border-orange-500/30">
                  <h5 className="text-xl font-bold text-orange-400 mb-3 flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    21+3
                  </h5>
                  <p className="text-sm text-slate-300 mb-4">Poker hands with your 2 cards + dealer's up card</p>
                  <div className="flex items-center space-x-3">
                    <Input
                      type="number"
                      value={sideBets.twentyOnePlusThree}
                      onChange={(e) => setSideBets(prev => ({ ...prev, twentyOnePlusThree: parseInt(e.target.value) || 0 }))}
                      className="w-24 text-center text-lg font-bold"
                      min="0"
                      max={50}
                      placeholder="0"
                    />
                    <div className="text-center">
                      <p className="text-lg font-bold text-yellow-400">Pays up to 40:1</p>
                      <p className="text-xs text-slate-400">Straight Flush • Three of Kind</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button
                onClick={startGame}
                disabled={betAmount > session.balance || betAmount < 1}
                className="px-16 py-6 text-2xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 hover:from-green-500 hover:via-blue-500 hover:to-purple-500 transform hover:scale-110 transition-all duration-300 shadow-2xl shadow-green-500/30 rounded-2xl border-2 border-green-400"
              >
                <Trophy className="w-8 h-8 mr-3" />
                DEAL CARDS
              </Button>
            </div>
          </>
        )}

        {gamePhase === 'finished' && (
          <div className="flex justify-center space-x-6">
            <Button 
              onClick={newGame} 
              className="px-12 py-6 text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 transform hover:scale-110 transition-all duration-300 shadow-xl rounded-2xl"
            >
              <Trophy className="w-6 h-6 mr-3" />
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
        <div className="flex justify-center space-x-6 mt-6">
          <Button
            variant="ghost"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-4"
          >
            {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => setShowStrategy(!showStrategy)}
            className="p-4"
          >
            <Shield className="w-6 h-6 mr-2" />
            Strategy Helper
          </Button>
        </div>
      </div>

      {/* Game Statistics */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-6 gap-4 text-center mt-8">
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl p-4 border-2 border-slate-600 shadow-lg">
          <p className="text-slate-400 font-medium">Hands</p>
          <p className="text-2xl font-bold text-white">{gameStats.handsPlayed}</p>
        </div>
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl p-4 border-2 border-slate-600 shadow-lg">
          <p className="text-slate-400 font-medium">Won</p>
          <p className="text-2xl font-bold text-green-400">{gameStats.handsWon}</p>
        </div>
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl p-4 border-2 border-slate-600 shadow-lg">
          <p className="text-slate-400 font-medium">Blackjacks</p>
          <p className="text-2xl font-bold text-yellow-400">{gameStats.blackjacks}</p>
        </div>
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl p-4 border-2 border-slate-600 shadow-lg">
          <p className="text-slate-400 font-medium">Doubles</p>
          <p className="text-2xl font-bold text-blue-400">{gameStats.doubles}</p>
        </div>
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl p-4 border-2 border-slate-600 shadow-lg">
          <p className="text-slate-400 font-medium">Splits</p>
          <p className="text-2xl font-bold text-purple-400">{gameStats.splits}</p>
        </div>
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl p-4 border-2 border-slate-600 shadow-lg">
          <p className="text-slate-400 font-medium">Win Rate</p>
          <p className="text-2xl font-bold text-green-400">{winRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Strategy Guide Modal */}
      {showStrategy && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-8 border-2 border-green-500 max-w-4xl w-full max-h-[90vh] overflow-auto shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                🃏 Blackjack Strategy Guide
              </h3>
              <Button variant="ghost" onClick={() => setShowStrategy(false)} className="text-2xl">
                ✕
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-700/30 to-green-800/30 rounded-xl p-6 border-2 border-green-500/30">
                <h4 className="text-xl font-bold text-green-400 mb-4">✅ When to Hit</h4>
                <ul className="text-lg text-slate-300 space-y-2">
                  <li>• Always hit on 11 or less</li>
                  <li>• Hit on 12-16 when dealer shows 7-Ace</li>
                  <li>• Hit on soft 17 or less</li>
                  <li>• Hit on soft 18 vs dealer 9, 10, A</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-blue-700/30 to-blue-800/30 rounded-xl p-6 border-2 border-blue-500/30">
                <h4 className="text-xl font-bold text-blue-400 mb-4">🛑 When to Stand</h4>
                <ul className="text-lg text-slate-300 space-y-2">
                  <li>• Always stand on hard 17 or more</li>
                  <li>• Stand on 12-16 when dealer shows 2-6</li>
                  <li>• Stand on soft 19 or more</li>
                  <li>• Stand on soft 18 vs dealer 2-8</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-700/30 to-yellow-800/30 rounded-xl p-6 border-2 border-yellow-500/30">
                <h4 className="text-xl font-bold text-yellow-400 mb-4">⚡ When to Double Down</h4>
                <ul className="text-lg text-slate-300 space-y-2">
                  <li>• Always double on 11 vs any dealer card</li>
                  <li>• Double on 10 vs dealer 2-9</li>
                  <li>• Double on 9 vs dealer 3-6</li>
                  <li>• Double soft 13-18 vs dealer 5-6</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-purple-700/30 to-purple-800/30 rounded-xl p-6 border-2 border-purple-500/30">
                <h4 className="text-xl font-bold text-purple-400 mb-4">✂️ When to Split</h4>
                <ul className="text-lg text-slate-300 space-y-2">
                  <li>• Always split Aces and 8s</li>
                  <li>• Never split 10s, 5s, or 4s</li>
                  <li>• Split 2s, 3s, 6s, 7s vs dealer 2-7</li>
                  <li>• Split 9s vs dealer 2-9 (except 7)</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-xl p-6 border-2 border-red-500/30">
              <h4 className="text-xl font-bold text-red-400 mb-4">🎯 Side Bet Strategies</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg text-slate-300">
                <div>
                  <p className="font-bold text-purple-400">Perfect Pairs:</p>
                  <p>• Perfect Pair (same suit): 25:1</p>
                  <p>• Colored Pair (same color): 12:1</p>
                  <p>• Mixed Pair (different color): 6:1</p>
                </div>
                <div>
                  <p className="font-bold text-orange-400">21+3:</p>
                  <p>• Straight Flush: 40:1</p>
                  <p>• Three of a Kind: 30:1</p>
                  <p>• Straight: 10:1</p>
                  <p>• Flush: 9:1</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}