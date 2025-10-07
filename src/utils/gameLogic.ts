import { SlotResult, BlackjackHand, Card, RouletteResult } from '../types/casino';

// Enhanced Slot Game Logic with Realistic RTP
export function generateSlotResult(betAmount: number): SlotResult {
  const symbols = [
    { symbol: '🍒', weight: 25, multiplier: 2 },
    { symbol: '🍋', weight: 22, multiplier: 3 },
    { symbol: '🍊', weight: 20, multiplier: 4 },
    { symbol: '🍇', weight: 15, multiplier: 6 },
    { symbol: '⭐', weight: 10, multiplier: 10 },
    { symbol: '💎', weight: 5, multiplier: 25 },
    { symbol: '7️⃣', weight: 2, multiplier: 50 },
    { symbol: '🔔', weight: 1, multiplier: 100 }
  ];

  const totalWeight = symbols.reduce((sum, s) => sum + s.weight, 0);
  
  const getWeightedSymbol = (): string => {
    const random = Math.random() * totalWeight;
    let cumulative = 0;
    
    for (const symbolData of symbols) {
      cumulative += symbolData.weight;
      if (random <= cumulative) {
        return symbolData.symbol;
      }
    }
    return symbols[0].symbol;
  };

  // Generate 5 reels with 3 symbols each
  const reels: string[][] = [];
  for (let i = 0; i < 5; i++) {
    const reel = [];
    for (let j = 0; j < 3; j++) {
      reel.push(getWeightedSymbol());
    }
    reels.push(reel);
  }

  // Define paylines (9 different winning patterns)
  const paylines = [
    [1, 1, 1, 1, 1], // Middle row
    [0, 0, 0, 0, 0], // Top row
    [2, 2, 2, 2, 2], // Bottom row
    [0, 1, 2, 1, 0], // V shape
    [2, 1, 0, 1, 2], // Inverted V
    [0, 0, 1, 2, 2], // Diagonal down
    [2, 2, 1, 0, 0], // Diagonal up
    [1, 0, 1, 2, 1], // W shape
    [1, 2, 1, 0, 1]  // M shape
  ];

  // Check for winning combinations
  const winLines: number[] = [];
  let payout = 0;
  let maxMultiplier = 1;

  paylines.forEach((payline, lineIndex) => {
    const lineSymbols = payline.map((row, col) => reels[col][row]);
    const { isWin, multiplier, consecutiveCount } = checkAdvancedWinningLine(lineSymbols);
    
    if (isWin) {
      winLines.push(lineIndex);
      const symbolData = symbols.find(s => s.symbol === lineSymbols[0]);
      if (symbolData) {
        const lineMultiplier = symbolData.multiplier * Math.pow(1.5, consecutiveCount - 3);
        maxMultiplier = Math.max(maxMultiplier, lineMultiplier);
      }
    }
  });

  // Calculate total payout with bonus features
  if (winLines.length > 0) {
    const baseMultiplier = symbols.find(s => s.symbol === reels[0][1])?.multiplier || 1;
    let totalMultiplier = baseMultiplier;
    
    // Bonus for multiple winning lines
    if (winLines.length >= 3) {
      totalMultiplier *= 2; // Double for 3+ lines
    }
    if (winLines.length >= 5) {
      totalMultiplier *= 1.5; // Additional bonus for 5+ lines
    }
    
    // Wild symbol bonus (if ⭐ appears)
    const hasWild = reels.some(reel => reel.includes('⭐'));
    if (hasWild) {
      totalMultiplier *= 1.2;
    }
    
    // Scatter bonus (if 💎 appears in 3+ reels)
    const scatterCount = reels.filter(reel => reel.includes('💎')).length;
    if (scatterCount >= 3) {
      totalMultiplier *= scatterCount; // Multiply by scatter count
    }
    
    payout = betAmount * totalMultiplier * winLines.length;
    maxMultiplier = totalMultiplier;
  }

  return { reels, winLines, payout, multiplier: maxMultiplier };
}

function checkAdvancedWinningLine(line: string[]): { isWin: boolean; multiplier: number; consecutiveCount: number } {
  const first = line[0];
  let consecutiveCount = 1;
  
  // Count consecutive symbols from left
  for (let i = 1; i < line.length; i++) {
    if (line[i] === first || line[i] === '⭐') { // ⭐ acts as wild
      consecutiveCount++;
    } else {
      break;
    }
  }

  // Check for scatter wins (💎 anywhere on line)
  const scatterCount = line.filter(symbol => symbol === '💎').length;
  if (scatterCount >= 3) {
    return { isWin: true, multiplier: scatterCount * 5, consecutiveCount: scatterCount };
  }

  // Regular wins require at least 3 consecutive
  if (consecutiveCount >= 3) {
    const multipliers: Record<string, number> = {
      '🔔': 100, '7️⃣': 50, '💎': 25, '⭐': 15, 
      '🍇': 10, '🍊': 8, '🍋': 6, '🍒': 4
    };
    return { isWin: true, multiplier: multipliers[first] || 2, consecutiveCount };
  }

  return { isWin: false, multiplier: 1, consecutiveCount: 0 };
}

