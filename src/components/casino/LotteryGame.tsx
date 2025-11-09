import React, { useState, useEffect } from 'react';
import { Gift, Smartphone, Laptop, Headphones, Watch, Crown, Zap, Trophy, Star, Target, Coins, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import toast from 'react-hot-toast';
import { useCasinoGame } from '../../hooks/useCasinoGame';
import { formatCurrency } from '../../lib/utils';
import { eventBus } from '../../utils/eventBus';

interface LotteryGameProps {
  gameId: string;
  gameName: string;
}

interface Prize {
  id: string;
  name: string;
  value: number;
  icon: React.ComponentType<any>;
  rarity: number;
  color: string;
  gradient: string;
  description: string;
  image: string;
}

interface LotteryTicket {
  id: string;
  numbers: number[];
  stake: number;
  timestamp: Date;
}

const PRIZES: Prize[] = [
  {
    id: 'iphone15',
    name: 'iPhone 15 Pro Max',
    value: 1200,
    icon: Smartphone,
    rarity: 0.001, // 0.1%
    color: 'text-blue-400',
    gradient: 'from-blue-500 to-cyan-500',
    description: '1TB, Titanium Blue',
    image: '📱'
  },
  {
    id: 'macbook',
    name: 'MacBook Pro M3',
    value: 2500,
    icon: Laptop,
    rarity: 0.0005, // 0.05%
    color: 'text-purple-400',
    gradient: 'from-purple-500 to-pink-500',
    description: '16-inch, 1TB SSD',
    image: '💻'
  },
  {
    id: 'airpods',
    name: 'AirPods Pro',
    value: 250,
    icon: Headphones,
    rarity: 0.01, // 1%
    color: 'text-green-400',
    gradient: 'from-green-500 to-emerald-500',
    description: 'Noise Cancelling',
    image: '🎧'
  },
  {
    id: 'applewatch',
    name: 'Apple Watch Ultra',
    value: 800,
    icon: Watch,
    rarity: 0.002, // 0.2%
    color: 'text-orange-400',
    gradient: 'from-orange-500 to-red-500',
    description: 'Titanium, GPS + Cellular',
    image: '⌚'
  },
  {
    id: 'cash1000',
    name: 'Cash Prize',
    value: 1000,
    icon: Crown,
    rarity: 0.005, // 0.5%
    color: 'text-yellow-400',
    gradient: 'from-yellow-500 to-orange-500',
    description: '$1,000 Cash',
    image: '💰'
  },
  {
    id: 'cash500',
    name: 'Cash Prize',
    value: 500,
    icon: Trophy,
    rarity: 0.01, // 1%
    color: 'text-yellow-400',
    gradient: 'from-yellow-400 to-yellow-600',
    description: '$500 Cash',
    image: '💵'
  },
  {
    id: 'cash100',
    name: 'Cash Prize',
    value: 100,
    icon: Star,
    rarity: 0.05, // 5%
    color: 'text-green-400',
    gradient: 'from-green-400 to-green-600',
    description: '$100 Cash',
    image: '💸'
  }
];

export function LotteryGame({ gameId, gameName }: LotteryGameProps) {
  const { user } = useAuth();
  const { session, isPlaying, placeBet, addWinnings, resetSession } = useCasinoGame(gameId);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [stakeAmount, setStakeAmount] = useState(100);
  const [tickets, setTickets] = useState<LotteryTicket[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [winningPrize, setWinningPrize] = useState<Prize | null>(null);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [gameStats, setGameStats] = useState({
    ticketsBought: 0,
    totalStaked: 0,
    prizesWon: 0,
    biggestWin: 0
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [drawAnimation, setDrawAnimation] = useState(false);
  const [winChance, setWinChance] = useState(0);
  const [message, setMessage] = useState('🎁 Welcome to Prize Lottery! Pick your lucky numbers!');

  // Calculate win chance based on stake
  useEffect(() => {
    const baseChance = 0.1; // 10% base chance
    const stakeMultiplier = Math.min(stakeAmount / 100, 5); // Max 5x multiplier at $500 stake
    const finalChance = Math.min(baseChance * (1 + stakeMultiplier), 0.8); // Max 80% chance
    setWinChance(finalChance);
  }, [stakeAmount]);

  const selectNumber = (number: number) => {
    if (selectedNumbers.includes(number)) {
      setSelectedNumbers(prev => prev.filter(n => n !== number));
    } else if (selectedNumbers.length < 6) {
      setSelectedNumbers(prev => [...prev, number].sort((a, b) => a - b));
    } else {
      toast.error('Maximum 6 numbers allowed!');
    }
  };

  const quickPick = () => {
    const numbers: number[] = [];
    while (numbers.length < 6) {
      const num = Math.floor(Math.random() * 49) + 1;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    setSelectedNumbers(numbers.sort((a, b) => a - b));
  };

  const clearNumbers = () => {
    setSelectedNumbers([]);
  };

  const buyTicket = () => {
    if (selectedNumbers.length !== 6) {
      toast.error('Please select exactly 6 numbers!');
      return;
    }

    if (!user || stakeAmount > session.balance) {
      toast.error('Insufficient balance!');
      return;
    }

    try {
      placeBet(stakeAmount);
      
      const ticket: LotteryTicket = {
        id: `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        numbers: [...selectedNumbers],
        stake: stakeAmount,
        timestamp: new Date()
      };
      
      setTickets(prev => [ticket, ...prev]);
      
      
      setGameStats(prev => ({
        ...prev,
        ticketsBought: prev.ticketsBought + 1,
        totalStaked: prev.totalStaked + stakeAmount
      }));
      
      setSelectedNumbers([]);
      toast.success(`🎫 Lottery ticket purchased! Win chance: ${(winChance * 100).toFixed(1)}%`);
      
      if (soundEnabled) {
        console.log('🔊 Ticket purchase sound...');
      }
      
    } catch (error) {
      console.error('Ticket purchase error:', error);
    }
  };

  const drawLottery = async () => {
    if (tickets.length === 0) {
      toast.error('No tickets to draw!');
      return;
    }

    setIsDrawing(true);
    setDrawAnimation(true);
    setMessage('🎰 Drawing lottery numbers...');
    
    if (soundEnabled) {
      console.log('🔊 Lottery draw sound...');
    }

    // Animate number drawing
    const numbers: number[] = [];
    for (let i = 0; i < 6; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      let num;
      do {
        num = Math.floor(Math.random() * 49) + 1;
      } while (numbers.includes(num));
      
      numbers.push(num);
      setDrawnNumbers([...numbers]);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    setDrawAnimation(false);

    // Check for winners based on stake amount and chance
    let hasWon = false;
    let wonPrize: Prize | null = null;

    tickets.forEach(ticket => {
      const ticketChance = Math.min(0.1 * (1 + ticket.stake / 100), 0.8);
      const random = Math.random();
      
      if (random < ticketChance) {
        hasWon = true;
        
        // Determine prize based on stake amount
        const stakeMultiplier = ticket.stake / 50; // Base stake is $50
        const prizePool = PRIZES.filter(prize => {
          if (stakeMultiplier >= 10) return true; // $500+ can win anything
          if (stakeMultiplier >= 5) return prize.value <= 1200; // $250+ can win up to iPhone
          if (stakeMultiplier >= 2) return prize.value <= 500; // $100+ can win up to $500 cash
          return prize.value <= 250; // Lower stakes win smaller prizes
        });
        
        // Weight prizes by rarity (inverse)
        const weightedPrizes: Array<{ prize: Prize; weight: number }> = prizePool.map(prize => ({
          prize: prize,
          weight: 1 / prize.rarity
        }));
        
        const totalWeight = weightedPrizes.reduce((sum, p) => sum + p.weight, 0);
        const randomWeight = Math.random() * totalWeight;
        
        let cumulativeWeight = 0;
        for (const weightedPrize of weightedPrizes) {
          cumulativeWeight += weightedPrize.weight;
          if (randomWeight <= cumulativeWeight) {
            wonPrize = weightedPrize.prize;
            break;
          }
        }
      }
    });

    if (hasWon && wonPrize && user) {
      const actualPrize: Prize = wonPrize;
      setWinningPrize(actualPrize);
      setShowPrizeModal(true);
      
      // Award cash equivalent
      addWinnings(actualPrize.value);
      
      const prizeValue = actualPrize.value;
      const prizeName = actualPrize.name;
      
      setGameStats(prev => ({
        ...prev,
        prizesWon: prev.prizesWon + 1,
        biggestWin: Math.max(prev.biggestWin, prizeValue)
      }));
      
      eventBus.emit('lotteryWin', {
        gameId,
        userId: user.id,
        gameName,
        prize: wonPrize,
        stakeAmount: tickets.reduce((sum, t) => sum + t.stake, 0),
        timestamp: new Date()
      });
      
      if (soundEnabled) {
        console.log('🔊 Big win sound playing...');
      }
      
      if (prizeValue >= 1000) {
        toast.success(`🎉 MEGA PRIZE! You won a ${prizeName}! (${formatCurrency(prizeValue)})`, { duration: 10000 });
      } else {
        toast.success(`🎁 Congratulations! You won a ${prizeName}! (${formatCurrency(prizeValue)})`, { duration: 8000 });
      }
      
      setMessage(`🎉 WINNER! You won a ${prizeName}!`);
    } else {
      setMessage('😔 No winning tickets this draw. Try again!');
      toast.error('No winners this time. Better luck next draw!');
    }

    setIsDrawing(false);
    setTickets([]);
  };

  return (
    <div className="bg-gradient-to-b from-slate-800 via-pink-900/20 to-slate-900 rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 border-2 border-pink-500/30 relative overflow-hidden shadow-2xl max-w-[1100px] mx-auto w-full">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Game Header */}
      <div className="relative z-10 text-center mb-4 sm:mb-6 md:mb-8">
        <div className="flex items-center justify-center space-x-2 sm:space-x-3 md:space-x-4 mb-3 sm:mb-4 md:mb-6">
          <Gift className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 text-pink-400 animate-pulse" />
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-pink-400 via-purple-500 to-blue-500 bg-clip-text text-transparent">
            {gameName}
          </h2>
          <Gift className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 text-pink-400 animate-pulse" />
        </div>
        
        <p className="text-sm sm:text-base md:text-xl lg:text-2xl text-slate-300 mb-3 sm:mb-4 md:mb-6 px-2">
          🎁 Win Amazing Prizes! Higher stakes = Higher chances! 🎁
        </p>
        
        <div className="grid grid-cols-3 gap-2 sm:gap-4 md:flex md:justify-center md:space-x-8 lg:space-x-12 text-sm sm:text-base md:text-lg">
          <div className="text-center bg-slate-800/50 rounded-lg p-2 sm:bg-transparent sm:p-0">
            <p className="text-slate-400 font-medium text-xs sm:text-sm">Balance</p>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-green-400">{formatCurrency(session.balance)}</p>
          </div>
          <div className="text-center bg-slate-800/50 rounded-lg p-2 sm:bg-transparent sm:p-0">
            <p className="text-slate-400 font-medium text-xs sm:text-sm">Win Chance</p>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-yellow-400">{(winChance * 100).toFixed(1)}%</p>
          </div>
          <div className="text-center bg-slate-800/50 rounded-lg p-2 sm:bg-transparent sm:p-0">
            <p className="text-slate-400 font-medium text-xs sm:text-sm">Tickets</p>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-purple-400">{tickets.length}</p>
          </div>
        </div>
      </div>

      {/* Prize Showcase */}
      <div className="relative z-10 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-yellow-400 mb-3 sm:mb-4 md:mb-6">🏆 Amazing Prizes Available 🏆</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {PRIZES.map(prize => {
            const Icon = prize.icon;
            return (
              <div key={prize.id} className={`bg-gradient-to-br ${prize.gradient}/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-${prize.color.split('-')[1]}-500/30 shadow-xl sm:shadow-2xl hover:scale-105 transition-all duration-300`}>
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl md:text-6xl mb-2 sm:mb-3 md:mb-4">{prize.image}</div>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 ${prize.color} mx-auto mb-2 sm:mb-3`} />
                  <h4 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1 sm:mb-2">{prize.name}</h4>
                  <p className="text-xs sm:text-sm text-slate-300 mb-2 sm:mb-3">{prize.description}</p>
                  <div className="space-y-1 sm:space-y-2">
                    <p className={`text-lg sm:text-xl md:text-2xl font-bold ${prize.color}`}>{formatCurrency(prize.value)}</p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-slate-400">
                      Win Rate: {(prize.rarity * 100).toFixed(2)}% base
                    </p>
                    <div className="bg-slate-700 rounded-lg p-1.5 sm:p-2">
                      <p className="text-[10px] sm:text-xs text-slate-300">
                        Your chance: {((prize.rarity * (1 + stakeAmount / 100)) * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Number Selection */}
      <div className="relative z-10 mb-8">
        <div className="bg-gradient-to-br from-slate-800 via-purple-800/30 to-slate-800 rounded-2xl p-4 sm:p-8 border-2 border-purple-500/30 shadow-xl">
          <h3 className="text-xl sm:text-2xl font-bold text-center text-purple-400 mb-4 sm:mb-6">
            🎯 Select 6 Lucky Numbers (1-49)
          </h3>
          
          <div className="grid grid-cols-6 xs:grid-cols-7 sm:grid-cols-8 md:grid-cols-10 gap-1.5 sm:gap-2 md:gap-3 mb-4 sm:mb-6">
            {Array.from({ length: 49 }, (_, i) => i + 1).map(number => (
              <button
                key={number}
                onClick={() => selectNumber(number)}
                disabled={isPlaying}
                className={`aspect-square rounded-full font-bold text-xs sm:text-sm md:text-base lg:text-lg transition-all duration-300 transform active:scale-95 sm:hover:scale-110 md:hover:scale-125 border-2 shadow-lg ${
                  selectedNumbers.includes(number)
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black border-yellow-300 animate-pulse shadow-yellow-400/50 scale-105'
                    : drawnNumbers.includes(number)
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white border-green-400 animate-bounce shadow-green-500/50'
                    : 'bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white border-slate-500'
                }`}
              >
                {number}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-6">
            <Button variant="outline" onClick={quickPick} disabled={isPlaying} className="w-full sm:w-auto text-base sm:text-lg font-bold px-6 py-3">
              <Zap className="w-5 h-5 mr-2" />
              Quick Pick
            </Button>
            <Button variant="outline" onClick={clearNumbers} disabled={isPlaying || selectedNumbers.length === 0} className="w-full sm:w-auto text-base sm:text-lg font-bold px-6 py-3">
              Clear All
            </Button>
          </div>

          <div className="text-center">
            <p className="text-slate-300 text-lg mb-4">
              Selected: <span className="font-bold text-yellow-400">{selectedNumbers.join(', ') || 'None'}</span>
            </p>
            <p className="text-slate-400">
              {selectedNumbers.length}/6 numbers selected
            </p>
          </div>
        </div>
      </div>

      {/* Stake Selection */}
      <div className="relative z-10 mb-8">
        <div className="bg-gradient-to-br from-slate-800 via-green-800/20 to-slate-800 rounded-2xl p-4 sm:p-6 border-2 border-green-500/30 shadow-xl">
          <h3 className="text-lg sm:text-2xl font-bold text-center text-green-400 mb-4 sm:mb-6">
            💰 Choose Your Stake (Higher = Better chance!)
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {[100, 200, 300, 500, 1000].map(amount => (
              <button
                key={amount}
                onClick={() => setStakeAmount(amount)}
                disabled={isPlaying}
                className={`h-16 font-bold text-lg rounded-xl transition-all duration-300 transform hover:scale-110 border-2 shadow-lg ${
                  stakeAmount === amount
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white border-green-400 animate-pulse shadow-green-500/50 scale-110'
                    : 'bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white border-slate-500'
                }`}
              >
                <div>{formatCurrency(amount)}</div>
                <div className="text-xs opacity-80">
                  {((0.1 * (1 + amount / 100)) * 100).toFixed(1)}% chance
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center space-x-4">
            <Coins className="w-6 h-6 text-yellow-400" />
            <Input
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(Math.max(10, parseInt(e.target.value) || 10))}
              className="w-32 text-center text-xl font-bold"
              min="10"
              max={session.balance}
              disabled={isPlaying}
            />
            <div className="text-center">
              <p className="text-slate-400">Win Chance:</p>
              <p className="text-xl font-bold text-yellow-400">{(winChance * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Tickets */}
      {tickets.length > 0 && (
        <div className="relative z-10 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-center text-blue-400 mb-3 sm:mb-4 md:mb-6">🎫 Your Lottery Tickets</h3>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-blue-500/30 shadow-xl">
            <div className="grid grid-cols-1 gap-2 sm:gap-3 md:gap-4 max-h-60 sm:max-h-80 overflow-y-auto">
              {tickets.map(ticket => (
                <div key={ticket.id} className="bg-gradient-to-r from-blue-700/30 to-purple-700/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-sm sm:text-base md:text-lg">{ticket.numbers.join(' - ')}</p>
                      <p className="text-xs sm:text-sm text-slate-400">
                        Stake: {formatCurrency(ticket.stake)} | 
                        Chance: {((0.1 * (1 + ticket.stake / 100)) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <Target className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 sm:mt-4 text-center">
              <p className="text-xs sm:text-sm text-slate-400">
                Total Investment: <span className="font-bold text-white text-base sm:text-lg md:text-xl">{formatCurrency(tickets.reduce((sum, t) => sum + t.stake, 0))}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Drawn Numbers Display */}
      {drawnNumbers.length > 0 && (
        <div className="relative z-10 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-center text-yellow-400 mb-3 sm:mb-4 md:mb-6">🎰 Winning Numbers</h3>
          <div className="bg-gradient-to-r from-yellow-600/20 via-orange-600/20 to-red-600/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-yellow-500/30 shadow-xl">
            <div className="flex justify-center gap-2 sm:gap-3 md:gap-4 flex-wrap">
              {drawnNumbers.map((number, index) => (
                <div
                  key={index}
                  className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-lg sm:text-xl md:text-2xl font-bold text-black border-2 sm:border-3 border-yellow-300 shadow-xl sm:shadow-2xl shadow-yellow-400/50 ${
                    drawAnimation ? 'animate-bounce' : 'animate-pulse'
                  }`}
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  {number}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="relative z-10 space-y-4">
        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
          <Button
            onClick={buyTicket}
            disabled={isPlaying || selectedNumbers.length !== 6 || stakeAmount > session.balance}
            className="w-full sm:w-auto px-6 sm:px-12 py-4 sm:py-6 text-lg sm:text-2xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 hover:from-pink-500 hover:via-purple-500 hover:to-blue-500 transform hover:scale-105 sm:hover:scale-110 transition-all duration-300 shadow-2xl shadow-pink-500/30 rounded-2xl border-2 border-pink-400"
          >
            <Gift className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3" />
            BUY TICKET {formatCurrency(stakeAmount)}
          </Button>
          
          <Button
            onClick={drawLottery}
            disabled={isDrawing || tickets.length === 0}
            className="w-full sm:w-auto px-6 sm:px-12 py-4 sm:py-6 text-lg sm:text-2xl font-bold bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 hover:from-yellow-500 hover:via-orange-500 hover:to-red-500 transform hover:scale-105 sm:hover:scale-110 transition-all duration-300 shadow-2xl shadow-yellow-500/30 rounded-2xl border-2 border-yellow-400"
          >
            {isDrawing ? (
              <div className="flex items-center justify-center space-x-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>DRAWING...</span>
              </div>
            ) : (
              <>
                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3" />
                DRAW LOTTERY
              </>
            )}
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6">
          <Button 
            variant="outline" 
            onClick={resetSession} 
            disabled={isPlaying}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-lg sm:text-xl font-bold border-2 border-purple-500 hover:bg-purple-500/20"
          >
            <RotateCcw className="w-6 h-6 mr-3" />
            Reset Session
          </Button>
        </div>
      </div>

      {/* Game Statistics */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 text-center mt-3 sm:mt-4 md:mt-6 lg:mt-8">
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border border-slate-600 shadow-lg">
          <p className="text-slate-400 font-medium text-[10px] sm:text-xs md:text-sm">Tickets</p>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white">{gameStats.ticketsBought}</p>
        </div>
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border border-slate-600 shadow-lg">
          <p className="text-slate-400 font-medium text-[10px] sm:text-xs md:text-sm">Staked</p>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-blue-400">{formatCurrency(gameStats.totalStaked)}</p>
        </div>
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border border-slate-600 shadow-lg">
          <p className="text-slate-400 font-medium text-[10px] sm:text-xs md:text-sm">Prizes Won</p>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-green-400">{gameStats.prizesWon}</p>
        </div>
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border border-slate-600 shadow-lg">
          <p className="text-slate-400 font-medium text-[10px] sm:text-xs md:text-sm">Biggest Win</p>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-yellow-400">{formatCurrency(gameStats.biggestWin)}</p>
        </div>
      </div>

      {/* Prize Won Modal */}
      {showPrizeModal && winningPrize && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className={`bg-gradient-to-br ${winningPrize.gradient}/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-12 border-2 sm:border-4 border-yellow-400 max-w-2xl w-full shadow-2xl animate-pulse`}>
            <div className="text-center">
              <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-3 sm:mb-4 md:mb-6">{winningPrize.image}</div>
              <Crown className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-yellow-400 mx-auto mb-3 sm:mb-4 md:mb-6 animate-bounce" />
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 sm:mb-3 md:mb-4 animate-bounce">
                🎉 CONGRATULATIONS! 🎉
              </h2>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-yellow-400 mb-2 sm:mb-3 md:mb-4">
                You Won a {winningPrize.name}!
              </h3>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-300 mb-3 sm:mb-4 md:mb-6">{winningPrize.description}</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-400 mb-4 sm:mb-6 md:mb-8">
                Value: {formatCurrency(winningPrize.value)}
              </p>
              
              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                <p className="text-sm sm:text-base md:text-lg text-slate-300">
                  🎁 Your prize has been credited as cash to your account!
                </p>
                <p className="text-xs sm:text-sm text-slate-400">
                  * In a real casino, you would receive the actual physical prize
                </p>
              </div>
              
              <Button 
                onClick={() => setShowPrizeModal(false)}
                className="mt-4 sm:mt-6 md:mt-8 px-6 sm:px-8 md:px-12 py-3 sm:py-4 text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400"
              >
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                Claim Prize!
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="relative z-10 mt-3 sm:mt-4 md:mt-6 lg:mt-8 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-slate-700 shadow-xl">
        <h4 className="text-base sm:text-lg md:text-xl font-bold text-center text-white mb-3 sm:mb-4">🎮 How It Works</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 text-center">
          <div className="bg-blue-600/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-500/30">
            <Target className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-400 mx-auto mb-2" />
            <p className="font-bold text-blue-400 text-sm sm:text-base">1. Pick Numbers</p>
            <p className="text-xs sm:text-sm text-slate-300">Select 6 lucky numbers from 1-49</p>
          </div>
          <div className="bg-green-600/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-500/30">
            <Coins className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-green-400 mx-auto mb-2" />
            <p className="font-bold text-green-400 text-sm sm:text-base">2. Choose Stake</p>
            <p className="text-xs sm:text-sm text-slate-300">Higher stakes increase your win chances</p>
          </div>
          <div className="bg-yellow-600/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-yellow-500/30">
            <Trophy className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-yellow-400 mx-auto mb-2" />
            <p className="font-bold text-yellow-400 text-sm sm:text-base">3. Win Prizes</p>
            <p className="text-xs sm:text-sm text-slate-300">Win amazing tech gadgets and cash!</p>
          </div>
        </div>
      </div>
    </div>
  );
}