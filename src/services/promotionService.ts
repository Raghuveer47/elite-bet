import { Promotion, UserPromotion, PromotionEligibility } from '../types/promotions';

export class PromotionService {
  private static readonly PROMO_STORAGE_KEY = 'elitebet_promotions';

  static savePromoData(data: any): void {
    try {
      localStorage.setItem(this.PROMO_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save promotion data:', error);
    }
  }

  static loadPromoData(): any {
    try {
      const stored = localStorage.getItem(this.PROMO_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        // Convert date strings back to Date objects
        if (data.promotions) {
          data.promotions = data.promotions.map((promo: any) => ({
            ...promo,
            startDate: new Date(promo.startDate),
            endDate: new Date(promo.endDate),
            createdAt: new Date(promo.createdAt),
            updatedAt: new Date(promo.updatedAt)
          }));
        }
        if (data.userPromotions) {
          data.userPromotions = data.userPromotions.map((userPromo: any) => ({
            ...userPromo,
            claimedAt: new Date(userPromo.claimedAt),
            expiresAt: new Date(userPromo.expiresAt),
            completedAt: userPromo.completedAt ? new Date(userPromo.completedAt) : undefined
          }));
        }
        return data;
      }
      return { 
        promotions: this.getDefaultPromotions(), 
        userPromotions: [] 
      };
    } catch (error) {
      console.error('Failed to load promotion data:', error);
      return { 
        promotions: this.getDefaultPromotions(), 
        userPromotions: [] 
      };
    }
  }

  static getDefaultPromotions(): Promotion[] {
    return [
      {
        id: 'welcome_bonus_2025',
        name: '100% Welcome Bonus',
        description: 'Double your first deposit up to $500',
        type: 'welcome_bonus',
        status: 'active',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        terms: 'Minimum deposit $20. Wagering requirement 30x. Valid for 30 days.',
        eligibility: {
          minDeposit: 20,
          newUsersOnly: true,
          countries: ['US', 'CA', 'GB', 'AU']
        },
        reward: {
          type: 'percentage',
          value: 100,
          maxAmount: 500,
          currency: 'USD',
          wagering: 30
        },
        usage: {
          totalClaimed: 0,
          totalRedeemed: 0,
          totalValue: 0,
          maxClaims: 10000
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'sports_free_bet',
        name: '$25 Free Sports Bet',
        description: 'Free bet for new sports bettors',
        type: 'free_bet',
        status: 'active',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        terms: 'Minimum odds 1.50. Valid for 7 days. Winnings credited as cash.',
        eligibility: {
          newUsersOnly: true,
          minOdds: 1.50,
          sports: ['football', 'basketball', 'soccer']
        },
        reward: {
          type: 'fixed_amount',
          value: 25,
          currency: 'USD'
        },
        usage: {
          totalClaimed: 0,
          totalRedeemed: 0,
          totalValue: 0,
          maxClaims: 5000
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  static getActivePromotions(): Promotion[] {
    const promoData = this.loadPromoData();
    const now = new Date();
    
    return (promoData.promotions || []).filter((promo: Promotion) => 
      promo.status === 'active' && 
      now >= new Date(promo.startDate) && 
      now <= new Date(promo.endDate)
    );
  }

  static async claimPromotion(userId: string, promotionId: string): Promise<UserPromotion> {
    const promoData = this.loadPromoData();
    const promotion = promoData.promotions?.find((p: Promotion) => p.id === promotionId);
    
    if (!promotion) {
      throw new Error('Promotion not found');
    }

    if (promotion.status !== 'active') {
      throw new Error('Promotion is not active');
    }

    // Check if user already claimed this promotion
    const existingClaim = (promoData.userPromotions || []).find((up: UserPromotion) => 
      up.userId === userId && up.promotionId === promotionId
    );

    if (existingClaim) {
      throw new Error('Promotion already claimed');
    }

    // Check eligibility
    if (!this.checkEligibility(userId, promotion.eligibility)) {
      throw new Error('You are not eligible for this promotion');
    }

    const userPromotion: UserPromotion = {
      id: `user_promo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      promotionId,
      status: 'claimed',
      claimedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      wageringRequired: promotion.reward.wagering ? promotion.reward.value * promotion.reward.wagering : 0,
      wageringCompleted: 0,
      bonusAmount: promotion.reward.value
    };

    promoData.userPromotions = [userPromotion, ...(promoData.userPromotions || [])];
    
    // Update promotion usage
    promotion.usage.totalClaimed++;
    promotion.usage.totalValue += promotion.reward.value;
    
    this.savePromoData(promoData);

    return userPromotion;
  }

  static checkEligibility(userId: string, eligibility: PromotionEligibility): boolean {
    // In a real app, this would check user data, deposit history, etc.
    // For demo, we'll return true
    return true;
  }

  static getUserPromotions(userId: string): UserPromotion[] {
    const promoData = this.loadPromoData();
    return (promoData.userPromotions || []).filter((up: UserPromotion) => up.userId === userId);
  }

  static updateWageringProgress(userId: string, promotionId: string, wageringAmount: number): void {
    const promoData = this.loadPromoData();
    const userPromotion = promoData.userPromotions?.find((up: UserPromotion) => 
      up.userId === userId && up.promotionId === promotionId
    );

    if (userPromotion && userPromotion.status === 'active') {
      userPromotion.wageringCompleted += wageringAmount;
      
      if (userPromotion.wageringCompleted >= userPromotion.wageringRequired) {
        userPromotion.status = 'completed';
        userPromotion.completedAt = new Date();
      }
      
      this.savePromoData(promoData);
    }
  }
}