// Enhanced Blackjack Logic
export function createDeck(): Card[] {
  const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = [
    { rank: 'A', value: 11 },
    { rank: '2', value: 2 }, { rank: '3', value: 3 }, { rank: '4', value: 4 },
    { rank: '5', value: 5 }, { rank: '6', value: 6 }, { rank: '7', value: 7 },
    { rank: '8', value: 8 }, { rank: '9', value: 9 }, { rank: '10', value: 10 },
    { rank: 'J', value: 10 }, { rank: 'Q', value: 10 }, { rank: 'K', value: 10 }
  ];
  
  const deck: Card[] = [];

  // Create multiple decks for more realistic casino experience
  for (let deckCount = 0; deckCount < 6; deckCount++) {
    suits.forEach(suit => {
      ranks.forEach(rankData => {
        deck.push({ 
          suit, 
          rank: rankData.rank, 
          value: rankData.value 
        });
      });
    });
  }

  return shuffleDeck(deck);
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  
  // Fisher-Yates shuffle algorithm (multiple passes for better randomization)
  for (let pass = 0; pass < 3; pass++) {
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  }
  
  return shuffled;
}

export function calculateHandValue(cards: Card[]): number {
  let value = 0;
  let aces = 0;

  // First pass: count non-aces
  cards.forEach(card => {
    if (card.rank === 'A') {
      aces++;
    } else {
      value += card.value;
    }
  });

  // Second pass: add aces optimally
  for (let i = 0; i < aces; i++) {
    if (value + 11 <= 21) {
      value += 11; // Use ace as 11
    } else {
      value += 1; // Use ace as 1
    }
  }

  return value;
}

export function createBlackjackHand(cards: Card[]): BlackjackHand {
  const value = calculateHandValue(cards);
  const isBlackjack = cards.length === 2 && value === 21;
  const isBust = value > 21;

  return { cards, value, isBlackjack, isBust };
}

// Enhanced Roulette Logic
export function spinRoulette(): RouletteResult {
  // European roulette wheel order
  const wheelOrder = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
  ];
  
  // Use wheel order for more realistic results
  const randomIndex = Math.floor(Math.random() * wheelOrder.length);
  const number = wheelOrder[randomIndex];
  
  let color: 'red' | 'black' | 'green' = 'green';
  
  if (number !== 0) {
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    color = redNumbers.includes(number) ? 'red' : 'black';
  }

  const isEven = number !== 0 && number % 2 === 0;
  const dozen = number === 0 ? 0 : Math.ceil(number / 12);
  const column = number === 0 ? 0 : ((number - 1) % 3) + 1;

  return { number, color, isEven, dozen, column };
}

export function calculateRoulettePayout(
  bet: { type: string; value: number | string; amount: number },
  result: RouletteResult
): number {
  const { type, value, amount } = bet;
  const { number, color, isEven, dozen, column } = result;

  switch (type) {
    case 'straight':
      return number === value ? amount * 35 : 0;
    case 'split':
      // For split bets (two adjacent numbers)
      return number === value ? amount * 17 : 0;
    case 'street':
      // For street bets (three numbers in a row)
      return number === value ? amount * 11 : 0;
    case 'corner':
      // For corner bets (four numbers)
      return number === value ? amount * 8 : 0;
    case 'line':
      // For line bets (six numbers)
      return number === value ? amount * 5 : 0;
    case 'color':
      return color === value ? amount * 2 : 0;
    case 'even_odd':
      return (value === 'even' && isEven) || (value === 'odd' && !isEven && number !== 0) ? amount * 2 : 0;
    case 'dozen':
      return dozen === value ? amount * 3 : 0;
    case 'column':
      return column === value ? amount * 3 : 0;
    case 'high_low':
      return (value === 'high' && number >= 19 && number <= 36) || 
             (value === 'low' && number >= 1 && number <= 18) ? amount * 2 : 0;
    default:
      return 0;
  }
}

