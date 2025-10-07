export interface Sport {
  id: string;
  name: string;
  slug: string;
  category: string;
  active: boolean;
  sortOrder: number;
  icon: string;
}

export interface Competition {
  id: string;
  sportId: string;
  name: string;
  slug: string;
  country: string;
  season: string;
  active: boolean;
}

export interface Event {
  id: string;
  competitionId: string;
  name: string;
  homeTeam: string;
  awayTeam: string;
  startTime: Date;
  status: 'upcoming' | 'live' | 'finished' | 'cancelled' | 'postponed';
  score?: {
    home: number;
    away: number;
    period?: string;
    time?: string;
  };
  metadata?: Record<string, any>;
}

export interface Market {
  id: string;
  eventId: string;
  name: string;
  marketType: string;
  status: 'active' | 'suspended' | 'settled' | 'cancelled';
  selections: Selection[];
}

export interface Selection {
  id: string;
  marketId: string;
  name: string;
  odds: number;
  status: 'active' | 'suspended' | 'winning' | 'losing' | 'void';
  probability?: number;
}

export interface Bet {
  id: string;
  userId: string;
  selectionId: string;
  stake: number;
  odds: number;
  potentialPayout: number;
  currency: string;
  status: 'pending' | 'accepted' | 'rejected' | 'won' | 'lost' | 'void' | 'cancelled';
  placedAt: Date;
  settledAt?: Date;
  payout?: number;
  metadata?: Record<string, any>;
}

export interface BetSlipItem {
  id: string;
  event: string;
  market: string;
  selection: string;
  odds: number;
  stake: number;
}

export interface CashOutOffer {
  betId: string;
  amount: number;
  percentage: number;
  expiresAt: Date;
}