import React, { useState, useEffect } from 'react';
import { 
  Trophy, TrendingUp, Clock, Users, Star, Filter, RefreshCw, Plus, Minus, X, 
  Target, Zap, Shield, Activity, DollarSign, Calendar, MapPin, Play, Pause,
  BarChart3, TrendingDown, AlertTriangle, CheckCircle, Eye, Settings
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import { SportsApiService } from '../services/sportsApiService';
import { BettingService } from '../services/bettingService';
import { formatCurrency, formatOdds } from '../lib/utils';
import toast from 'react-hot-toast';

interface Bet {
  id: string;
  eventId: string;
  eventName: string;
  selection: string;
  odds: number;
  stake: number;
  market: string;
  potentialWin: number;
}

interface BetSlip {
  bets: Bet[];
  totalStake: number;
  totalOdds: number;
  potentialWin: number;
  betType: 'single' | 'accumulator';
}

interface LiveEvent {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  score?: { home: number; away: number; period?: string; time?: string };
  status: 'live' | 'upcoming' | 'finished';
  startTime: Date;
  markets: any[];
  isPopular: boolean;
  viewers?: number;
}

const SportsPage: React.FC = () => {
  const { user, updateBalance } = useAuth();
  const { getBalance, addTransaction } = useWallet();
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedMarket, setSelectedMarket] = useState('all');
  const [oddsFormat, setOddsFormat] = useState<'decimal' | 'american' | 'fractional'>('decimal');
  const [betSlip, setBetSlip] = useState<BetSlip>({
    bets: [],
    totalStake: 0,
    totalOdds: 1,
    potentialWin: 0,
    betType: 'single'
  });
  const [showBetSlip, setShowBetSlip] = useState(false);
  const [quickStakes] = useState([10, 25, 50, 100, 250]);
  const [selectedQuickStake, setSelectedQuickStake] = useState(50);
  const [showLiveOnly, setShowLiveOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'time' | 'popularity' | 'odds'>('time');
  const [myBets, setMyBets] = useState<any[]>([]);
  const [showMyBets, setShowMyBets] = useState(false);
  const [liveStats, setLiveStats] = useState({
    totalEvents: 0,
    liveEvents: 0,
    totalBets: 0,
    activePlayers: 1247
  });

  useEffect(() => {
    loadSportsData();
    loadUserBets();
    
    // Update live stats periodically
    const statsInterval = setInterval(() => {
      setLiveStats(prev => ({
        ...prev,
        activePlayers: prev.activePlayers + Math.floor(Math.random() * 10) - 5,
        totalBets: prev.totalBets + Math.floor(Math.random() * 5)
      }));
    }, 5000);

    // Simulate live score updates
    const scoresInterval = setInterval(() => {
      setEvents(prev => prev.map(event => {
        if (event.status === 'live' && Math.random() < 0.1) {
          const newScore = {
            home: event.score?.home || 0,
            away: event.score?.away || 0,
            period: event.score?.period || '1st Half',
            time: `${Math.floor(Math.random() * 90) + 1}'`
          };
          
          if (Math.random() < 0.5) {
            newScore.home += 1;
          } else {
            newScore.away += 1;
          }
          
          return { ...event, score: newScore };
        }
        return event;
      }));
    }, 10000);

    return () => {
      clearInterval(statsInterval);
      clearInterval(scoresInterval);
    };
  }, []);

  const loadSportsData = async () => {
    try {
      setLoading(true);
      
      // Generate comprehensive mock events with realistic data
      const mockEvents: LiveEvent[] = [
        // Live Events
        {
          id: 'live_1',
          sport: 'Soccer',
          homeTeam: 'Manchester City',
          awayTeam: 'Arsenal',
          score: { home: 2, away: 1, period: '2nd Half', time: '67\'' },
          status: 'live',
          startTime: new Date(Date.now() - 4020000),
          isPopular: true,
          viewers: 45230,
          markets: [
            {
              key: 'h2h',
              name: 'Match Winner',
              outcomes: [
                { name: 'Manchester City', price: 1.45 },
                { name: 'Draw', price: 4.20 },
                { name: 'Arsenal', price: 6.50 }
              ]
            },
            {
              key: 'btts',
              name: 'Both Teams to Score',
              outcomes: [
                { name: 'Yes', price: 1.35 },
                { name: 'No', price: 3.10 }
              ]
            },
            {
              key: 'over_under',
              name: 'Total Goals',
              outcomes: [
                { name: 'Over 2.5', price: 1.65 },
                { name: 'Under 2.5', price: 2.25 }
              ]
            }
          ]
        },
        {
          id: 'live_2',
          sport: 'Basketball',
          homeTeam: 'Los Angeles Lakers',
          awayTeam: 'Boston Celtics',
          score: { home: 89, away: 92, period: '4th Quarter', time: '8:45' },
          status: 'live',
          startTime: new Date(Date.now() - 7200000),
          isPopular: true,
          viewers: 32150,
          markets: [
            {
              key: 'h2h',
              name: 'Match Winner',
              outcomes: [
                { name: 'Los Angeles Lakers', price: 2.35 },
                { name: 'Boston Celtics', price: 1.62 }
              ]
            },
            {
              key: 'spread',
              name: 'Point Spread',
              outcomes: [
                { name: 'Lakers +3.5', price: 1.91 },
                { name: 'Celtics -3.5', price: 1.91 }
              ]
            },
            {
              key: 'totals',
              name: 'Total Points',
              outcomes: [
                { name: 'Over 215.5', price: 1.87 },
                { name: 'Under 215.5', price: 1.95 }
              ]
            }
          ]
        },
        {
          id: 'live_3',
          sport: 'American Football',
          homeTeam: 'Kansas City Chiefs',
          awayTeam: 'Buffalo Bills',
          score: { home: 14, away: 10, period: '2nd Quarter', time: '3:42' },
          status: 'live',
          startTime: new Date(Date.now() - 3600000),
          isPopular: true,
          viewers: 67890,
          markets: [
            {
              key: 'h2h',
              name: 'Moneyline',
              outcomes: [
                { name: 'Kansas City Chiefs', price: 1.75 },
                { name: 'Buffalo Bills', price: 2.15 }
              ]
            },
            {
              key: 'spread',
              name: 'Point Spread',
              outcomes: [
                { name: 'Chiefs -2.5', price: 1.91 },
                { name: 'Bills +2.5', price: 1.91 }
              ]
            }
          ]
        },
        // Upcoming Events
        {
          id: 'upcoming_1',
          sport: 'Soccer',
          homeTeam: 'Real Madrid',
          awayTeam: 'Barcelona',
          status: 'upcoming',
          startTime: new Date(Date.now() + 3600000),
          isPopular: true,
          viewers: 0,
          markets: [
            {
              key: 'h2h',
              name: 'Match Winner',
              outcomes: [
                { name: 'Real Madrid', price: 2.10 },
                { name: 'Draw', price: 3.40 },
                { name: 'Barcelona', price: 3.20 }
              ]
            },
            {
              key: 'btts',
              name: 'Both Teams to Score',
              outcomes: [
                { name: 'Yes', price: 1.55 },
                { name: 'No', price: 2.45 }
              ]
            }
          ]
        },
        {
          id: 'upcoming_2',
          sport: 'Basketball',
          homeTeam: 'Golden State Warriors',
          awayTeam: 'Phoenix Suns',
          status: 'upcoming',
          startTime: new Date(Date.now() + 7200000),
          isPopular: false,
          viewers: 0,
          markets: [
            {
              key: 'h2h',
              name: 'Moneyline',
              outcomes: [
                { name: 'Golden State Warriors', price: 1.85 },
                { name: 'Phoenix Suns', price: 1.98 }
              ]
            },
            {
              key: 'spread',
              name: 'Point Spread',
              outcomes: [
                { name: 'Warriors -1.5', price: 1.91 },
                { name: 'Suns +1.5', price: 1.91 }
              ]
            }
          ]
        },
        {
          id: 'upcoming_3',
          sport: 'Tennis',
          homeTeam: 'Novak Djokovic',
          awayTeam: 'Carlos Alcaraz',
          status: 'upcoming',
          startTime: new Date(Date.now() + 10800000),
          isPopular: true,
          viewers: 0,
          markets: [
            {
              key: 'h2h',
              name: 'Match Winner',
              outcomes: [
                { name: 'Novak Djokovic', price: 2.25 },
                { name: 'Carlos Alcaraz', price: 1.67 }
              ]
            },
            {
              key: 'sets',
              name: 'Total Sets',
              outcomes: [
                { name: 'Over 3.5 Sets', price: 1.75 },
                { name: 'Under 3.5 Sets', price: 2.05 }
              ]
            }
          ]
        },
        {
          id: 'upcoming_4',
          sport: 'Baseball',
          homeTeam: 'New York Yankees',
          awayTeam: 'Boston Red Sox',
          status: 'upcoming',
          startTime: new Date(Date.now() + 14400000),
          isPopular: false,
          viewers: 0,
          markets: [
            {
              key: 'h2h',
              name: 'Moneyline',
              outcomes: [
                { name: 'New York Yankees', price: 1.72 },
                { name: 'Boston Red Sox', price: 2.18 }
              ]
            },
            {
              key: 'totals',
              name: 'Total Runs',
              outcomes: [
                { name: 'Over 8.5', price: 1.83 },
                { name: 'Under 8.5', price: 1.99 }
              ]
            }
          ]
        },
        {
          id: 'upcoming_5',
          sport: 'Hockey',
          homeTeam: 'Toronto Maple Leafs',
          awayTeam: 'Montreal Canadiens',
          status: 'upcoming',
          startTime: new Date(Date.now() + 18000000),
          isPopular: false,
          viewers: 0,
          markets: [
            {
              key: 'h2h',
              name: 'Moneyline',
              outcomes: [
                { name: 'Toronto Maple Leafs', price: 1.95 },
                { name: 'Montreal Canadiens', price: 1.88 }
              ]
            },
            {
              key: 'totals',
              name: 'Total Goals',
              outcomes: [
                { name: 'Over 5.5', price: 1.91 },
                { name: 'Under 5.5', price: 1.91 }
              ]
            }
          ]
        }
      ];

      setEvents(mockEvents);
      setLiveStats({
        totalEvents: mockEvents.length,
        liveEvents: mockEvents.filter(e => e.status === 'live').length,
        totalBets: Math.floor(Math.random() * 1000) + 500,
        activePlayers: Math.floor(Math.random() * 500) + 1000
      });
    } catch (error) {
      console.error('Failed to load sports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserBets = () => {
    if (!user) return;
    
    // Load user's betting history
    const userBets = BettingService.getUserBets(user.id);
    setMyBets(userBets);
  };

  // Fix missing function
  const processBet = async (amount: number, gameType: string, description?: string, metadata?: any): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!validateBalance(amount)) {
      throw new Error('Insufficient balance');
    }

    try {
      // Update balance through auth context
      updateBalance(-amount);

      // Create bet transaction
      const betTransaction = {
        userId: user.id,
        type: 'bet' as const,
        status: 'completed' as const,
        amount: -amount,
        currency: 'USD',
        fee: 0,
        method: gameType,
        description: description || `${gameType} - Bet placed`,
        metadata: {
          gameType,
          betAmount: amount,
          ...metadata
        }
      };

      addTransaction(betTransaction);
    } catch (error) {
      console.error('Failed to process bet:', error);
      throw error;
    }
  };

  const addToBetSlip = (event: LiveEvent, outcome: any, market: any) => {
    if (!outcome.price || typeof outcome.price !== 'number' || outcome.price <= 0) {
      toast.error('Invalid odds for this selection');
      return;
    }
    
    const newBet: Bet = {
      id: `${event.id}-${outcome.name}-${market.key}`,
      eventId: event.id,
      eventName: `${event.homeTeam} vs ${event.awayTeam}`,
      selection: outcome.name,
      odds: outcome.price,
      stake: selectedQuickStake,
      market: market.name,
      potentialWin: selectedQuickStake * outcome.price
    };

    setBetSlip(prev => {
      const existingBetIndex = prev.bets.findIndex(bet => bet.id === newBet.id);
      let updatedBets;
      
      if (existingBetIndex >= 0) {
        updatedBets = prev.bets.map((bet, index) => 
          index === existingBetIndex ? newBet : bet
        );
        toast.success('Bet updated in slip');
      } else {
        updatedBets = [...prev.bets, newBet];
        toast.success('Added to bet slip');
      }

      const totalStake = updatedBets.reduce((sum, bet) => sum + bet.stake, 0);
      const totalOdds = prev.betType === 'accumulator' 
        ? updatedBets.reduce((product, bet) => product * bet.odds, 1)
        : updatedBets.reduce((sum, bet) => sum + (bet.stake * bet.odds), 0) / totalStake;
      const potentialWin = prev.betType === 'accumulator'
        ? totalStake * totalOdds
        : updatedBets.reduce((sum, bet) => sum + bet.potentialWin, 0);

      return {
        bets: updatedBets,
        totalStake,
        totalOdds,
        potentialWin,
        betType: prev.betType
      };
    });

    setShowBetSlip(true);
  };

  const removeBet = (betId: string) => {
    setBetSlip(prev => {
      const updatedBets = prev.bets.filter(bet => bet.id !== betId);
      const totalStake = updatedBets.reduce((sum, bet) => sum + bet.stake, 0);
      const totalOdds = prev.betType === 'accumulator' 
        ? updatedBets.reduce((product, bet) => product * bet.odds, 1)
        : updatedBets.length > 0 ? updatedBets.reduce((sum, bet) => sum + (bet.stake * bet.odds), 0) / totalStake : 1;
      const potentialWin = prev.betType === 'accumulator'
        ? totalStake * totalOdds
        : updatedBets.reduce((sum, bet) => sum + bet.potentialWin, 0);

      return {
        bets: updatedBets,
        totalStake,
        totalOdds: updatedBets.length > 0 ? totalOdds : 1,
        potentialWin,
        betType: prev.betType
      };
    });
  };

  const updateBetStake = (betId: string, newStake: number) => {
    setBetSlip(prev => {
      const updatedBets = prev.bets.map(bet => 
        bet.id === betId ? { 
          ...bet, 
          stake: Math.max(1, Math.min(newStake, getBalance())),
          potentialWin: Math.max(1, Math.min(newStake, getBalance())) * bet.odds
        } : bet
      );
      
      const totalStake = updatedBets.reduce((sum, bet) => sum + bet.stake, 0);
      const totalOdds = prev.betType === 'accumulator' 
        ? updatedBets.reduce((product, bet) => product * bet.odds, 1)
        : updatedBets.reduce((sum, bet) => sum + (bet.stake * bet.odds), 0) / totalStake;
      const potentialWin = prev.betType === 'accumulator'
        ? totalStake * totalOdds
        : updatedBets.reduce((sum, bet) => sum + bet.potentialWin, 0);

      return {
        bets: updatedBets,
        totalStake,
        totalOdds,
        potentialWin,
        betType: prev.betType
      };
    });
  };

  const placeBets = async () => {
    if (!user) {
      toast.error('Please login to place bets');
      return;
    }

    const availableBalance = getAvailableBalance();
    if (betSlip.totalStake > availableBalance) {
      toast.error('Insufficient balance');
      return;
    }

    if (betSlip.bets.length === 0) {
      toast.error('No bets in slip');
      return;
    }

    try {
      // Process each bet
      for (const bet of betSlip.bets) {
        // Process bet through wallet context (this will deduct balance and create transaction)
        await processBet(bet.stake, 'Sports Betting', 
          `${bet.eventName} - ${bet.selection} @ ${formatOdds(bet.odds, oddsFormat)}`, {
            betId: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            eventId: bet.eventId,
            selection: bet.selection,
            odds: bet.odds,
            market: bet.market,
            betType: betSlip.betType,
            potentialWin: bet.potentialWin
          });
        
        const placedBet = await BettingService.placeBet(
          user.id,
          bet.id,
          bet.stake,
          bet.odds
        );
      }

      toast.success(`${betSlip.bets.length} bet${betSlip.bets.length > 1 ? 's' : ''} placed successfully!`);
      
      // Clear bet slip
      setBetSlip({ bets: [], totalStake: 0, totalOdds: 1, potentialWin: 0, betType: 'single' });
      setShowBetSlip(false);
      
      // Reload user bets
      loadUserBets();
    } catch (error) {
      toast.error('Failed to place bets');
    }
  };

  const getSportIcon = (sport: string) => {
    switch (sport.toLowerCase()) {
      case 'soccer': return '⚽';
      case 'basketball': return '🏀';
      case 'american football': return '🏈';
      case 'baseball': return '⚾';
      case 'tennis': return '🎾';
      case 'hockey': return '🏒';
      default: return '🏆';
    }
  };

  const getEventStatusBadge = (event: LiveEvent) => {
    if (event.status === 'live') {
      return (
        <div className="flex items-center space-x-2 bg-red-600 px-3 py-1 rounded-full">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-white font-bold text-sm">LIVE</span>
          {event.score && (
            <span className="text-white text-sm">
              {event.score.home}-{event.score.away}
            </span>
          )}
        </div>
      );
    }
    
    const timeUntil = event.startTime.getTime() - Date.now();
    const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
    const minutesUntil = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));
    
    if (timeUntil < 3600000) {
      return (
        <div className="bg-orange-600 px-3 py-1 rounded-full">
          <span className="text-white font-bold text-sm">
            {minutesUntil}m
          </span>
        </div>
      );
    }
    
    return (
      <div className="bg-blue-600 px-3 py-1 rounded-full">
        <span className="text-white font-bold text-sm">
          {hoursUntil}h {minutesUntil}m
        </span>
      </div>
    );
  };

  const filteredEvents = events.filter(event => {
    if (selectedSport !== 'all' && event.sport.toLowerCase() !== selectedSport.toLowerCase()) return false;
    if (showLiveOnly && event.status !== 'live') return false;
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'time':
        return a.startTime.getTime() - b.startTime.getTime();
      case 'popularity':
        return (b.viewers || 0) - (a.viewers || 0);
      case 'odds':
        const aMinOdds = Math.min(...a.markets.flatMap(m => m.outcomes.map((o: any) => o.price || 999)));
        const bMinOdds = Math.min(...b.markets.flatMap(m => m.outcomes.map((o: any) => o.price || 999)));
        return aMinOdds - bMinOdds;
      default:
        return 0;
    }
  });

  const sports = [
    { key: 'all', name: 'All Sports', count: events.length },
    { key: 'soccer', name: 'Soccer', count: events.filter(e => e.sport === 'Soccer').length },
    { key: 'basketball', name: 'Basketball', count: events.filter(e => e.sport === 'Basketball').length },
    { key: 'american football', name: 'NFL', count: events.filter(e => e.sport === 'American Football').length },
    { key: 'baseball', name: 'Baseball', count: events.filter(e => e.sport === 'Baseball').length },
    { key: 'tennis', name: 'Tennis', count: events.filter(e => e.sport === 'Tennis').length },
    { key: 'hockey', name: 'Hockey', count: events.filter(e => e.sport === 'Hockey').length }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-green-400 bg-clip-text text-transparent">
              🏆 Elite Sports Betting 🏆
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-slate-300 px-4">Live odds, instant betting, real-time updates!</p>
          </div>

          {/* Live Stats Banner */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 rounded-2xl p-4 sm:p-6 lg:p-8 mb-8 border-2 border-blue-400 shadow-2xl shadow-blue-400/30 relative overflow-hidden mx-2 sm:mx-0">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-500/20 animate-pulse"></div>
            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <Activity className="w-6 h-6 sm:w-8 lg:w-10 text-white mx-auto mb-2 animate-pulse" />
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">{liveStats.totalEvents}</p>
                <p className="text-blue-100 text-sm sm:text-base">Total Events</p>
              </div>
              <div>
                <Play className="w-6 h-6 sm:w-8 lg:w-10 text-red-300 mx-auto mb-2 animate-pulse" />
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-300">{liveStats.liveEvents}</p>
                <p className="text-blue-100 text-sm sm:text-base">Live Now</p>
              </div>
              <div>
                <Target className="w-6 h-6 sm:w-8 lg:w-10 text-yellow-300 mx-auto mb-2 animate-pulse" />
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-yellow-300">{liveStats.totalBets.toLocaleString()}</p>
                <p className="text-blue-100 text-sm sm:text-base">Bets Today</p>
              </div>
              <div>
                <Users className="w-6 h-6 sm:w-8 lg:w-10 text-green-300 mx-auto mb-2 animate-pulse" />
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-300">{liveStats.activePlayers.toLocaleString()}</p>
                <p className="text-blue-100 text-sm sm:text-base">Active Players</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Sports Filter */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              {sports.map(sport => (
                <button
                  key={sport.key}
                  onClick={() => setSelectedSport(sport.key)}
                  className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-xl text-sm sm:text-base lg:text-lg font-bold transition-all duration-300 transform hover:scale-110 border-2 shadow-lg whitespace-nowrap ${
                    selectedSport === sport.key
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-blue-400 shadow-blue-500/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-600'
                  }`}
                >
                  {getSportIcon(sport.name)} {sport.name} ({sport.count})
                </button>
              ))}
            </div>

            {/* Settings */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-end">
              <select
                value={oddsFormat}
                onChange={(e) => setOddsFormat(e.target.value as any)}
                className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
              >
                <option value="decimal">Decimal Odds</option>
                <option value="american">American Odds</option>
                <option value="fractional">Fractional Odds</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
              >
                <option value="time">Sort by Time</option>
                <option value="popularity">Sort by Popularity</option>
                <option value="odds">Sort by Best Odds</option>
              </select>

              <Button
                variant={showLiveOnly ? "secondary" : "outline"}
                onClick={() => setShowLiveOnly(!showLiveOnly)}
                className="text-sm"
              >
                <Play className="w-4 h-4 mr-2" />
                Live Only
              </Button>

              <Button
                variant="outline"
                onClick={loadSportsData}
                disabled={loading}
                className="text-sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Quick Stakes */}
          <div className="bg-slate-800 rounded-xl p-4 mb-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Quick Stake Selection</h3>
              <div className="text-sm text-slate-400">
                Balance: <span className="text-green-400 font-bold">{formatCurrency(getBalance())}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {quickStakes.map(stake => (
                <button
                  key={stake}
                  onClick={() => setSelectedQuickStake(stake)}
                  className={`px-4 py-2 rounded-lg font-bold transition-all duration-300 transform hover:scale-110 ${
                    selectedQuickStake === stake
                      ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg shadow-green-500/30'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {formatCurrency(stake)}
                </button>
              ))}
              <Input
                type="number"
                value={selectedQuickStake}
                onChange={(e) => setSelectedQuickStake(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 text-center font-bold"
                min="1"
                max={getBalance()}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Events List */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
                <span className="ml-4 text-lg">Loading live events...</span>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-12 bg-slate-800 rounded-xl border border-slate-700">
                <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-400 mb-2">No Events Found</h3>
                <p className="text-slate-500">Try adjusting your filters or check back later</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map(event => (
                  <div key={event.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-xl">
                    {/* Event Header */}
                    <div className="p-4 sm:p-6 border-b border-slate-700">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <span className="text-2xl">{getSportIcon(event.sport)}</span>
                            {getEventStatusBadge(event)}
                            <span className="text-blue-400 font-medium capitalize">{event.sport}</span>
                            {event.isPopular && <Star className="w-5 h-5 text-yellow-400 fill-current" />}
                          </div>
                          
                          <h3 className="text-xl sm:text-2xl font-bold mb-2 text-white">
                            {event.homeTeam} vs {event.awayTeam}
                          </h3>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{event.startTime.toLocaleString()}</span>
                            </div>
                            {event.viewers && event.viewers > 0 && (
                              <div className="flex items-center space-x-1">
                                <Eye className="w-4 h-4" />
                                <span>{event.viewers.toLocaleString()} watching</span>
                              </div>
                            )}
                            {event.score && (
                              <div className="flex items-center space-x-1 text-green-400 font-bold">
                                <Activity className="w-4 h-4" />
                                <span>{event.score.period} - {event.score.time}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Markets */}
                    <div className="p-4 sm:p-6">
                      {event.markets.map((market, marketIndex) => (
                        <div key={marketIndex} className="mb-6 last:mb-0">
                          <h4 className="text-lg font-bold text-blue-400 mb-4 flex items-center space-x-2">
                            <Target className="w-5 h-5" />
                            <span>{market.name}</span>
                          </h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {market.outcomes.map((outcome: any, outcomeIndex: number) => {
                              const isInBetSlip = betSlip.bets.some(bet => bet.id === `${event.id}-${outcome.name}-${market.key}`);
                              const impliedProbability = outcome.price && outcome.price > 0 ? (1 / outcome.price) * 100 : 0;
                              
                              return (
                                <button
                                  key={outcomeIndex}
                                  onClick={() => outcome.price && outcome.price > 0 && addToBetSlip(event, outcome, market)}
                                  disabled={!outcome.price || outcome.price <= 0}
                                  className={`p-4 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 shadow-lg text-center relative overflow-hidden ${
                                    isInBetSlip
                                      ? 'bg-gradient-to-r from-yellow-600 to-orange-600 border-yellow-400 shadow-yellow-500/30 scale-105'
                                      : outcome.price && outcome.price > 0
                                      ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 border-green-500 shadow-green-500/30'
                                      : 'bg-slate-700 border-slate-600 opacity-50 cursor-not-allowed'
                                  }`}
                                >
                                  {isInBetSlip && (
                                    <div className="absolute top-1 right-1">
                                      <CheckCircle className="w-4 h-4 text-yellow-200" />
                                    </div>
                                  )}
                                  
                                  <div className="font-bold text-white text-lg mb-2">{outcome.name}</div>
                                  <div className="text-2xl font-bold text-white mb-1">
                                    {outcome.price && outcome.price > 0 ? formatOdds(outcome.price, oddsFormat) : 'N/A'}
                                  </div>
                                  <div className="text-sm text-white/80">
                                    {impliedProbability > 0 ? `${impliedProbability.toFixed(1)}% chance` : 'No odds'}
                                  </div>
                                  
                                  {outcome.price && outcome.price > 0 && (
                                    <div className="text-xs text-white/70 mt-1">
                                      Win: {formatCurrency(selectedQuickStake * outcome.price)}
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bet Slip */}
          <div className={`xl:w-96 ${showBetSlip ? 'block' : 'hidden xl:block'}`}>
            <div className="bg-slate-800 rounded-xl border border-slate-700 sticky top-24">
              <div className="p-4 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-lg font-bold">Bet Slip</h3>
                    {betSlip.bets.length > 0 && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                        {betSlip.bets.length}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowBetSlip(false)}
                    className="xl:hidden text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {betSlip.bets.length > 1 && (
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => setBetSlip(prev => ({ ...prev, betType: 'single' }))}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        betSlip.betType === 'single' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      Single Bets
                    </button>
                    <button
                      onClick={() => setBetSlip(prev => ({ ...prev, betType: 'accumulator' }))}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        betSlip.betType === 'accumulator' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      Accumulator
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4">
                {betSlip.bets.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 mb-2">No bets selected</p>
                    <p className="text-slate-500 text-sm">Click on odds to add bets</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                      {betSlip.bets.map(bet => (
                        <div key={bet.id} className="bg-slate-700 rounded-lg p-3 border border-slate-600">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-white text-sm truncate">{bet.eventName}</div>
                              <div className="text-blue-300 text-sm">{bet.market}</div>
                              <div className="text-green-400 text-sm font-bold">{bet.selection}</div>
                              <div className="text-yellow-400 text-sm">@ {formatOdds(bet.odds, oddsFormat)}</div>
                            </div>
                            <button
                              onClick={() => removeBet(bet.id)}
                              className="text-red-400 hover:text-red-300 ml-2"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateBetStake(bet.id, Math.max(1, bet.stake - 10))}
                              className="bg-red-600 hover:bg-red-700 p-1 rounded transition-colors"
                            >
                              <Minus className="w-3 h-3 text-white" />
                            </button>
                            <Input
                              type="number"
                              value={bet.stake}
                              onChange={(e) => updateBetStake(bet.id, Math.max(1, parseInt(e.target.value) || 1))}
                              className="text-center w-20 text-sm font-bold"
                              min="1"
                              max={getBalance()}
                            />
                            <button
                              onClick={() => updateBetStake(bet.id, Math.min(getBalance(), bet.stake + 10))}
                              className="bg-green-600 hover:bg-green-700 p-1 rounded transition-colors"
                            >
                              <Plus className="w-3 h-3 text-white" />
                            </button>
                          </div>
                          
                          <div className="mt-2 text-center">
                            <span className="text-xs text-slate-400">
                              Potential Win: <span className="text-green-400 font-bold">{formatCurrency(bet.potentialWin)}</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bet Slip Summary */}
                    <div className="bg-slate-700 rounded-lg p-4 mb-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Bet Type:</span>
                          <span className="text-white font-bold capitalize">{betSlip.betType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Stake:</span>
                          <span className="text-white font-bold">{formatCurrency(betSlip.totalStake)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Odds:</span>
                          <span className="text-blue-400 font-bold">{betSlip.totalOdds.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-600 pt-2">
                          <span className="text-slate-400">Potential Win:</span>
                          <span className="text-green-400 font-bold text-lg">{formatCurrency(betSlip.potentialWin)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Potential Profit:</span>
                          <span className="text-yellow-400 font-bold">{formatCurrency(betSlip.potentialWin - betSlip.totalStake)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Place Bet Button */}
                    <Button
                      onClick={placeBets}
                      disabled={betSlip.totalStake > getBalance() || betSlip.bets.length === 0}
                      className="w-full py-3 text-lg font-bold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-700"
                    >
                      {betSlip.totalStake > getBalance() ? (
                        <>
                          <AlertTriangle className="w-5 h-5 mr-2" />
                          Insufficient Balance
                        </>
                      ) : (
                        <>
                          <Trophy className="w-5 h-5 mr-2" />
                          Place {betSlip.bets.length} Bet{betSlip.bets.length > 1 ? 's' : ''} - {formatCurrency(betSlip.totalStake)}
                        </>
                      )}
                    </Button>

                    {/* Clear Bet Slip */}
                    <Button
                      variant="outline"
                      onClick={() => setBetSlip({ bets: [], totalStake: 0, totalOdds: 1, potentialWin: 0, betType: 'single' })}
                      className="w-full mt-2"
                    >
                      Clear All Bets
                    </Button>
                  </>
                )}
              </div>

              {/* My Bets Section */}
              <div className="border-t border-slate-700 p-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowMyBets(!showMyBets)}
                  className="w-full flex items-center justify-between"
                >
                  <span>My Active Bets ({myBets.length})</span>
                  <TrendingUp className="w-4 h-4" />
                </Button>
                
                {showMyBets && myBets.length > 0 && (
                  <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
                    {myBets.slice(0, 5).map(bet => (
                      <div key={bet.id} className="bg-slate-700 rounded-lg p-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-medium truncate">{bet.selection}</span>
                          <span className="text-green-400 font-bold">{formatCurrency(bet.stake)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>@ {formatOdds(bet.odds, oddsFormat)}</span>
                          <span className={`font-medium ${
                            bet.status === 'won' ? 'text-green-400' :
                            bet.status === 'lost' ? 'text-red-400' :
                            'text-yellow-400'
                          }`}>
                            {bet.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bet Slip Toggle */}
        <div className="xl:hidden fixed bottom-4 right-4 z-50">
          <Button
            onClick={() => setShowBetSlip(!showBetSlip)}
            className="bg-green-600 hover:bg-green-700 p-4 rounded-full shadow-lg relative"
          >
            <Trophy className="w-6 h-6" />
            {betSlip.bets.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                {betSlip.bets.length}
              </span>
            )}
          </Button>
        </div>

        {/* Sports Betting Features */}
        <div className="mt-12 bg-gradient-to-r from-slate-800 via-blue-800/20 to-slate-800 rounded-2xl p-6 lg:p-8 border-2 border-blue-500/30 shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-green-500 bg-clip-text text-transparent">
            🏆 Why Choose Elite Sports Betting?
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-green-400 mb-2">Live Betting</h3>
              <p className="text-slate-300">Real-time odds updates during live games</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-blue-400 mb-2">Best Odds</h3>
              <p className="text-slate-300">Competitive odds across all major sports</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-purple-400 mb-2">Secure Betting</h3>
              <p className="text-slate-300">Bank-level security for all transactions</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-yellow-400 mb-2">Instant Payouts</h3>
              <p className="text-slate-300">Winnings credited immediately after settlement</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SportsPage;