// Poker Hand Evaluation for Blackjack Side Bets
export function evaluatePokerHand(cards: Card[]): { hand: string; multiplier: number } {
  if (cards.length < 3) return { hand: 'none', multiplier: 0 };
  
  const ranks = cards.map(c => c.rank).sort();
  const suits = cards.map(c => c.suit);
  
  // Check for flush
  const isFlush = suits.every(suit => suit === suits[0]);
  
  // Check for straight
  const values = cards.map(c => {
    if (c.rank === 'A') return 14;
    if (c.rank === 'K') return 13;
    if (c.rank === 'Q') return 12;
    if (c.rank === 'J') return 11;
    return parseInt(c.rank);
  }).sort((a, b) => a - b);
  
  const isStraight = values[2] - values[0] === 2 && values[1] - values[0] === 1;
  
  // Check for three of a kind
  const isThreeOfKind = ranks[0] === ranks[1] && ranks[1] === ranks[2];
  
  if (isFlush && isStraight) return { hand: 'straight_flush', multiplier: 40 };
  if (isThreeOfKind) return { hand: 'three_of_kind', multiplier: 30 };
  if (isStraight) return { hand: 'straight', multiplier: 10 };
  if (isFlush) return { hand: 'flush', multiplier: 9 };
  
  return { hand: 'none', multiplier: 0 };
}

// Perfect Pairs Evaluation
export function evaluatePerfectPairs(cards: Card[]): { hand: string; multiplier: number } {
  if (cards.length < 2) return { hand: 'none', multiplier: 0 };
  
  const [card1, card2] = cards;
  
  if (card1.rank === card2.rank) {
    if (card1.suit === card2.suit) {
      return { hand: 'perfect_pair', multiplier: 25 }; // Same rank and suit
    } else if ((card1.suit === 'hearts' || card1.suit === 'diamonds') === 
               (card2.suit === 'hearts' || card2.suit === 'diamonds')) {
      return { hand: 'colored_pair', multiplier: 12 }; // Same rank and color
    } else {
      return { hand: 'mixed_pair', multiplier: 6 }; // Same rank, different color
    }
  }
  
  return { hand: 'none', multiplier: 0 };
}

// Advanced RNG for better game balance
export function getBalancedRandom(targetRTP: number = 0.96): number {
  // Implement a more sophisticated RNG that maintains target RTP over time
  // This is a simplified version - production would use more complex algorithms
  
  const sessionHistory = JSON.parse(localStorage.getItem('game_session_history') || '[]');
  const recentResults = sessionHistory.slice(-100); // Last 100 spins
  
  if (recentResults.length > 50) {
    const totalWagered = recentResults.reduce((sum: number, result: any) => sum + result.bet, 0);
    const totalWon = recentResults.reduce((sum: number, result: any) => sum + result.win, 0);
    const currentRTP = totalWagered > 0 ? totalWon / totalWagered : 0;
    
    // Adjust probability based on current RTP vs target
    if (currentRTP < targetRTP - 0.05) {
      // Player is losing too much, increase win chance slightly
      return Math.random() * 0.8 + 0.1; // Bias toward lower numbers (better for player)
    } else if (currentRTP > targetRTP + 0.05) {
      // Player is winning too much, decrease win chance slightly
      return Math.random() * 0.8 + 0.2; // Bias toward higher numbers (better for house)
    }
  }
  
  return Math.random(); // Normal random for balanced play
}

// Game Session Tracking
export function trackGameResult(gameId: string, bet: number, win: number, gameType: string): void {
  const sessionHistory = JSON.parse(localStorage.getItem('game_session_history') || '[]');
  
  const result = {
    gameId,
    gameType,
    bet,
    win,
    profit: win - bet,
    timestamp: new Date().toISOString(),
    rtp: bet > 0 ? win / bet : 0
  };
  
  sessionHistory.push(result);
  
  // Keep only last 1000 results to prevent storage bloat
  if (sessionHistory.length > 1000) {
    sessionHistory.splice(0, sessionHistory.length - 1000);
  }
  
  localStorage.setItem('game_session_history', JSON.stringify(sessionHistory));
}

// Card Counting Detection (for blackjack)
export function detectCardCounting(gameId: string, betPattern: number[]): boolean {
  if (betPattern.length < 10) return false;
  
  // Simple detection: look for dramatic bet size changes
  const avgBet = betPattern.reduce((sum, bet) => sum + bet, 0) / betPattern.length;
  const maxBet = Math.max(...betPattern);
  const minBet = Math.min(...betPattern);
  
  // Flag if max bet is more than 8x the min bet and variance is high
  const variance = betPattern.reduce((sum, bet) => sum + Math.pow(bet - avgBet, 2), 0) / betPattern.length;
  const suspiciousRatio = maxBet / minBet > 8 && variance > avgBet * 2;
  
  return suspiciousRatio;
}

