export interface Promotion {
  id: string;
  name: string;
  description: string;
  type: 'welcome_bonus' | 'deposit_bonus' | 'free_bet' | 'cashback' | 'loyalty_points' | 'odds_boost';
  status: 'active' | 'inactive' | 'expired' | 'draft';
  startDate: Date;
  endDate: Date;
  terms: string;
  eligibility: PromotionEligibility;
  reward: PromotionReward;
  usage: PromotionUsage;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromotionEligibility {
  minDeposit?: number;
  maxUsers?: number;
  countries?: string[];
  newUsersOnly?: boolean;
  minOdds?: number;
  sports?: string[];
  markets?: string[];
}

export interface PromotionReward {
  type: 'percentage' | 'fixed_amount' | 'free_bet' | 'points';
  value: number;
  maxAmount?: number;
  currency?: string;
  wagering?: number; // wagering requirement multiplier
}

export interface PromotionUsage {
  totalClaimed: number;
  totalRedeemed: number;
  totalValue: number;
  maxClaims?: number;
}

export interface UserPromotion {
  id: string;
  userId: string;
  promotionId: string;
  status: 'claimed' | 'active' | 'completed' | 'expired' | 'forfeited';
  claimedAt: Date;
  expiresAt: Date;
  wageringRequired: number;
  wageringCompleted: number;
  bonusAmount: number;
  completedAt?: Date;
}