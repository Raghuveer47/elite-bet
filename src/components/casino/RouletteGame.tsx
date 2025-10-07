import React, { useState, useEffect } from 'react';
import { RotateCcw, Coins, Volume2, VolumeX, Trophy, Zap, Target, TrendingUp } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';
import toast from 'react-hot-toast';
import { useCasinoGame } from '../../hooks/useCasinoGame';
import { formatCurrency } from '../../lib/utils';
import { eventBus } from '../../utils/eventBus';

interface RouletteGameProps {
  gameId: string;
  gameName: string;
}

interface Bet {
  type: string;
  value: number | string;
  amount: number;
  label: string;
  payout: number;
}

const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export function RouletteGame({ gameId, gameName }: RouletteGameProps) {
  const { user } = useAuth();
  const { addTransaction } = useWallet();
  const { session, isPlaying, setIsPlaying, placeBet, addWinnings, resetSession } = useCasinoGame(gameId);
  const [betAmount, setBetAmount] = useState(10);
  const [bets, setBets] = useState<Bet[]>([]);
  const [lastResult, setLastResult] = useState<any>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningBets, setWinningBets] = useState<Bet[]>([]);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [ballPosition, setBallPosition] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [hotNumbers, setHotNumbers] = useState<number[]>([]);
  const [coldNumbers, setColdNumbers] = useState<number[]>([]);
  const [winAnimation, setWinAnimation] = useState(false);
  const [ballAnimation, setBallAnimation] = useState(false);

  useEffect(() => {
    if (gameHistory.length >= 10) {
      const numberCounts = gameHistory.slice(0, 20).reduce((acc, result) => {
        acc[result.number] = (acc[result.number] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      const sortedNumbers = Object.entries(numberCounts)
        .sort(([,a], [,b]) => b - a)
        .map(([num]) => parseInt(num));

      setHotNumbers(sortedNumbers.slice(0, 6));
      setColdNumbers(Array.from({length: 37}, (_, i) => i).filter(n => !sortedNumbers.includes(n)).slice(0, 6));
    }
  }, [gameHistory]);

  const getNumberColor = (num: number) => {
    if (num === 0) return 'green';
    return RED_NUMBERS.includes(num) ? 'red' : 'black';
  };

  const getNumberStyle = (num: number) => {
    const color = getNumberColor(num);
    const isWinning = lastResult && lastResult.number === num;
    const isHot = hotNumbers.includes(num);
    const isCold = coldNumbers.includes(num);
    
    let baseStyle = "w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 transform hover:scale-125 cursor-pointer border-3 shadow-lg relative overflow-hidden";
    
    if (isWinning) {
      return `${baseStyle} bg-gradient-to-br from-yellow-400 to-orange-500 text-black border-yellow-300 animate-pulse shadow-2xl shadow-yellow-400/70 scale-125`;
    }
    
    let colorStyle = '';
    switch (color) {
      case 'red':
        colorStyle = 'bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white border-red-400 shadow-red-500/30';
        break;
      case 'black':
        colorStyle = 'bg-gradient-to-br from-gray-800 to-black hover:from-gray-700 hover:to-gray-900 text-white border-gray-600 shadow-gray-800/50';
        break;
      case 'green':
        colorStyle = 'bg-gradient-to-br from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 text-white border-green-400 shadow-green-500/30';
        break;
    }
    
    if (isHot) {
      colorStyle += ' ring-2 ring-orange-400 ring-opacity-60';
    } else if (isCold) {
      colorStyle += ' ring-2 ring-blue-400 ring-opacity-60';
    }
    
    return `${baseStyle} ${colorStyle}`;
  };

  const spinRoulette = () => {
    const randomIndex = Math.floor(Math.random() * ROULETTE_NUMBERS.length);
    const number = ROULETTE_NUMBERS[randomIndex];
    
    let color: 'red' | 'black' | 'green' = 'green';
    if (number !== 0) {
      color = RED_NUMBERS.includes(number) ? 'red' : 'black';
    }

    const isEven = number !== 0 && number % 2 === 0;
    const dozen = number === 0 ? 0 : Math.ceil(number / 12);
    const column = number === 0 ? 0 : ((number - 1) % 3) + 1;

    return { number, color, isEven, dozen, column };
  };

  const calculatePayout = (bet: Bet, result: any): number => {
    const { type, value, amount } = bet;
    const { number, color, isEven, dozen, column } = result;

    switch (type) {
      case 'straight':
        return number === value ? amount * 35 : 0;
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
  };

  const placeBetOnNumber = (number: number) => {
    if (!user || betAmount > session.balance) {
      toast.error('Insufficient balance!');
      return;
    }

    const newBet: Bet = {
      type: 'straight',
      value: number,
      amount: betAmount,
      label: `${number}`,
      payout: 35
    };

    setBets(prev => [...prev, newBet]);
    
    if (soundEnabled) {
      console.log('🔊 Chip placed sound...');
    }
  };

  const placeBetOnColor = (color: 'red' | 'black') => {
    if (!user || betAmount > session.balance) {
      toast.error('Insufficient balance!');
      return;
    }

    const newBet: Bet = {
      type: 'color',
      value: color,
      amount: betAmount,
      label: color.charAt(0).toUpperCase() + color.slice(1),
      payout: 2
    };

    setBets(prev => [...prev, newBet]);
  };

  const placeBetOnEvenOdd = (type: 'even' | 'odd') => {
    if (!user || betAmount > session.balance) {
      toast.error('Insufficient balance!');
      return;
    }

    const newBet: Bet = {
      type: 'even_odd',
      value: type,
      amount: betAmount,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      payout: 2
    };

    setBets(prev => [...prev, newBet]);
  };

  const placeBetOnRange = (range: 'low' | 'high') => {
    if (!user || betAmount > session.balance) {
      toast.error('Insufficient balance!');
      return;
    }

    const newBet: Bet = {
      type: 'high_low',
      value: range,
      amount: betAmount,
      label: range === 'low' ? '1-18' : '19-36',
      payout: 2
    };

    setBets(prev => [...prev, newBet]);
  };

  const placeBetOnDozen = (dozen: number) => {
    if (!user || betAmount > session.balance) {
      toast.error('Insufficient balance!');
      return;
    }

    const ranges = ['1-12', '13-24', '25-36'];
    const newBet: Bet = {
      type: 'dozen',
      value: dozen,
      amount: betAmount,
      label: ranges[dozen - 1],
      payout: 3
    };

    setBets(prev => [...prev, newBet]);
  };

  const animateWheel = async (finalNumber: number): Promise<void> => {
    return new Promise((resolve) => {
      const finalPosition = ROULETTE_NUMBERS.indexOf(finalNumber);
      const targetRotation = 360 * 8 + (finalPosition * (360 / 37));
      
      setBallAnimation(true);
      let currentRotation = wheelRotation;
      const duration = 4000;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for realistic deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        currentRotation = wheelRotation + (targetRotation - wheelRotation) * easeOut;
        setWheelRotation(currentRotation);
        setBallPosition(360 - currentRotation);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setBallAnimation(false);
          resolve();
        }
      };
      
      requestAnimationFrame(animate);
    });
  };

  const spin = async () => {
    if (bets.length === 0) {
      toast.error('Please place at least one bet!');
      return;
    }

    const totalBetAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);
    if (!user || totalBetAmount > session.balance) {
      toast.error('Insufficient balance for all bets!');
      return;
    }

    try {
      bets.forEach(bet => placeBet(bet.amount));
      
      bets.forEach(bet => {
        addTransaction({
          userId: user.id,
          type: 'bet',
          status: 'completed',
          amount: -bet.amount,
          currency: 'USD',
          fee: 0,
          method: 'Casino Game',
          description: `${gameName} - ${bet.label} (${bet.payout}:1)`,
          metadata: {
            gameId,
            gameName,
            betType: bet.type,
            betValue: bet.value,
            betAmount: bet.amount,
            expectedPayout: bet.payout
          }
        });
      });
      
      setIsPlaying(true);
      setIsSpinning(true);
      setWinningBets([]);
      setWinAnimation(false);

      if (soundEnabled) {
        console.log('🔊 Wheel spinning sound...');
      }

      const result = spinRoulette();
      await animateWheel(result.number);
      
      setLastResult(result);
      setGameHistory(prev => [result, ...prev.slice(0, 19)]);
      
      let totalWinnings = 0;
      const winning: Bet[] = [];
      
      bets.forEach(bet => {
        const payout = calculatePayout(bet, result);
        if (payout > 0) {
          totalWinnings += payout;
          winning.push(bet);
        }
      });
      
      setWinningBets(winning);
      
      if (totalWinnings > 0) {
        addWinnings(totalWinnings);
        setWinAnimation(true);
        setTimeout(() => setWinAnimation(false), 4000);
        
        const profit = totalWinnings - totalBetAmount;
        const multiplier = totalWinnings / totalBetAmount;
        
        addTransaction({
          userId: user.id,
          type: 'win',
          status: 'completed',
          amount: totalWinnings,
          currency: 'USD',
          fee: 0,
          method: 'Casino Game',
          description: `${gameName} - Win on ${result.number} ${result.color} (${multiplier.toFixed(1)}x)`,
          metadata: {
            gameId,
            gameName,
            result,
            winningBets: winning.length,
            totalBets: bets.length,
            profit,
            multiplier
          }
        });
        
        if (soundEnabled) {
          console.log('🔊 Win sound playing...');
        }
        
        if (multiplier >= 20) {
          toast.success(`🎯 MEGA WIN! ${result.number} ${result.color} - +${formatCurrency(totalWinnings)} (${multiplier.toFixed(1)}x)`, { duration: 8000 });
        } else if (multiplier >= 5) {
          toast.success(`🎯 BIG WIN! ${result.number} ${result.color} - +${formatCurrency(totalWinnings)} (${multiplier.toFixed(1)}x)`, { duration: 6000 });
        } else {
          toast.success(`🎯 Winner! ${result.number} ${result.color} - +${formatCurrency(totalWinnings)}`);
        }
      } else {
        if (soundEnabled) {
          console.log('🔊 Loss sound playing...');
        }
        toast.error(`🎲 ${result.number} ${result.color} - Try again!`);
      }
      
      eventBus.emit('casinoWin', {
        gameId,
        userId: user.id,
        gameName,
        betAmount: totalBetAmount,
        winAmount: totalWinnings,
        result,
        timestamp: new Date()
      });
      
      setIsSpinning(false);
      setIsPlaying(false);
      setBets([]);

    } catch (error) {
      console.error('Spin error:', error);
      setIsPlaying(false);
      setIsSpinning(false);
    }
  };

  const clearBets = () => {
    setBets([]);
    setWinningBets([]);
  };

  const totalBetAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);

  return (
    <div className="bg-gradient-to-b from-slate-800 via-red-900/20 to-slate-900 rounded-3xl p-8 border-2 border-red-500/30 relative overflow-hidden shadow-2xl">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-red-500 to-yellow-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-br from-green-500 to-blue-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Game Header */}
      <div className="relative z-10 text-center mb-8">
        <div className="flex items-center justify-center space-x-4 mb-6">
          <Target className="w-10 h-10 text-red-400 animate-pulse" />
          <h2 className="text-5xl font-bold bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 bg-clip-text text-transparent">
            {gameName}
          </h2>
          <Target className="w-10 h-10 text-red-400 animate-pulse" />
        </div>
        
        <div className="flex justify-center space-x-12 text-lg">
          <div className="text-center">
            <p className="text-slate-400 font-medium">Balance</p>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(session.balance)}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 font-medium">Total Bets</p>
            <p className="text-2xl font-bold text-blue-400">{formatCurrency(totalBetAmount)}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 font-medium">Last Result</p>
            <div className="text-2xl font-bold">
              {lastResult ? (
                <span className={`px-4 py-2 rounded-full border-2 ${
                  lastResult.color === 'red' ? 'bg-red-600 border-red-400 text-white' :
                  lastResult.color === 'black' ? 'bg-gray-800 border-gray-600 text-white' : 
                  'bg-green-600 border-green-400 text-white'
                } shadow-lg`}>
                  {lastResult.number}
                </span>
              ) : (
                <span className="text-slate-400">-</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Roulette Wheel */}
      <div className="relative z-10 flex justify-center mb-8">
        <div className="relative">
          {/* Wheel Base */}
          <div className="w-96 h-96 rounded-full bg-gradient-to-br from-yellow-600 via-orange-600 to-red-600 p-6 shadow-2xl border-4 border-yellow-400">
            {/* Wheel */}
            <div 
              className="w-full h-full rounded-full bg-gradient-to-br from-red-800 via-black to-green-800 relative overflow-hidden border-4 border-yellow-400 transition-transform duration-[4000ms] ease-out shadow-inner"
              style={{ transform: `rotate(${wheelRotation}deg)` }}
            >
              {/* Number Segments */}
              {ROULETTE_NUMBERS.map((number, index) => {
                const angle = (index * 360) / 37;
                const color = getNumberColor(number);
                return (
                  <div
                    key={number}
                    className={`absolute w-8 h-8 flex items-center justify-center text-sm font-bold text-white border border-yellow-300 ${
                      color === 'red' ? 'bg-red-600' : 
                      color === 'black' ? 'bg-gray-900' : 'bg-green-600'
                    }`}
                    style={{
                      transform: `rotate(${angle}deg) translateY(-170px)`,
                      transformOrigin: '50% 170px'
                    }}
                  >
                    {number}
                  </div>
                );
              })}
              
              {/* Center Hub */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full border-4 border-yellow-300 shadow-2xl">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-yellow-200 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Ball */}
          <div 
            className={`absolute w-5 h-5 bg-gradient-to-br from-white to-gray-300 rounded-full shadow-2xl border-2 border-gray-400 transition-all duration-[4000ms] ease-out ${
              ballAnimation ? 'animate-pulse' : ''
            }`}
            style={{
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) rotate(${ballPosition}deg) translateY(-160px)`,
              zIndex: 20
            }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-white to-gray-200 shadow-inner"></div>
          </div>
          
          {/* Wheel Indicator */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-b-12 border-l-transparent border-r-transparent border-b-yellow-400 shadow-lg z-30"></div>
        </div>
      </div>

      {/* Win Animation */}
      {winAnimation && winningBets.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
          <div className="bg-gradient-to-r from-yellow-400/90 via-orange-500/90 to-red-500/90 rounded-3xl p-8 border-4 border-yellow-300 animate-pulse shadow-2xl">
            <div className="text-center">
              <Trophy className="w-16 h-16 text-yellow-200 mx-auto mb-4 animate-bounce" />
              <p className="text-4xl font-bold text-white mb-2">🎯 WINNER! 🎯</p>
              <p className="text-2xl text-yellow-200">
                {lastResult?.number} {lastResult?.color.toUpperCase()}
              </p>
              <p className="text-xl text-white mt-2">
                {winningBets.length} winning bet{winningBets.length > 1 ? 's' : ''}!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Game Statistics */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Hot Numbers */}
        <div className="bg-gradient-to-br from-orange-800/50 to-red-800/50 rounded-2xl p-6 border-2 border-orange-500/30 shadow-xl">
          <h4 className="text-xl font-bold text-orange-400 mb-4 flex items-center">
            <Zap className="w-6 h-6 mr-2 animate-pulse" />
            Hot Numbers
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {hotNumbers.map(num => (
              <div
                key={num}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2 shadow-lg ${
                  getNumberColor(num) === 'red' ? 'bg-red-600 border-red-400 text-white' :
                  getNumberColor(num) === 'black' ? 'bg-gray-800 border-gray-600 text-white' : 
                  'bg-green-600 border-green-400 text-white'
                } ring-2 ring-orange-400 ring-opacity-60 animate-pulse`}
              >
                {num}
              </div>
            ))}
          </div>
        </div>

        {/* Cold Numbers */}
        <div className="bg-gradient-to-br from-blue-800/50 to-cyan-800/50 rounded-2xl p-6 border-2 border-blue-500/30 shadow-xl">
          <h4 className="text-xl font-bold text-blue-400 mb-4">Cold Numbers</h4>
          <div className="grid grid-cols-3 gap-3">
            {coldNumbers.map(num => (
              <div
                key={num}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2 shadow-lg opacity-70 ${
                  getNumberColor(num) === 'red' ? 'bg-red-600 border-red-400 text-white' :
                  getNumberColor(num) === 'black' ? 'bg-gray-800 border-gray-600 text-white' : 
                  'bg-green-600 border-green-400 text-white'
                } ring-2 ring-blue-400 ring-opacity-40`}
              >
                {num}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Results */}
        <div className="bg-gradient-to-br from-purple-800/50 to-pink-800/50 rounded-2xl p-6 border-2 border-purple-500/30 shadow-xl">
          <h4 className="text-xl font-bold text-purple-400 mb-4">Recent Results</h4>
          <div className="grid grid-cols-5 gap-2">
            {gameHistory.slice(0, 10).map((result, index) => (
              <div
                key={index}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 shadow-lg ${
                  result.color === 'red' ? 'bg-red-600 border-red-400 text-white' :
                  result.color === 'black' ? 'bg-gray-800 border-gray-600 text-white' : 
                  'bg-green-600 border-green-400 text-white'
                }`}
                title={`${result.number} ${result.color} - ${result.isEven ? 'Even' : 'Odd'}`}
              >
                {result.number}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Betting Board */}
      <div className="relative z-10 bg-gradient-to-br from-green-800 via-green-900 to-black rounded-3xl p-8 mb-8 border-4 border-green-600 shadow-2xl">
        {/* Zero */}
        <div className="flex justify-center mb-6">
          <button
            onClick={() => placeBetOnNumber(0)}
            disabled={isPlaying}
            className={`${getNumberStyle(0)} text-2xl w-20 h-20`}
          >
            0
          </button>
        </div>
        
        {/* Main Numbers Grid */}
        <div className="grid grid-cols-12 gap-2 mb-8">
          {Array.from({ length: 36 }, (_, i) => i + 1).map(num => (
            <button
              key={num}
              onClick={() => placeBetOnNumber(num)}
              disabled={isPlaying}
              className={getNumberStyle(num)}
            >
              {num}
            </button>
          ))}
        </div>

        {/* Outside Bets */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <button
            onClick={() => placeBetOnColor('red')}
            disabled={isPlaying}
            className="h-20 bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white font-bold text-xl rounded-xl disabled:opacity-50 transition-all duration-300 transform hover:scale-110 border-3 border-red-400 shadow-2xl shadow-red-500/30"
          >
            <div className="flex items-center justify-center space-x-2">
              <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-red-300"></div>
              <span>RED</span>
            </div>
            <div className="text-sm opacity-80">2:1</div>
          </button>
          
          <button
            onClick={() => placeBetOnColor('black')}
            disabled={isPlaying}
            className="h-20 bg-gradient-to-br from-gray-800 to-black hover:from-gray-700 hover:to-gray-900 text-white font-bold text-xl rounded-xl disabled:opacity-50 transition-all duration-300 transform hover:scale-110 border-3 border-gray-600 shadow-2xl shadow-gray-800/50"
          >
            <div className="flex items-center justify-center space-x-2">
              <div className="w-6 h-6 bg-gray-800 rounded-full border-2 border-gray-600"></div>
              <span>BLACK</span>
            </div>
            <div className="text-sm opacity-80">2:1</div>
          </button>
          
          <button
            onClick={() => placeBetOnEvenOdd('even')}
            disabled={isPlaying}
            className="h-20 bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white font-bold text-xl rounded-xl disabled:opacity-50 transition-all duration-300 transform hover:scale-110 border-3 border-blue-500 shadow-2xl shadow-blue-500/30"
          >
            <div>EVEN</div>
            <div className="text-sm opacity-80">2:1</div>
          </button>
          
          <button
            onClick={() => placeBetOnEvenOdd('odd')}
            disabled={isPlaying}
            className="h-20 bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white font-bold text-xl rounded-xl disabled:opacity-50 transition-all duration-300 transform hover:scale-110 border-3 border-purple-500 shadow-2xl shadow-purple-500/30"
          >
            <div>ODD</div>
            <div className="text-sm opacity-80">2:1</div>
          </button>
          
          <button
            onClick={() => placeBetOnRange('low')}
            disabled={isPlaying}
            className="h-20 bg-gradient-to-br from-orange-600 to-orange-800 hover:from-orange-500 hover:to-orange-700 text-white font-bold text-xl rounded-xl disabled:opacity-50 transition-all duration-300 transform hover:scale-110 border-3 border-orange-500 shadow-2xl shadow-orange-500/30"
          >
            <div>1-18</div>
            <div className="text-sm opacity-80">2:1</div>
          </button>
          
          <button
            onClick={() => placeBetOnRange('high')}
            disabled={isPlaying}
            className="h-20 bg-gradient-to-br from-orange-600 to-orange-800 hover:from-orange-500 hover:to-orange-700 text-white font-bold text-xl rounded-xl disabled:opacity-50 transition-all duration-300 transform hover:scale-110 border-3 border-orange-500 shadow-2xl shadow-orange-500/30"
          >
            <div>19-36</div>
            <div className="text-sm opacity-80">2:1</div>
          </button>
        </div>

        {/* Dozen Bets */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <button
            onClick={() => placeBetOnDozen(1)}
            disabled={isPlaying}
            className="h-16 bg-gradient-to-br from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white font-bold text-lg rounded-xl disabled:opacity-50 transition-all duration-300 transform hover:scale-110 border-2 border-indigo-500 shadow-xl"
          >
            <div>1st DOZEN</div>
            <div className="text-sm opacity-80">3:1</div>
          </button>
          <button
            onClick={() => placeBetOnDozen(2)}
            disabled={isPlaying}
            className="h-16 bg-gradient-to-br from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white font-bold text-lg rounded-xl disabled:opacity-50 transition-all duration-300 transform hover:scale-110 border-2 border-indigo-500 shadow-xl"
          >
            <div>2nd DOZEN</div>
            <div className="text-sm opacity-80">3:1</div>
          </button>
          <button
            onClick={() => placeBetOnDozen(3)}
            disabled={isPlaying}
            className="h-16 bg-gradient-to-br from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white font-bold text-lg rounded-xl disabled:opacity-50 transition-all duration-300 transform hover:scale-110 border-2 border-indigo-500 shadow-xl"
          >
            <div>3rd DOZEN</div>
            <div className="text-sm opacity-80">3:1</div>
          </button>
        </div>
      </div>

      {/* Current Bets Display */}
      {bets.length > 0 && (
        <div className="relative z-10 mb-8">
          <h3 className="text-2xl font-bold text-center mb-4 text-yellow-400">Current Bets</h3>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border-2 border-slate-700 shadow-xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {bets.map((bet, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-2 transition-all duration-500 shadow-lg ${
                    winningBets.includes(bet) 
                      ? 'bg-gradient-to-br from-green-600/30 to-green-800/30 border-green-400 animate-pulse shadow-2xl shadow-green-400/40' 
                      : 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600'
                  }`}
                >
                  <div className="text-center">
                    <p className="font-bold text-white text-lg">{bet.label}</p>
                    <p className="text-lg text-yellow-400 font-bold">{formatCurrency(bet.amount)}</p>
                    <p className="text-sm text-slate-400">Pays {bet.payout}:1</p>
                    {winningBets.includes(bet) && (
                      <p className="text-sm text-green-400 font-bold animate-bounce">🎯 WINNER!</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <p className="text-slate-400 text-lg">
                Total Bet: <span className="font-bold text-white text-xl">{formatCurrency(totalBetAmount)}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="relative z-10 space-y-6">
        {/* Bet Amount Controls */}
        <div className="bg-gradient-to-r from-slate-800 via-blue-800/30 to-slate-800 rounded-2xl p-6 border-2 border-blue-500/30 shadow-xl">
          <div className="flex items-center justify-center space-x-4">
            <Button variant="outline" onClick={() => setBetAmount(1)} disabled={isPlaying} className="text-lg font-bold px-6 py-3">
              $1
            </Button>
            <Button variant="outline" onClick={() => setBetAmount(5)} disabled={isPlaying} className="text-lg font-bold px-6 py-3">
              $5
            </Button>
            <Button variant="outline" onClick={() => setBetAmount(10)} disabled={isPlaying} className="text-lg font-bold px-6 py-3">
              $10
            </Button>
            <Button variant="outline" onClick={() => setBetAmount(25)} disabled={isPlaying} className="text-lg font-bold px-6 py-3">
              $25
            </Button>
            <Button variant="outline" onClick={() => setBetAmount(50)} disabled={isPlaying} className="text-lg font-bold px-6 py-3">
              $50
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
                disabled={isPlaying}
              />
            </div>
          </div>
        </div>

        {/* Main Action Buttons */}
        <div className="flex justify-center space-x-6">
          <Button
            onClick={spin}
            disabled={isPlaying || bets.length === 0 || totalBetAmount > session.balance}
            className="px-16 py-6 text-2xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 hover:from-red-500 hover:via-orange-500 hover:to-yellow-500 transform hover:scale-110 transition-all duration-300 shadow-2xl shadow-red-500/30 rounded-2xl border-2 border-red-400"
          >
            {isSpinning ? (
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>SPINNING...</span>
              </div>
            ) : (
              <>
                <Target className="w-8 h-8 mr-3" />
                SPIN WHEEL
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={clearBets} 
            disabled={isPlaying || bets.length === 0}
            className="px-8 py-6 text-xl font-bold border-2 border-yellow-500 hover:bg-yellow-500/20"
          >
            Clear Bets
          </Button>
          
          <Button 
            variant="outline" 
            onClick={resetSession} 
            disabled={isPlaying}
            className="px-8 py-6 text-xl font-bold border-2 border-purple-500 hover:bg-purple-500/20"
          >
            <RotateCcw className="w-6 h-6 mr-3" />
            Reset
          </Button>
        </div>

        {/* Settings */}
        <div className="flex justify-center space-x-6">
          <Button
            variant="ghost"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-4"
          >
            {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => setShowHistory(!showHistory)}
            className="p-4"
          >
            <TrendingUp className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-8 border-2 border-purple-500 max-w-2xl w-full max-h-[80vh] overflow-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Game History</h3>
              <Button variant="ghost" onClick={() => setShowHistory(false)} className="text-2xl">
                ✕
              </Button>
            </div>
            
            <div className="space-y-3">
              {gameHistory.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-700 rounded-xl border border-slate-600">
                  <span className="text-slate-400 font-bold">#{gameHistory.length - index}</span>
                  <span className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2 shadow-lg ${
                    result.color === 'red' ? 'bg-red-600 border-red-400 text-white' :
                    result.color === 'black' ? 'bg-gray-800 border-gray-600 text-white' : 
                    'bg-green-600 border-green-400 text-white'
                  }`}>
                    {result.number}
                  </span>
                  <div className="text-right">
                    <p className="text-white font-bold">{result.color.toUpperCase()}</p>
                    <p className="text-slate-400 text-sm">{result.isEven ? 'Even' : 'Odd'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game Statistics */}
      <div className="relative z-10 grid grid-cols-4 gap-4 text-center">
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl p-4 border-2 border-slate-600 shadow-lg">
          <p className="text-slate-400 font-medium">Spins</p>
          <p className="text-2xl font-bold text-white">{session.spinsPlayed}</p>
        </div>
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl p-4 border-2 border-slate-600 shadow-lg">
          <p className="text-slate-400 font-medium">Wagered</p>
          <p className="text-2xl font-bold text-blue-400">{formatCurrency(session.totalWagered)}</p>
        </div>
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl p-4 border-2 border-slate-600 shadow-lg">
          <p className="text-slate-400 font-medium">Won</p>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(session.totalWon)}</p>
        </div>
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl p-4 border-2 border-slate-600 shadow-lg">
          <p className="text-slate-400 font-medium">RTP</p>
          <p className="text-2xl font-bold text-purple-400">
            {session.totalWagered > 0 ? ((session.totalWon / session.totalWagered) * 100).toFixed(1) : '0.0'}%
          </p>
        </div>
      </div>
    </div>
  );
}