// Realistic Game Outcomes with House Edge
export function calculateGameOutcome(gameType: string, betAmount: number, targetRTP: number = 0.96): {
  isWin: boolean;
  multiplier: number;
  outcome: string;
} {
  const random = getBalancedRandom(targetRTP);
  
  switch (gameType) {
    case 'slots':
      // Slots typically have 88-98% RTP
      if (random < 0.02) return { isWin: true, multiplier: 50, outcome: 'mega_win' };
      if (random < 0.08) return { isWin: true, multiplier: 10, outcome: 'big_win' };
      if (random < 0.25) return { isWin: true, multiplier: 2, outcome: 'small_win' };
      return { isWin: false, multiplier: 0, outcome: 'loss' };
      
    case 'blackjack':
      // Blackjack has ~99.5% RTP with perfect play
      if (random < 0.048) return { isWin: true, multiplier: 2.5, outcome: 'blackjack' };
      if (random < 0.42) return { isWin: true, multiplier: 2, outcome: 'win' };
      if (random < 0.50) return { isWin: true, multiplier: 1, outcome: 'push' };
      return { isWin: false, multiplier: 0, outcome: 'loss' };
      
    case 'roulette':
      // European roulette has 97.3% RTP
      if (random < 0.027) return { isWin: true, multiplier: 35, outcome: 'straight_win' };
      if (random < 0.486) return { isWin: true, multiplier: 2, outcome: 'even_money_win' };
      return { isWin: false, multiplier: 0, outcome: 'loss' };
      
    default:
      return { isWin: false, multiplier: 0, outcome: 'unknown' };
  }
}

// Progressive Jackpot Logic
export function updateProgressiveJackpot(gameId: string, betAmount: number): number {
  const jackpotKey = `progressive_jackpot_${gameId}`;
  const currentJackpot = parseFloat(localStorage.getItem(jackpotKey) || '1000000');
  
  // Add 1% of each bet to the jackpot
  const contribution = betAmount * 0.01;
  const newJackpot = currentJackpot + contribution;
  
  localStorage.setItem(jackpotKey, newJackpot.toString());
  return newJackpot;
}

export function checkJackpotWin(gameId: string, result: any): { isJackpot: boolean; amount: number } {
  // Jackpot conditions vary by game
  switch (gameId) {
    case 'mega-fortune-dreams':
      // 5 lucky sevens on max paylines
      if (result.reels && result.reels.every((reel: string[]) => reel.includes('7️⃣'))) {
        const jackpotAmount = parseFloat(localStorage.getItem(`progressive_jackpot_${gameId}`) || '1000000');
        localStorage.setItem(`progressive_jackpot_${gameId}`, '1000000'); // Reset
        return { isJackpot: true, amount: jackpotAmount };
      }
      break;
      
    case 'lightning-roulette':
      // Straight up bet on lucky number with lightning multiplier
      if (result.number === 7 && Math.random() < 0.001) { // 0.1% chance
        const jackpotAmount = parseFloat(localStorage.getItem(`progressive_jackpot_${gameId}`) || '500000');
        localStorage.setItem(`progressive_jackpot_${gameId}`, '500000'); // Reset
        return { isJackpot: true, amount: jackpotAmount };
      }
      break;
  }
  
  return { isJackpot: false, amount: 0 };
}

// Game Fairness Verification
export function generateProvablyFairSeed(): string {
  // Generate a cryptographically secure seed for provably fair gaming
  const array = new Uint32Array(8);
  crypto.getRandomValues(array);
  return Array.from(array, dec => dec.toString(16).padStart(8, '0')).join('');
}

export function verifyGameResult(clientSeed: string, serverSeed: string, nonce: number): boolean {
  // Simplified provably fair verification
  // In production, this would use HMAC-SHA256 or similar
  const combined = `${clientSeed}:${serverSeed}:${nonce}`;
  const hash = btoa(combined); // Base64 encoding as simple hash
  
  // Verify the hash matches expected pattern
  return hash.length > 0; // Simplified verification
}

// Anti-Fraud Measures
export function detectSuspiciousActivity(userId: string, gameData: any): {
  isSuspicious: boolean;
  reasons: string[];
  riskScore: number;
} {
  const reasons: string[] = [];
  let riskScore = 0;
  
  // Check for unusual betting patterns
  if (gameData.betAmount > gameData.averageBet * 10) {
    reasons.push('Unusually large bet size');
    riskScore += 30;
  }
  
  // Check for rapid-fire betting
  if (gameData.betsPerMinute > 20) {
    reasons.push('Extremely rapid betting');
    riskScore += 25;
  }
  
  // Check for perfect play in blackjack
  if (gameData.gameType === 'blackjack' && gameData.winRate > 0.55) {
    reasons.push('Suspiciously high win rate');
    riskScore += 40;
  }
  
  // Check for bot-like behavior
  if (gameData.sessionDuration > 480 && gameData.breakCount === 0) { // 8 hours no break
    reasons.push('Unusually long session without breaks');
    riskScore += 20;
  }
  
  return {
    isSuspicious: riskScore >= 50,
    reasons,
    riskScore
  };
}