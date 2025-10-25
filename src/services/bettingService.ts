import { Sport, Competition, Event, Market, Selection, Bet, CashOutOffer } from '../types/betting';

import { useWallet } from '../contexts/WalletContext';

export class BettingService {
  private static readonly BETTING_STORAGE_KEY = 'elitebet_betting_data';

  static saveBettingData(data: any): void {
    try {
      localStorage.setItem(this.BETTING_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save betting data:', error);
    }
  }

  static loadBettingData(): any {
    try {
      const stored = localStorage.getItem(this.BETTING_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {
        sports: this.getDefaultSports(),
        competitions: this.getDefaultCompetitions(),
        events: this.getDefaultEvents(),
        markets: this.getDefaultMarkets(),
        selections: this.getDefaultSelections(),
        bets: []
      };
    } catch (error) {
      console.error('Failed to load betting data:', error);
      return {
        sports: this.getDefaultSports(),
        competitions: this.getDefaultCompetitions(),
        events: this.getDefaultEvents(),
        markets: this.getDefaultMarkets(),
        selections: this.getDefaultSelections(),
        bets: []
      };
    }
  }

  static getDefaultSports(): Sport[] {
    return [
      { id: 'football', name: 'Football', slug: 'football', category: 'team', active: true, sortOrder: 1, icon: '🏈' },
      { id: 'basketball', name: 'Basketball', slug: 'basketball', category: 'team', active: true, sortOrder: 2, icon: '🏀' },
      { id: 'soccer', name: 'Soccer', slug: 'soccer', category: 'team', active: true, sortOrder: 3, icon: '⚽' },
      { id: 'tennis', name: 'Tennis', slug: 'tennis', category: 'individual', active: true, sortOrder: 4, icon: '🎾' },
      { id: 'baseball', name: 'Baseball', slug: 'baseball', category: 'team', active: true, sortOrder: 5, icon: '⚾' },
      { id: 'hockey', name: 'Hockey', slug: 'hockey', category: 'team', active: true, sortOrder: 6, icon: '🏒' }
    ];
  }

  static getDefaultCompetitions(): Competition[] {
    return [
      { id: 'nfl', sportId: 'football', name: 'NFL', slug: 'nfl', country: 'US', season: '2024-25', active: true },
      { id: 'nba', sportId: 'basketball', name: 'NBA', slug: 'nba', country: 'US', season: '2024-25', active: true },
      { id: 'premier_league', sportId: 'soccer', name: 'Premier League', slug: 'premier-league', country: 'GB', season: '2024-25', active: true },
      { id: 'atp', sportId: 'tennis', name: 'ATP Tour', slug: 'atp-tour', country: 'INT', season: '2025', active: true }
    ];
  }

  static getDefaultEvents(): Event[] {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    return [
      {
        id: 'event_1',
        competitionId: 'nfl',
        name: 'Kansas City Chiefs vs Buffalo Bills',
        homeTeam: 'Kansas City Chiefs',
        awayTeam: 'Buffalo Bills',
        startTime: tomorrow,
        status: 'upcoming'
      },
      {
        id: 'event_2',
        competitionId: 'nba',
        name: 'Los Angeles Lakers vs Boston Celtics',
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Boston Celtics',
        startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        status: 'upcoming'
      },
      {
        id: 'event_3',
        competitionId: 'premier_league',
        name: 'Manchester City vs Arsenal',
        homeTeam: 'Manchester City',
        awayTeam: 'Arsenal',
        startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        status: 'upcoming'
      }
    ];
  }

  static getDefaultMarkets(): Market[] {
    return [
      { id: 'market_1_ml', eventId: 'event_1', name: 'Moneyline', marketType: 'moneyline', status: 'active', selections: [] },
      { id: 'market_1_spread', eventId: 'event_1', name: 'Spread', marketType: 'spread', status: 'active', selections: [] },
      { id: 'market_1_total', eventId: 'event_1', name: 'Total Points', marketType: 'total', status: 'active', selections: [] },
      { id: 'market_2_ml', eventId: 'event_2', name: 'Moneyline', marketType: 'moneyline', status: 'active', selections: [] },
      { id: 'market_2_spread', eventId: 'event_2', name: 'Spread', marketType: 'spread', status: 'active', selections: [] },
      { id: 'market_3_1x2', eventId: 'event_3', name: '1X2', marketType: '1x2', status: 'active', selections: [] },
      { id: 'market_3_btts', eventId: 'event_3', name: 'Both Teams to Score', marketType: 'btts', status: 'active', selections: [] }
    ];
  }

  static getDefaultSelections(): Selection[] {
    return [
      // Event 1 - NFL
      { id: 'sel_1_1', marketId: 'market_1_ml', name: 'Kansas City Chiefs', odds: 1.85, status: 'active' },
      { id: 'sel_1_2', marketId: 'market_1_ml', name: 'Buffalo Bills', odds: 1.95, status: 'active' },
      { id: 'sel_1_3', marketId: 'market_1_spread', name: 'Chiefs -3.5', odds: 1.91, status: 'active' },
      { id: 'sel_1_4', marketId: 'market_1_spread', name: 'Bills +3.5', odds: 1.91, status: 'active' },
      { id: 'sel_1_5', marketId: 'market_1_total', name: 'Over 47.5', odds: 1.87, status: 'active' },
      { id: 'sel_1_6', marketId: 'market_1_total', name: 'Under 47.5', odds: 1.95, status: 'active' },
      
      // Event 2 - NBA
      { id: 'sel_2_1', marketId: 'market_2_ml', name: 'Los Angeles Lakers', odds: 2.10, status: 'active' },
      { id: 'sel_2_2', marketId: 'market_2_ml', name: 'Boston Celtics', odds: 1.75, status: 'active' },
      { id: 'sel_2_3', marketId: 'market_2_spread', name: 'Lakers +4.5', odds: 1.91, status: 'active' },
      { id: 'sel_2_4', marketId: 'market_2_spread', name: 'Celtics -4.5', odds: 1.91, status: 'active' },
      
      // Event 3 - Soccer
      { id: 'sel_3_1', marketId: 'market_3_1x2', name: 'Manchester City', odds: 1.65, status: 'active' },
      { id: 'sel_3_2', marketId: 'market_3_1x2', name: 'Draw', odds: 3.80, status: 'active' },
      { id: 'sel_3_3', marketId: 'market_3_1x2', name: 'Arsenal', odds: 4.50, status: 'active' },
      { id: 'sel_3_4', marketId: 'market_3_btts', name: 'Yes', odds: 1.55, status: 'active' },
      { id: 'sel_3_5', marketId: 'market_3_btts', name: 'No', odds: 2.35, status: 'active' }
    ];
  }

  static async placeBet(userId: string, selectionId: string, stake: number, odds: number): Promise<Bet> {
    const bet: Bet = {
      id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      selectionId,
      stake,
      odds,
      potentialPayout: stake * odds,
      currency: 'USD',
      status: 'pending',
      placedAt: new Date(),
      metadata: {
        ipAddress: '192.168.1.100',
        userAgent: navigator.userAgent
      }
    };

    const bettingData = this.loadBettingData();
    bettingData.bets = [bet, ...(bettingData.bets || [])];
    this.saveBettingData(bettingData);

    // Auto-accept bet after 2 seconds (simulate processing)
    setTimeout(() => {
      bet.status = 'accepted';
      this.saveBettingData(bettingData);
      
      // Simulate settlement after 10 seconds for demo
      setTimeout(() => {
        this.settleBetWithWinnings(bet, bettingData);
      }, 10000);
    }, 2000);

    return bet;
  }

  static settleBetWithWinnings(bet: Bet, bettingData: any) {
    const winChance = Math.random();
    if (winChance < 0.45) { // 45% win rate
      bet.status = 'won';
      bet.payout = bet.potentialPayout;
      
      // Trigger balance update and transaction for winnings
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'elitebet_bet_won',
        newValue: JSON.stringify({
          userId: bet.userId,
          betId: bet.id,
          winAmount: bet.payout,
          originalStake: bet.stake,
          odds: bet.odds,
          selectionId: bet.selectionId
        })
      }));
    } else {
      bet.status = 'lost';
      bet.payout = 0;
      
      // Notify of loss
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'elitebet_bet_lost',
        newValue: JSON.stringify({
          userId: bet.userId,
          betId: bet.id,
          lostAmount: bet.stake,
          selectionId: bet.selectionId
        })
      }));
    }
    bet.settledAt = new Date();
    this.saveBettingData(bettingData);
  }

  static async settleBet(betId: string, result: 'won' | 'lost' | 'void', payout?: number): Promise<void> {
    const bettingData = this.loadBettingData();
    const bet = bettingData.bets?.find((b: Bet) => b.id === betId);
    
    if (bet) {
      if (result === 'won') {
        bet.status = 'won';
        bet.payout = payout || bet.potentialPayout;
        
        // Trigger balance update for winnings
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'elitebet_bet_won',
          newValue: JSON.stringify({
            userId: bet.userId,
            betId: bet.id,
            winAmount: bet.payout,
            originalStake: bet.stake,
            odds: bet.odds,
            selectionId: bet.selectionId
          })
        }));
      } else if (result === 'lost') {
        bet.status = 'lost';
        bet.payout = 0;
      } else if (result === 'void') {
        bet.status = 'void';
        bet.payout = bet.stake; // Return stake for void bets
        
        // Refund stake for void bets
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'elitebet_bet_won',
          newValue: JSON.stringify({
            userId: bet.userId,
            betId: bet.id,
            winAmount: bet.stake,
            originalStake: bet.stake,
            odds: 1,
            selectionId: bet.selectionId
          })
        }));
      }
      bet.settledAt = new Date();
      this.saveBettingData(bettingData);
    }
  }

  static getUserBets(userId: string): Bet[] {
    const bettingData = this.loadBettingData();
    return (bettingData.bets || []).filter((bet: Bet) => bet.userId === userId);
  }

  static async calculateCashOut(betId: string): Promise<CashOutOffer | null> {
    const bettingData = this.loadBettingData();
    const bet = bettingData.bets?.find((b: Bet) => b.id === betId);
    
    if (!bet || bet.status !== 'accepted') return null;

    // Simulate cash out calculation (typically based on current odds vs original odds)
    const cashOutPercentage = 0.7 + Math.random() * 0.25; // 70-95% of potential payout
    const cashOutAmount = bet.potentialPayout * cashOutPercentage;

    return {
      betId,
      amount: cashOutAmount,
      percentage: cashOutPercentage * 100,
      expiresAt: new Date(Date.now() + 30 * 1000) // 30 seconds
    };
  }

  static getEventsByCompetition(competitionId: string): Event[] {
    const bettingData = this.loadBettingData();
    return (bettingData.events || []).filter((event: Event) => event.competitionId === competitionId);
  }

  static getMarketsByEvent(eventId: string): Market[] {
    const bettingData = this.loadBettingData();
    const markets = (bettingData.markets || []).filter((market: Market) => market.eventId === eventId);
    const selections = bettingData.selections || [];
    
    return markets.map(market => ({
      ...market,
      selections: selections.filter((sel: Selection) => sel.marketId === market.id)
    }));
  }
}