export interface Sport {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
}

export interface Outcome {
  name: string;
  price: number;
}

export interface Market {
  key: string;
  last_update: string;
  outcomes: Outcome[];
}

export interface Event {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    last_update: string;
    markets: Market[];
  }>;
}

export class SportsApiService {
  private static readonly API_KEY = '48a20c06cdc1aa3bcb13b33fd1bb7e85';
  private static readonly BASE_URL = 'https://api.the-odds-api.com/v4';
  
  // Cache to avoid excessive API calls
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static readonly CACHE_DURATION = 90 * 60 * 1000; // 1.5 hours to use 500 credits per month

  private static getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private static setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  static async getSports(): Promise<Sport[]> {
    const cacheKey = 'sports';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log('Fetching sports from The Odds API...');
      const response = await fetch(`${this.BASE_URL}/sports/?apiKey=${this.API_KEY}`);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const sports = await response.json();
      console.log('Sports API response:', sports.length, 'sports');
      this.setCachedData(cacheKey, sports);
      return sports;
    } catch (error) {
      console.error('Failed to fetch sports:', error);
      // Return fallback data
      return [
        { key: 'americanfootball_nfl', group: 'American Football', title: 'NFL', description: 'National Football League', active: true, has_outrights: false },
        { key: 'basketball_nba', group: 'Basketball', title: 'NBA', description: 'National Basketball Association', active: true, has_outrights: false },
        { key: 'soccer_epl', group: 'Soccer', title: 'EPL', description: 'English Premier League', active: true, has_outrights: false },
        { key: 'icehockey_nhl', group: 'Ice Hockey', title: 'NHL', description: 'National Hockey League', active: true, has_outrights: false },
        { key: 'baseball_mlb', group: 'Baseball', title: 'MLB', description: 'Major League Baseball', active: true, has_outrights: false }
      ];
    }
  }

  static async getOdds(sportKey: string, regions: string = 'us', markets: string = 'h2h'): Promise<Event[]> {
    const cacheKey = `odds_${sportKey}_${regions}_${markets}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`Fetching odds for ${sportKey}...`);
      const response = await fetch(
        `${this.BASE_URL}/sports/${sportKey}/odds/?apiKey=${this.API_KEY}&regions=${regions}&markets=${markets}&oddsFormat=decimal&dateFormat=iso`
      );
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const events = await response.json();
      console.log(`Odds API response for ${sportKey}:`, events.length, 'events');
      this.setCachedData(cacheKey, events);
      return events;
    } catch (error) {
      console.error('Failed to fetch odds:', error);
      // Return fallback data
      return [];
    }
  }

  static async getUpcomingEvents(sportKey?: string): Promise<Event[]> {
    try {
      const sports = sportKey ? [sportKey] : ['americanfootball_nfl', 'basketball_nba', 'soccer_epl', 'icehockey_nhl', 'baseball_mlb'];
      const allEvents: Event[] = [];

      for (const sport of sports) {
        const events = await this.getOdds(sport);
        allEvents.push(...events);
      }

      // Sort by commence time
      return allEvents.sort((a, b) => 
        new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime()
      );
    } catch (error) {
      console.error('Failed to fetch upcoming events:', error);
      return [];
    }
  }

  static formatOddsForDisplay(price: number): string {
    return price.toFixed(2);
  }

  static calculateImpliedProbability(odds: number): number {
    return (1 / odds) * 100;
  }

  static transformEventForBetting(event: Event) {
    if (!event.bookmakers || event.bookmakers.length === 0) return null;
    
    const bookmaker = event.bookmakers[0];
    const markets = [];
    
    // Transform all available markets
    bookmaker.markets.forEach(market => {
      const transformedMarket = {
        id: `${event.id}_${market.key}`,
        name: this.getMarketDisplayName(market.key),
        selections: market.outcomes.map(outcome => ({
          id: `${event.id}_${market.key}_${outcome.name}`,
          name: outcome.name,
          odds: outcome.price,
          status: 'active' as const
        }))
      };
      markets.push(transformedMarket);
    });

    return {
      id: event.id,
      sport: event.sport_title,
      homeTeam: event.home_team,
      awayTeam: event.away_team,
      startTime: new Date(event.commence_time),
      status: 'upcoming' as const,
      markets
    };
  }
  
  static getMarketDisplayName(marketKey: string): string {
    const marketNames: Record<string, string> = {
      'h2h': 'Match Winner',
      'spreads': 'Point Spread',
      'totals': 'Over/Under',
      'h2h_lay': 'Match Winner (Lay)',
      'outrights': 'Outright Winner'
    };
    return marketNames[marketKey] || marketKey.replace('_', ' ').toUpperCase();
  }
  
  static async getLiveEvents(): Promise<Event[]> {
    // In a real implementation, this would fetch live/in-play events
    // For now, we'll return a subset of upcoming events as "live"
    const upcoming = await this.getUpcomingEvents();
    return upcoming.slice(0, 10); // Simulate live events
  }
}