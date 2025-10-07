export interface CasinoGame {
  id: string;
  name: string;
  provider: string;
  category: 'slots' | 'table' | 'live' | 'jackpots' | 'lottery';
  rtp: number;
  volatility: 'Low' | 'Medium' | 'High';
  minBet: number;
  maxBet: number;
  featured: boolean;
  image: string;
  jackpot?: number;
  players?: number;
}

export interface GameSession {
  id: string;
  gameId: string;
  balance: number;
  totalWagered: number;
  totalWon: number;
  spinsPlayed: number;
  startTime: Date;
}

export interface SlotResult {
  reels: string[][];
  winLines: number[];
  payout: number;
  multiplier: number;
}

export interface BlackjackHand {
  cards: Card[];
  value: number;
  isBlackjack: boolean;
  isBust: boolean;
}

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: string;
  value: number;
}

export interface RouletteResult {
  number: number;
  color: 'red' | 'black' | 'green';
  isEven: boolean;
  dozen: number;
  column: number;
}