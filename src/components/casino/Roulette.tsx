import { useState, useEffect, useMemo, useRef } from 'react';
import { Wheel } from 'react-custom-roulette';
import { RotateCcw, Coins, Volume2, VolumeX, Trophy, Zap, Target, TrendingUp } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useWallet } from '../../contexts/SupabaseWalletContext';
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
  const { processBet, processWin } = useWallet();
  const { session, isPlaying, setIsPlaying, placeBet, addWinnings, resetSession } = useCasinoGame(gameId);
  const [betAmount, setBetAmount] = useState(100);
  const [bets, setBets] = useState<Bet[]>([]);
  const [lastResult, setLastResult] = useState<any>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningBets, setWinningBets] = useState<Bet[]>([]);
  // retained for styling legacy hooks (cleaned up unused state)
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [hotNumbers, setHotNumbers] = useState<number[]>([]);
  const [coldNumbers, setColdNumbers] = useState<number[]>([]);
  const [winAnimation, setWinAnimation] = useState(false);
  const [ballAnimation, setBallAnimation] = useState(false);
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeIndex, setPrizeIndex] = useState(0);
  const pendingResultRef = useRef<any | null>(null);
  const pendingBetsRef = useRef<Bet[] | null>(null);
  const wheelWrapRef = useRef<HTMLDivElement | null>(null);
  const [ballAngle, setBallAngle] = useState(0);
  const [ballRadiusPx, setBallRadiusPx] = useState(160);

  const wheelData = useMemo(
    () =>
      ROULETTE_NUMBERS.map((n) => ({
        option: String(n),
        style: {
          backgroundColor: n === 0 ? '#1faa00' : (RED_NUMBERS.includes(n) ? '#d32f2f' : '#2b2b2b'),
          textColor: '#ffffff'
        }
      })),
    []
  );

  // Measure container to place ball at correct radius
  useEffect(() => {
    const calcRadius = () => {
      const el = wheelWrapRef.current;
      if (!el) return;
      const size = Math.min(el.offsetWidth, el.offsetHeight);
      // inner offset to keep ball inside borders
      setBallRadiusPx(Math.max(80, Math.floor(size / 2 - 48)));
    };
    calcRadius();
    window.addEventListener('resize', calcRadius);
    return () => window.removeEventListener('resize', calcRadius);
  }, []);

  const animateBall = (durationMs = 1200, extraTurns = 8) => {
    setBallAnimation(true);
    const start = performance.now();
    const startAngle = ballAngle;
    const total = -(extraTurns * 360); // clockwise
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = easeOut(t);
      setBallAngle(startAngle + total * eased);
      if (t < 1) requestAnimationFrame(step);
      else setBallAnimation(false);
    };
    requestAnimationFrame(step);
  };

  useEffect(() => {
    if (gameHistory.length >= 10) {
      const numberCounts = gameHistory.slice(0, 20).reduce((acc, result) => {
        acc[result.number] = (acc[result.number] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      const sortedNumbers = Object.entries(numberCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))
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

  // Ball visual follows the wheel angle for continuity with old styling
  useEffect(() => {
    if (!mustSpin && ballAnimation) setBallAnimation(false);
  }, [mustSpin, ballAnimation]);

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
      
      // Process all bets
      for (const bet of bets) {
        await processBet(bet.amount, 'Casino Game', `${gameName} - ${bet.label} (${bet.payout}:1)`, {
          gameId,
          gameName,
          betType: bet.type,
          betValue: bet.value,
          betAmount: bet.amount,
          expectedPayout: bet.payout
        });
      }
      
      setIsPlaying(true);
      setIsSpinning(true);
      setWinningBets([]);
      setWinAnimation(false);

      if (soundEnabled) {
        console.log('🔊 Wheel spinning sound...');
      }

      const result = spinRoulette();
      // trigger library wheel spin
      const idx = ROULETTE_NUMBERS.indexOf(result.number);
      setPrizeIndex(idx);
      pendingResultRef.current = result;
      pendingBetsRef.current = bets;
      setMustSpin(true);
      animateBall(1200, 10);

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

  const handleStopSpinning = async () => {
    setMustSpin(false);
    const result = pendingResultRef.current;
    const placedBets = pendingBetsRef.current || [];
    if (!result) return;
    setLastResult(result);
    setGameHistory(prev => [result, ...prev.slice(0, 19)]);

    let totalWinnings = 0;
    const winning: Bet[] = [];
    placedBets.forEach(bet => {
      const payout = calculatePayout(bet, result);
      if (payout > 0) {
        totalWinnings += payout;
        winning.push(bet);
      }
    });
    setWinningBets(winning);

    const totalBetAmount = placedBets.reduce((s, b) => s + b.amount, 0);
    if (totalWinnings > 0) {
      addWinnings(totalWinnings);
      setWinAnimation(true);
      setTimeout(() => setWinAnimation(false), 4000);
      const profit = totalWinnings - totalBetAmount;
      const multiplier = totalWinnings / totalBetAmount;
      await processWin(totalWinnings, 'Casino Game', `${gameName} - Win on ${result.number} ${result.color} (${multiplier.toFixed(1)}x)`, {
        gameId,
        gameName,
        result,
        winningBets: winning.length,
        totalBets: placedBets.length,
        profit,
        multiplier
      });
      if (multiplier >= 20) {
        toast.success(`🎯 MEGA WIN! ${result.number} ${result.color} - +${formatCurrency(totalWinnings)} (${multiplier.toFixed(1)}x)`, { duration: 8000 });
      } else if (multiplier >= 5) {
        toast.success(`🎯 BIG WIN! ${result.number} ${result.color} - +${formatCurrency(totalWinnings)} (${multiplier.toFixed(1)}x)`, { duration: 6000 });
      } else {
        toast.success(`🎯 Winner! ${result.number} ${result.color} - +${formatCurrency(totalWinnings)}`);
      }
    } else {
      toast.error(`🎲 ${result.number} ${result.color} - Try again!`);
    }
    eventBus.emit('casinoWin', { gameId, userId: (user as any)?.id, gameName, betAmount: totalBetAmount, winAmount: totalWinnings, result, timestamp: new Date() });
    setIsSpinning(false);
    setIsPlaying(false);
    setBets([]);
    pendingResultRef.current = null;
    pendingBetsRef.current = null;
  };

  return (
    <div className="bg-gradient-to-b from-slate-800 via-red-900/20 to-slate-900 rounded-none sm:rounded-2xl lg:rounded-3xl p-2 sm:p-4 md:p-6 lg:p-8 border-0 sm:border-2 border-red-500/30 relative overflow-hidden shadow-2xl max-w-full sm:max-w-[1100px] mx-auto w-full">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 bg-gradient-to-br from-red-500 to-yellow-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-gradient-to-br from-green-500 to-blue-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 left-1/4 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Game Header */}
      <div className="relative z-10 text-center mb-3 sm:mb-4 md:mb-6 lg:mb-8">
        <div className="flex items-center justify-center space-x-2 sm:space-x-3 md:space-x-4 mb-3 sm:mb-4 md:mb-6">
          <Target className="w-5 h-5 sm:w-7 sm:h-7 md:w-10 md:h-10 text-red-400 animate-pulse" />
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 bg-clip-text text-transparent">
            {gameName}
          </h2>
          <Target className="w-5 h-5 sm:w-7 sm:h-7 md:w-10 md:h-10 text-red-400 animate-pulse" />
        </div>
        
        <div className="grid grid-cols-3 gap-2 sm:gap-4 md:flex md:flex-wrap md:justify-center md:gap-6 lg:gap-8 text-sm sm:text-base md:text-lg">
          <div className="text-center bg-slate-800/50 rounded-lg p-2 sm:bg-transparent sm:p-0">
            <p className="text-slate-400 font-medium text-xs sm:text-sm">Balance</p>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-green-400">{formatCurrency(session.balance)}</p>
          </div>
          <div className="text-center bg-slate-800/50 rounded-lg p-2 sm:bg-transparent sm:p-0">
            <p className="text-slate-400 font-medium text-xs sm:text-sm">Total Bets</p>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-blue-400">{formatCurrency(totalBetAmount)}</p>
          </div>
          <div className="text-center bg-slate-800/50 rounded-lg p-2 sm:bg-transparent sm:p-0">
            <p className="text-slate-400 font-medium text-xs sm:text-sm">Last Result</p>
            <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold">
              {lastResult ? (
                <span className={`px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 text-sm sm:text-base md:text-lg rounded-full border-2 ${
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

      {/* Roulette Wheel - Optimized for mobile and desktop */}
      <div className="relative z-10 flex justify-center mb-3 sm:mb-4 md:mb-6 lg:mb-8">
        <div className="relative w-[96%] sm:w-full sm:max-w-[380px] md:max-w-[420px] lg:max-w-[480px] flex justify-center">
          {/* Wheel Base with library wheel inside to keep styling */}
          <div ref={wheelWrapRef} className="rounded-full p-0 shadow-2xl flex items-center justify-center relative bg-transparent border-0 w-full aspect-square">
            <div className="w-full h-full rounded-full overflow-hidden border-0 shadow-2xl">
              <Wheel
                mustStartSpinning={mustSpin}
                prizeNumber={prizeIndex}
                data={wheelData as any}
                outerBorderColor={'#d4af37'}
                outerBorderWidth={4}
                innerRadius={3}
                innerBorderColor={'#d4af37'}
                innerBorderWidth={2}
                radiusLineColor={'#1a1a1a'}
                radiusLineWidth={1}
                textDistance={58}
                fontSize={20}
                perpendicularText
                spinDuration={0.8}
                onStopSpinning={handleStopSpinning}
              />
            </div>
          </div>
          
          {/* Pointer remains */}
          <div className="absolute top-4 sm:top-6 md:top-8 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[16px] sm:border-l-[10px] sm:border-r-[10px] sm:border-b-[20px] border-l-transparent border-r-transparent border-b-slate-300 shadow-lg z-30"></div>
        </div>
      </div>

      {/* Win Animation */}
      {winAnimation && winningBets.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none px-2">
          <div className="bg-gradient-to-r from-yellow-400/90 via-orange-500/90 to-red-500/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border-2 sm:border-4 border-yellow-300 animate-pulse shadow-2xl max-w-md">
            <div className="text-center">
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-yellow-200 mx-auto mb-2 sm:mb-3 md:mb-4 animate-bounce" />
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">🎯 WINNER! 🎯</p>
              <p className="text-lg sm:text-xl md:text-2xl text-yellow-200">
                {lastResult?.number} {lastResult?.color.toUpperCase()}
              </p>
              <p className="text-sm sm:text-base md:text-xl text-white mt-1 sm:mt-2">
                {winningBets.length} winning bet{winningBets.length > 1 ? 's' : ''}!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Game Statistics */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
        {/* Hot Numbers */}
        <div className="bg-gradient-to-br from-orange-800/50 to-red-800/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-orange-500/30 shadow-xl">
          <h4 className="text-sm sm:text-base md:text-xl font-bold text-orange-400 mb-2 sm:mb-3 md:mb-4 flex items-center">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1 sm:mr-2 animate-pulse" />
            Hot Numbers
          </h4>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-3">
            {hotNumbers.map(num => (
              <div
                key={num}
                className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xs sm:text-sm md:text-lg font-bold border border-slate-600 shadow-lg ${
                  getNumberColor(num) === 'red' ? 'bg-red-600 border-red-400 text-white' :
                  getNumberColor(num) === 'black' ? 'bg-gray-800 border-gray-600 text-white' : 
                  'bg-green-600 border-green-400 text-white'
                } ring-1 sm:ring-2 ring-orange-400 ring-opacity-60 animate-pulse`}
              >
                {num}
              </div>
            ))}
          </div>
        </div>

        {/* Cold Numbers */}
        <div className="bg-gradient-to-br from-blue-800/50 to-cyan-800/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-blue-500/30 shadow-xl">
          <h4 className="text-sm sm:text-base md:text-xl font-bold text-blue-400 mb-2 sm:mb-3 md:mb-4">Cold Numbers</h4>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-3">
            {coldNumbers.map(num => (
              <div
                key={num}
                className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xs sm:text-sm md:text-lg font-bold border border-slate-600 shadow-lg opacity-70 ${
                  getNumberColor(num) === 'red' ? 'bg-red-600 border-red-400 text-white' :
                  getNumberColor(num) === 'black' ? 'bg-gray-800 border-gray-600 text-white' : 
                  'bg-green-600 border-green-400 text-white'
                } ring-1 sm:ring-2 ring-blue-400 ring-opacity-40`}
              >
                {num}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Results */}
        <div className="bg-gradient-to-br from-purple-800/50 to-pink-800/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-purple-500/30 shadow-xl">
          <h4 className="text-sm sm:text-base md:text-xl font-bold text-purple-400 mb-2 sm:mb-3 md:mb-4">Recent Results</h4>
          <div className="grid grid-cols-5 gap-1 sm:gap-1.5 md:gap-2">
            {gameHistory.slice(0, 10).map((result, index) => (
              <div
                key={index}
                className={`w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-[10px] sm:text-xs md:text-sm font-bold border border-slate-600 shadow-lg ${
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
      <div className="relative z-10 bg-gradient-to-br from-green-800 via-green-900 to-black rounded-xl sm:rounded-2xl lg:rounded-3xl p-2 sm:p-3 md:p-4 lg:p-8 mb-3 sm:mb-4 md:mb-6 lg:mb-8 border-2 sm:border-3 md:border-4 border-green-600 shadow-2xl">
        {/* Zero */}
        <div className="flex justify-center mb-2 sm:mb-3 md:mb-4 lg:mb-6">
          <button
            onClick={() => placeBetOnNumber(0)}
            disabled={isPlaying}
            className={`${getNumberStyle(0)} text-base sm:text-lg md:text-xl lg:text-2xl w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20`}
          >
            0
          </button>
        </div>
        
        {/* Main Numbers Grid */}
        <div className="grid grid-cols-12 gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
          {Array.from({ length: 36 }, (_, i) => i + 1).map(num => (
            <button
              key={num}
              onClick={() => placeBetOnNumber(num)}
              disabled={isPlaying}
              className={`${getNumberStyle(num)} !w-auto !h-auto aspect-square text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg`}
            >
              {num}
            </button>
          ))}
        </div>

        {/* Outside Bets */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
          <button
            onClick={() => placeBetOnColor('red')}
            disabled={isPlaying}
            className="h-14 sm:h-16 md:h-20 bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white font-bold text-sm sm:text-base md:text-lg lg:text-xl rounded-lg sm:rounded-xl disabled:opacity-50 transition-all duration-300 transform active:scale-95 sm:hover:scale-105 md:hover:scale-110 border-2 sm:border-3 border-red-400 shadow-xl sm:shadow-2xl shadow-red-500/30"
          >
            <div className="flex items-center justify-center space-x-1 sm:space-x-2">
              <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-red-500 rounded-full border border-red-300"></div>
              <span>RED</span>
            </div>
            <div className="text-[10px] sm:text-xs md:text-sm opacity-80">2:1</div>
          </button>
          
          <button
            onClick={() => placeBetOnColor('black')}
            disabled={isPlaying}
            className="h-14 sm:h-16 md:h-20 bg-gradient-to-br from-gray-800 to-black hover:from-gray-700 hover:to-gray-900 text-white font-bold text-sm sm:text-base md:text-lg lg:text-xl rounded-lg sm:rounded-xl disabled:opacity-50 transition-all duration-300 transform active:scale-95 sm:hover:scale-105 md:hover:scale-110 border-2 sm:border-3 border-gray-600 shadow-xl sm:shadow-2xl shadow-gray-800/50"
          >
            <div className="flex items-center justify-center space-x-1 sm:space-x-2">
              <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-gray-800 rounded-full border border-gray-600"></div>
              <span>BLACK</span>
            </div>
            <div className="text-[10px] sm:text-xs md:text-sm opacity-80">2:1</div>
          </button>
          
          <button
            onClick={() => placeBetOnEvenOdd('even')}
            disabled={isPlaying}
            className="h-14 sm:h-16 md:h-20 bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white font-bold text-sm sm:text-base md:text-lg lg:text-xl rounded-lg sm:rounded-xl disabled:opacity-50 transition-all duration-300 transform active:scale-95 sm:hover:scale-105 md:hover:scale-110 border-2 sm:border-3 border-blue-500 shadow-xl sm:shadow-2xl shadow-blue-500/30"
          >
            <div>EVEN</div>
            <div className="text-[10px] sm:text-xs md:text-sm opacity-80">2:1</div>
          </button>
          
          <button
            onClick={() => placeBetOnEvenOdd('odd')}
            disabled={isPlaying}
            className="h-14 sm:h-16 md:h-20 bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white font-bold text-sm sm:text-base md:text-lg lg:text-xl rounded-lg sm:rounded-xl disabled:opacity-50 transition-all duration-300 transform active:scale-95 sm:hover:scale-105 md:hover:scale-110 border-2 sm:border-3 border-purple-500 shadow-xl sm:shadow-2xl shadow-purple-500/30"
          >
            <div>ODD</div>
            <div className="text-[10px] sm:text-xs md:text-sm opacity-80">2:1</div>
          </button>
          
          <button
            onClick={() => placeBetOnRange('low')}
            disabled={isPlaying}
            className="h-14 sm:h-16 md:h-20 bg-gradient-to-br from-orange-600 to-orange-800 hover:from-orange-500 hover:to-orange-700 text-white font-bold text-sm sm:text-base md:text-lg lg:text-xl rounded-lg sm:rounded-xl disabled:opacity-50 transition-all duration-300 transform active:scale-95 sm:hover:scale-105 md:hover:scale-110 border-2 sm:border-3 border-orange-500 shadow-xl sm:shadow-2xl shadow-orange-500/30"
          >
            <div>1-18</div>
            <div className="text-[10px] sm:text-xs md:text-sm opacity-80">2:1</div>
          </button>
          
          <button
            onClick={() => placeBetOnRange('high')}
            disabled={isPlaying}
            className="h-14 sm:h-16 md:h-20 bg-gradient-to-br from-orange-600 to-orange-800 hover:from-orange-500 hover:to-orange-700 text-white font-bold text-sm sm:text-base md:text-lg lg:text-xl rounded-lg sm:rounded-xl disabled:opacity-50 transition-all duration-300 transform active:scale-95 sm:hover:scale-105 md:hover:scale-110 border-2 sm:border-3 border-orange-500 shadow-xl sm:shadow-2xl shadow-orange-500/30"
          >
            <div>19-36</div>
            <div className="text-[10px] sm:text-xs md:text-sm opacity-80">2:1</div>
          </button>
        </div>

        {/* Dozen Bets */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mt-3 sm:mt-4 md:mt-6">
          <button
            onClick={() => placeBetOnDozen(1)}
            disabled={isPlaying}
            className="h-12 sm:h-14 md:h-16 bg-gradient-to-br from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm md:text-base lg:text-lg rounded-lg sm:rounded-xl disabled:opacity-50 transition-all duration-300 transform active:scale-95 sm:hover:scale-105 md:hover:scale-110 border border-indigo-500 shadow-xl"
          >
            <div className="text-xs sm:text-sm md:text-base">1st DOZEN</div>
            <div className="text-[10px] sm:text-xs opacity-80">3:1</div>
          </button>
          <button
            onClick={() => placeBetOnDozen(2)}
            disabled={isPlaying}
            className="h-12 sm:h-14 md:h-16 bg-gradient-to-br from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm md:text-base lg:text-lg rounded-lg sm:rounded-xl disabled:opacity-50 transition-all duration-300 transform active:scale-95 sm:hover:scale-105 md:hover:scale-110 border border-indigo-500 shadow-xl"
          >
            <div className="text-xs sm:text-sm md:text-base">2nd DOZEN</div>
            <div className="text-[10px] sm:text-xs opacity-80">3:1</div>
          </button>
          <button
            onClick={() => placeBetOnDozen(3)}
            disabled={isPlaying}
            className="h-12 sm:h-14 md:h-16 bg-gradient-to-br from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm md:text-base lg:text-lg rounded-lg sm:rounded-xl disabled:opacity-50 transition-all duration-300 transform active:scale-95 sm:hover:scale-105 md:hover:scale-110 border border-indigo-500 shadow-xl"
          >
            <div className="text-xs sm:text-sm md:text-base">3rd DOZEN</div>
            <div className="text-[10px] sm:text-xs opacity-80">3:1</div>
          </button>
        </div>
      </div>

      {/* Current Bets Display */}
      {bets.length > 0 && (
        <div className="relative z-10 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-center mb-2 sm:mb-3 md:mb-4 text-yellow-400">Current Bets</h3>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-slate-700 shadow-xl">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              {bets.map((bet, index) => (
                <div
                  key={index}
                  className={`p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border transition-all duration-500 shadow-lg ${
                    winningBets.includes(bet) 
                      ? 'bg-gradient-to-br from-green-600/30 to-green-800/30 border-green-400 animate-pulse shadow-xl shadow-green-400/40' 
                      : 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600'
                  }`}
                >
                  <div className="text-center">
                    <p className="font-bold text-white text-xs sm:text-sm md:text-base lg:text-lg">{bet.label}</p>
                    <p className="text-sm sm:text-base md:text-lg text-yellow-400 font-bold">{formatCurrency(bet.amount)}</p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-slate-400">Pays {bet.payout}:1</p>
                    {winningBets.includes(bet) && (
                      <p className="text-[10px] sm:text-xs md:text-sm text-green-400 font-bold animate-bounce">🎯 WINNER!</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 sm:mt-4 md:mt-6 text-center">
              <p className="text-slate-400 text-sm sm:text-base md:text-lg">
                Total Bet: <span className="font-bold text-white text-base sm:text-lg md:text-xl">{formatCurrency(totalBetAmount)}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
        <div className="relative z-10 space-y-3 sm:space-y-4 md:space-y-6">
        {/* Bet Amount Controls */}
          <div className="bg-gradient-to-r from-slate-800 via-blue-800/30 to-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-blue-500/30 shadow-xl">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {[100,200,300,500,1000].map(v => (
                <Button key={v} variant="outline" onClick={() => setBetAmount(v)} disabled={isPlaying} className={`text-xs sm:text-sm md:text-base lg:text-lg font-bold px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 ${betAmount===v?'border-yellow-400 bg-yellow-400/10':''}`}>
                  ₹{v}
                </Button>
              ))}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Coins className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-400" />
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(100, parseInt(e.target.value) || 100))}
                className="w-24 sm:w-28 md:w-32 text-center text-sm sm:text-base md:text-lg lg:text-xl font-bold py-2"
                min="100"
                max={session.balance}
                disabled={isPlaying}
              />
            </div>
            </div>
          </div>

        {/* Main Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 md:gap-6">
          <Button
            onClick={spin}
            disabled={isPlaying || bets.length === 0 || totalBetAmount > session.balance}
              className="w-full sm:w-auto px-8 sm:px-12 md:px-16 py-3 sm:py-4 md:py-5 lg:py-6 text-base sm:text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-rose-600 via-orange-500 to-amber-400 enabled:hover:from-rose-500 enabled:hover:via-orange-400 enabled:hover:to-amber-300 transform active:scale-95 enabled:sm:hover:scale-105 transition-all duration-300 shadow-xl sm:shadow-2xl shadow-rose-500/30 rounded-xl sm:rounded-2xl border-2 border-rose-400 disabled:opacity-60"
          >
            {isSpinning ? (
              <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>SPINNING...</span>
              </div>
            ) : (
              <>
                <Target className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 mr-2 sm:mr-3" />
                SPIN WHEEL
              </>
            )}
          </Button>
          
          <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3 md:gap-4">
          <Button 
            variant="outline" 
            onClick={clearBets} 
            disabled={isPlaying || bets.length === 0}
              className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 lg:py-6 text-xs sm:text-sm md:text-base lg:text-xl font-bold border-2 border-yellow-500 hover:bg-yellow-500/20"
          >
              Clear
          </Button>
          
          <Button 
            variant="outline" 
            onClick={resetSession} 
            disabled={isPlaying}
              className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 lg:py-6 text-xs sm:text-sm md:text-base lg:text-xl font-bold border-2 border-purple-500 hover:bg-purple-500/20"
          >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1 sm:mr-2 md:mr-3" />
              <span className="hidden sm:inline">Reset</span>
          </Button>
          </div>
        </div>

        {/* Settings */}
        <div className="flex justify-center space-x-3 sm:space-x-4 md:space-x-6">
          <Button
            variant="ghost"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 sm:p-3 md:p-4"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" /> : <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />}
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 sm:p-3 md:p-4"
          >
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
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
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 text-center">
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border border-slate-600 shadow-lg">
          <p className="text-slate-400 font-medium text-[10px] sm:text-xs md:text-sm">Spins</p>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white">{session.spinsPlayed}</p>
        </div>
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border border-slate-600 shadow-lg">
          <p className="text-slate-400 font-medium text-[10px] sm:text-xs md:text-sm">Wagered</p>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-blue-400">{formatCurrency(session.totalWagered)}</p>
        </div>
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border border-slate-600 shadow-lg">
          <p className="text-slate-400 font-medium text-[10px] sm:text-xs md:text-sm">Won</p>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-green-400">{formatCurrency(session.totalWon)}</p>
        </div>
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border border-slate-600 shadow-lg">
          <p className="text-slate-400 font-medium text-[10px] sm:text-xs md:text-sm">RTP</p>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-purple-400">
            {session.totalWagered > 0 ? ((session.totalWon / session.totalWagered) * 100).toFixed(1) : '0.0'}%
          </p>
        </div>
      </div>
    </div>
  );
}

export default RouletteGame;