import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Coins, Volume2, VolumeX, Settings, Trophy, Zap, Star, Crown } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useWallet } from '../../contexts/SupabaseWalletContext';
import toast from 'react-hot-toast';
import { useCasinoGame } from '../../hooks/useCasinoGame';
import { formatCurrency } from '../../lib/utils';
import { eventBus } from '../../utils/eventBus';
import { ResponsibleGamingService } from '../../services/responsibleGamingService';

interface SlotMachineProps {
  gameId: string;
  gameName: string;
}

const SYMBOLS = [
  { symbol: '🍒', name: 'Cherry', value: 2, rarity: 0.25, color: 'text-red-400' },
  { symbol: '🍋', name: 'Lemon', value: 3, rarity: 0.22, color: 'text-yellow-400' },
  { symbol: '🍊', name: 'Orange', value: 4, rarity: 0.20, color: 'text-orange-400' },
  { symbol: '🍇', name: 'Grape', value: 6, rarity: 0.15, color: 'text-purple-400' },
  { symbol: '⭐', name: 'Star', value: 10, rarity: 0.10, color: 'text-blue-400' },
  { symbol: '💎', name: 'Diamond', value: 25, rarity: 0.05, color: 'text-cyan-400' },
  { symbol: '7️⃣', name: 'Lucky Seven', value: 50, rarity: 0.02, color: 'text-green-400' },
  { symbol: '👑', name: 'Crown', value: 100, rarity: 0.01, color: 'text-yellow-300' }
];

const PAYLINES = [
  [1, 1, 1, 1, 1], // Middle row
  [0, 0, 0, 0, 0], // Top row
  [2, 2, 2, 2, 2], // Bottom row
  [0, 1, 2, 1, 0], // V shape
  [2, 1, 0, 1, 2], // Inverted V
  [0, 0, 1, 2, 2], // Diagonal down
  [2, 2, 1, 0, 0], // Diagonal up
  [1, 0, 1, 2, 1], // W shape
  [1, 2, 1, 0, 1]  // M shape
];

export function SlotMachine({ gameId, gameName }: SlotMachineProps) {
  const { user } = useAuth();
  const { processBet, processWin } = useWallet();
  const { session, isPlaying, setIsPlaying, placeBet, addWinnings, resetSession } = useCasinoGame(gameId);
  const [betAmount, setBetAmount] = useState(10);
  const [activePaylines, setActivePaylines] = useState(9);
  const [reels, setReels] = useState<string[][]>([
    ['🍒', '🍋', '🍊'],
    ['🍇', '⭐', '💎'],
    ['7️⃣', '👑', '🍒'],
    ['🍋', '🍊', '🍇'],
    ['⭐', '💎', '7️⃣']
  ]);
  const [winLines, setWinLines] = useState<number[]>([]);
  const [lastWin, setLastWin] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinSpeed, setSpinSpeed] = useState(100);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoSpin, setAutoSpin] = useState(false);
  const [autoSpinCount, setAutoSpinCount] = useState(0);
  const [maxAutoSpins, setMaxAutoSpins] = useState(10);
  const [jackpotAmount, setJackpotAmount] = useState(2500000);
  const [multiplier, setMultiplier] = useState(1);
  const [showPaytable, setShowPaytable] = useState(false);
  const [reelAnimations, setReelAnimations] = useState<boolean[]>([false, false, false, false, false]);
  const [winAnimation, setWinAnimation] = useState(false);
  const [megaWin, setMegaWin] = useState(false);

  // Progressive jackpot updates
  useEffect(() => {
    const interval = setInterval(() => {
      setJackpotAmount(prev => prev + Math.random() * 100 + 25);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const generateWeightedSymbol = (): string => {
    const random = Math.random();
    let cumulative = 0;
    
    for (const symbolData of SYMBOLS) {
      cumulative += symbolData.rarity;
      if (random <= cumulative) {
        return symbolData.symbol;
      }
    }
    return SYMBOLS[0].symbol;
  };

  const checkWinningCombinations = (gameReels: string[][]): { winLines: number[], totalPayout: number, maxMultiplier: number } => {
    const winningLines: number[] = [];
    let totalPayout = 0;
    let maxMultiplier = 1;

    PAYLINES.slice(0, activePaylines).forEach((payline, lineIndex) => {
      const lineSymbols = payline.map((row, col) => gameReels[col][row]);
      const firstSymbol = lineSymbols[0];
      
      let consecutiveCount = 1;
      for (let i = 1; i < lineSymbols.length; i++) {
        if (lineSymbols[i] === firstSymbol || lineSymbols[i] === '⭐') {
          consecutiveCount++;
        } else {
          break;
        }
      }

      if (consecutiveCount >= 3) {
        const symbolData = SYMBOLS.find(s => s.symbol === firstSymbol);
        if (symbolData) {
          winningLines.push(lineIndex);
          const lineMultiplier = symbolData.value * Math.pow(1.8, consecutiveCount - 3);
          const linePayout = (betAmount / activePaylines) * lineMultiplier;
          totalPayout += linePayout;
          maxMultiplier = Math.max(maxMultiplier, lineMultiplier);
        }
      }
    });

    // Jackpot check
    const hasJackpot = PAYLINES.slice(0, activePaylines).some(payline => {
      const lineSymbols = payline.map((row, col) => gameReels[col][row]);
      return lineSymbols.every(symbol => symbol === '👑');
    });

    if (hasJackpot) {
      totalPayout += jackpotAmount;
      maxMultiplier = Math.max(maxMultiplier, jackpotAmount / betAmount);
      setJackpotAmount(2500000);
      setMegaWin(true);
      setTimeout(() => setMegaWin(false), 5000);
    }

    return { winLines: winningLines, totalPayout, maxMultiplier };
  };

  const animateReels = async (): Promise<string[][]> => {
    return new Promise((resolve) => {
      let spinCount = 0;
      const maxSpins = 25 + Math.random() * 15;
      
      setReelAnimations([true, true, true, true, true]);
      
      const spinInterval = setInterval(() => {
        setReels(prev => prev.map(reel => 
          reel.map(() => generateWeightedSymbol())
        ));
        
        spinCount++;
        
        if (spinCount > maxSpins * 0.7) {
          const reelToStop = Math.floor((spinCount - maxSpins * 0.7) / 4);
          if (reelToStop < 5) {
            setReelAnimations(prev => {
              const newAnimations = [...prev];
              newAnimations[reelToStop] = false;
              return newAnimations;
            });
          }
        }
        
        if (spinCount >= maxSpins) {
          clearInterval(spinInterval);
          setReelAnimations([false, false, false, false, false]);
          
          const finalReels = Array(5).fill(null).map(() => 
            Array(3).fill(null).map(() => generateWeightedSymbol())
          );
          
          setReels(finalReels);
          resolve(finalReels);
        }
      }, spinSpeed);
    });
  };

  const handleSpin = async () => {
    if (!user || betAmount * activePaylines > user.balance) {
      toast.error('Insufficient balance!');
      return;
    }

    try {
      const hasViolation = await ResponsibleGamingService.checkLimitViolation(user.id, 'bet_amount', betAmount * activePaylines);
      if (hasViolation) {
        toast.error('This bet exceeds your responsible gaming limits');
        return;
      }
    } catch (error) {
      console.warn('Could not check responsible gaming limits:', error);
    }

    try {
      const totalBet = betAmount * activePaylines;
      placeBet(totalBet);
      
      await processBet(totalBet, 'Casino Game', `${gameName} - Spin (${activePaylines} lines @ ${formatCurrency(betAmount)})`, {
        gameId,
        gameName,
        betAmount: totalBet,
        paylines: activePaylines
      });
      
      setIsPlaying(true);
      setIsSpinning(true);
      setWinLines([]);
      setLastWin(0);
      setMultiplier(1);
      setWinAnimation(false);

      const finalReels = await animateReels();
      const { winLines: newWinLines, totalPayout, maxMultiplier } = checkWinningCombinations(finalReels);
      
      setWinLines(newWinLines);
      setLastWin(totalPayout);
      setMultiplier(maxMultiplier);
      
      if (totalPayout > 0) {
        addWinnings(totalPayout);
        setWinAnimation(true);
        setTimeout(() => setWinAnimation(false), 3000);
        
        await processWin(totalPayout, 'Casino Game', `${gameName} - Win (${maxMultiplier.toFixed(1)}x multiplier)`, {
          gameId,
          gameName,
          originalBet: totalBet,
          multiplier: maxMultiplier,
          winLines: newWinLines.length,
          paylines: activePaylines
        });
        
        if (maxMultiplier >= 20) {
          toast.success(`🎰 MEGA WIN! +${formatCurrency(totalPayout)} (${maxMultiplier.toFixed(1)}x)`, { duration: 8000 });
        } else if (maxMultiplier >= 10) {
          toast.success(`🎰 BIG WIN! +${formatCurrency(totalPayout)} (${maxMultiplier.toFixed(1)}x)`, { duration: 6000 });
        } else {
          toast.success(`🎉 Win! +${formatCurrency(totalPayout)} (${maxMultiplier.toFixed(1)}x)`);
        }
      }
        
      eventBus.emit('casinoWin', {
        gameId,
        userId: user.id,
        gameName,
        betAmount: totalBet,
        winAmount: totalPayout,
        multiplier: maxMultiplier,
        timestamp: new Date()
      });
      
      if (autoSpin) {
        setAutoSpinCount(prev => prev + 1);
      }
      
      setIsSpinning(false);
      setIsPlaying(false);

    } catch (error) {
      console.error('Spin error:', error);
      setIsPlaying(false);
      setIsSpinning(false);
      setAutoSpin(false);
    }
  };

  const toggleAutoSpin = () => {
    if (autoSpin) {
      setAutoSpin(false);
      setAutoSpinCount(0);
    } else {
      setAutoSpin(true);
      setAutoSpinCount(0);
    }
  };

  useEffect(() => {
    if (autoSpin && autoSpinCount < maxAutoSpins && !isSpinning) {
      const timer = setTimeout(() => {
        handleSpin();
      }, 1200);
      return () => clearTimeout(timer);
    } else if (autoSpinCount >= maxAutoSpins) {
      setAutoSpin(false);
      setAutoSpinCount(0);
      toast.success('Auto-spin completed!');
    }
  }, [autoSpin, autoSpinCount, maxAutoSpins, isSpinning]);

  const totalBet = betAmount * activePaylines;

  return (
    <div className="bg-gradient-to-b from-slate-800 via-purple-900/20 to-slate-900 rounded-3xl p-8 border-2 border-purple-500/30 relative overflow-hidden shadow-2xl">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Mega Win Overlay */}
      {megaWin && (
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/90 to-orange-500/90 flex items-center justify-center z-50 rounded-3xl animate-pulse">
          <div className="text-center">
            <Crown className="w-24 h-24 text-yellow-200 mx-auto mb-4 animate-bounce" />
            <h2 className="text-6xl font-bold text-white mb-4 animate-bounce">JACKPOT!</h2>
            <p className="text-3xl font-bold text-yellow-200">👑 CROWN JACKPOT WON! 👑</p>
            <p className="text-2xl text-white mt-2">{formatCurrency(jackpotAmount)}</p>
          </div>
        </div>
      )}

      {/* Game Header */}
      <div className="relative z-10 text-center mb-8">
        <div className="flex items-center justify-center space-x-4 mb-6">
          <Crown className="w-10 h-10 text-yellow-400 animate-pulse" />
          <h2 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            {gameName}
          </h2>
          <Crown className="w-10 h-10 text-yellow-400 animate-pulse" />
        </div>
        
        {/* Progressive Jackpot */}
        <div className="bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 rounded-2xl p-6 mb-6 border-4 border-yellow-400 shadow-2xl shadow-yellow-400/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 animate-pulse"></div>
          <div className="relative flex items-center justify-center space-x-4">
            <Zap className="w-8 h-8 text-yellow-200 animate-bounce" />
            <div className="text-center">
              <p className="text-yellow-200 text-lg font-bold tracking-wider">PROGRESSIVE JACKPOT</p>
              <p className="text-4xl font-bold text-white animate-pulse tracking-wider">
                {formatCurrency(jackpotAmount)}
              </p>
              <p className="text-yellow-200 text-sm">5 Crowns on any payline wins!</p>
            </div>
            <Zap className="w-8 h-8 text-yellow-200 animate-bounce" />
          </div>
        </div>
        
        <div className="flex justify-center space-x-12 text-lg">
          <div className="text-center">
            <p className="text-slate-400 font-medium">Balance</p>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(session.balance)}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 font-medium">Last Win</p>
            <p className="text-2xl font-bold text-yellow-400">{formatCurrency(lastWin)}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 font-medium">Multiplier</p>
            <p className="text-2xl font-bold text-purple-400">{multiplier.toFixed(1)}x</p>
          </div>
        </div>
      </div>

      {/* Slot Machine */}
      <div className="relative z-10 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 rounded-3xl p-8 mb-8 border-4 border-gradient-to-r from-yellow-600 to-orange-600 shadow-2xl">
        {/* Machine Frame */}
        <div className="bg-gradient-to-b from-yellow-600 via-orange-600 to-red-600 rounded-2xl p-3 mb-6 shadow-2xl">
          <div className="bg-black rounded-xl p-6 shadow-inner">
            <div className="grid grid-cols-5 gap-4">
              {reels.map((reel, reelIndex) => (
                <div key={reelIndex} className="relative">
                  <div className="bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 rounded-xl border-4 border-slate-500 overflow-hidden shadow-2xl">
                    <div className={`transition-all duration-200 ${reelAnimations[reelIndex] ? 'animate-pulse' : ''}`}>
                      {reel.map((symbol, symbolIndex) => {
                        const isWinningSymbol = winLines.some(line => 
                          PAYLINES[line] && PAYLINES[line][reelIndex] === symbolIndex
                        );
                        
                        return (
                          <div
                            key={symbolIndex}
                            className={`
                              w-24 h-24 flex items-center justify-center text-5xl border-b-2 border-slate-600 last:border-b-0 relative
                              ${isWinningSymbol 
                                ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 animate-pulse shadow-2xl shadow-yellow-400/50 border-yellow-300' 
                                : 'bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900'
                              }
                              ${isSpinning && reelAnimations[reelIndex] ? 'animate-bounce' : ''}
                              transition-all duration-500
                            `}
                          >
                            {isWinningSymbol && (
                              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 to-orange-500/30 animate-ping"></div>
                            )}
                            <span className={`
                              ${isSpinning && reelAnimations[reelIndex] ? 'blur-sm scale-110' : 'scale-100'} 
                              transition-all duration-300 relative z-10
                              ${isWinningSymbol ? 'animate-bounce text-shadow-lg' : ''}
                            `}>
                              {symbol}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                    <span className="text-sm text-yellow-400 font-bold bg-slate-800 px-2 py-1 rounded-full border border-yellow-400">
                      #{reelIndex + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Win Animation */}
        {winAnimation && winLines.length > 0 && (
          <div className="text-center mb-6">
            <div className="bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 rounded-2xl p-6 border-4 border-yellow-400 animate-pulse shadow-2xl shadow-yellow-400/50">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <Star className="w-8 h-8 text-yellow-200 animate-spin" />
                <p className="text-3xl font-bold text-white animate-bounce">
                  🎉 WINNING COMBINATION! 🎉
                </p>
                <Star className="w-8 h-8 text-yellow-200 animate-spin" />
              </div>
              <p className="text-xl text-yellow-200 font-bold">
                {winLines.length} line{winLines.length > 1 ? 's' : ''} • {multiplier.toFixed(1)}x • {formatCurrency(lastWin)}
              </p>
            </div>
          </div>
        )}

        {/* Paylines Indicator */}
        <div className="flex justify-center space-x-2 mb-6">
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                i < activePaylines 
                  ? winLines.includes(i)
                    ? 'bg-yellow-400 border-yellow-400 animate-pulse shadow-lg shadow-yellow-400/50'
                    : 'bg-blue-500 border-blue-400 shadow-lg shadow-blue-400/30'
                  : 'bg-slate-600 border-slate-500'
              }`}
              title={`Payline ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Game Controls */}
      <div className="relative z-10 space-y-6">
        {/* Bet Controls */}
        <div className="bg-gradient-to-r from-slate-800 via-purple-800/30 to-slate-800 rounded-2xl p-6 border-2 border-purple-500/30 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bet Amount */}
            <div className="text-center">
              <label className="block text-lg font-bold text-purple-300 mb-4">Bet Per Line</label>
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" onClick={() => setBetAmount(1)} disabled={isPlaying}>
                  Min
                </Button>
                <div className="flex items-center space-x-3 flex-1">
                  <Coins className="w-6 h-6 text-yellow-400" />
                  <Input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="text-center text-xl font-bold"
                    min="1"
                    max={Math.floor(session.balance / activePaylines)}
                    disabled={isPlaying}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => setBetAmount(Math.min(100, Math.floor(session.balance / activePaylines)))} disabled={isPlaying}>
                  Max
                </Button>
              </div>
              <p className="text-sm text-slate-400 mt-3 font-medium">
                Total bet: <span className="text-white font-bold">{formatCurrency(totalBet)}</span>
              </p>
            </div>

            {/* Paylines */}
            <div className="text-center">
              <label className="block text-lg font-bold text-blue-300 mb-4">Active Paylines</label>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setActivePaylines(Math.max(1, activePaylines - 1))}
                  disabled={isPlaying || activePaylines <= 1}
                >
                  -
                </Button>
                <div className="flex-1 text-center bg-slate-700 rounded-xl p-3 border-2 border-blue-500/30">
                  <span className="text-3xl font-bold text-blue-400">{activePaylines}</span>
                  <span className="text-lg text-slate-400 ml-2">/ 9</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setActivePaylines(Math.min(9, activePaylines + 1))}
                  disabled={isPlaying || activePaylines >= 9}
                >
                  +
                </Button>
              </div>
              <p className="text-sm text-slate-400 mt-3 font-medium">
                More lines = more chances
              </p>
            </div>

            {/* Auto Spin */}
            <div className="text-center">
              <label className="block text-lg font-bold text-green-300 mb-4">Auto Spin</label>
              <div className="space-y-3">
                <select
                  value={maxAutoSpins}
                  onChange={(e) => setMaxAutoSpins(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-700 border-2 border-green-500/30 rounded-xl text-white text-lg font-bold text-center"
                  disabled={isPlaying}
                >
                  <option value={10}>10 spins</option>
                  <option value={25}>25 spins</option>
                  <option value={50}>50 spins</option>
                  <option value={100}>100 spins</option>
                </select>
                <Button
                  variant={autoSpin ? "danger" : "secondary"}
                  onClick={toggleAutoSpin}
                  disabled={isPlaying && !autoSpin}
                  className="w-full py-3 text-lg font-bold"
                >
                  {autoSpin ? `Stop (${autoSpinCount}/${maxAutoSpins})` : 'Start Auto'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex justify-center space-x-6">
          <Button
            onClick={handleSpin}
            disabled={isPlaying || totalBet > session.balance || totalBet < 1 || autoSpin}
            className="px-16 py-6 text-2xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 hover:from-green-500 hover:via-blue-500 hover:to-purple-500 transform hover:scale-110 transition-all duration-300 shadow-2xl shadow-blue-500/30 rounded-2xl border-2 border-blue-400"
          >
            {isSpinning ? (
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>SPINNING...</span>
              </div>
            ) : (
              <>
                <Play className="w-8 h-8 mr-3" />
                SPIN {formatCurrency(totalBet)}
              </>
            )}
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
          
          <Button
            variant="ghost"
            onClick={() => setShowPaytable(!showPaytable)}
            className="px-8 py-6 text-xl font-bold hover:bg-yellow-500/20"
          >
            <Trophy className="w-6 h-6 mr-3" />
            Paytable
          </Button>
        </div>

        {/* Settings */}
        <div className="flex justify-center space-x-6">
          <Button
            variant="ghost"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-3"
          >
            {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </Button>
          
          <div className="flex items-center space-x-3">
            <label className="text-lg text-slate-400 font-medium">Speed:</label>
            <select
              value={spinSpeed}
              onChange={(e) => setSpinSpeed(parseInt(e.target.value))}
              className="px-4 py-2 bg-slate-700 border-2 border-slate-600 rounded-xl text-white text-lg font-bold"
              disabled={isPlaying}
            >
              <option value={150}>Slow</option>
              <option value={100}>Normal</option>
              <option value={50}>Fast</option>
              <option value={25}>Turbo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Paytable Modal */}
      {showPaytable && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-8 border-2 border-purple-500 max-w-4xl w-full max-h-[90vh] overflow-auto shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Paytable & Rules
              </h3>
              <Button variant="ghost" onClick={() => setShowPaytable(false)} className="text-2xl">
                ✕
              </Button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {SYMBOLS.map((symbolData, index) => (
                  <div key={index} className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl p-6 border-2 border-slate-600 hover:border-purple-500/50 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-5xl">{symbolData.symbol}</span>
                        <div>
                          <p className="text-xl font-bold text-white">{symbolData.name}</p>
                          <p className="text-sm text-slate-400">Rarity: {(symbolData.rarity * 100).toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-yellow-400">{symbolData.value}x</p>
                        <p className="text-sm text-slate-400">3+ symbols</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 rounded-2xl p-6 text-center border-4 border-yellow-400">
                <Crown className="w-16 h-16 text-yellow-200 mx-auto mb-4 animate-pulse" />
                <p className="text-2xl font-bold text-white mb-2">PROGRESSIVE JACKPOT</p>
                <p className="text-yellow-200 text-lg">5 Crown symbols (👑) on any active payline</p>
                <p className="text-3xl font-bold text-white mt-2">WINS ENTIRE JACKPOT!</p>
              </div>

              <div className="bg-slate-700 rounded-xl p-6 border-2 border-blue-500/30">
                <h4 className="text-xl font-bold text-blue-400 mb-4">Special Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg">
                  <div>
                    <p className="text-white font-bold">⭐ Wild Symbol</p>
                    <p className="text-slate-300">Substitutes for any symbol</p>
                  </div>
                  <div>
                    <p className="text-white font-bold">💎 Scatter Symbol</p>
                    <p className="text-slate-300">3+ anywhere pays bonus</p>
                  </div>
                  <div>
                    <p className="text-white font-bold">Multiple Paylines</p>
                    <p className="text-slate-300">Up to 9 ways to win</p>
                  </div>
                  <div>
                    <p className="text-white font-bold">Progressive Jackpot</p>
                    <p className="text-slate-300">Grows with every spin</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Statistics */}
      <div className="relative z-10 grid grid-cols-4 gap-4 text-center">
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl p-4 border-2 border-slate-600">
          <p className="text-slate-400 font-medium">Spins</p>
          <p className="text-2xl font-bold text-white">{session.spinsPlayed}</p>
        </div>
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl p-4 border-2 border-slate-600">
          <p className="text-slate-400 font-medium">Wagered</p>
          <p className="text-2xl font-bold text-blue-400">{formatCurrency(session.totalWagered)}</p>
        </div>
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl p-4 border-2 border-slate-600">
          <p className="text-slate-400 font-medium">Won</p>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(session.totalWon)}</p>
        </div>
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl p-4 border-2 border-slate-600">
          <p className="text-slate-400 font-medium">RTP</p>
          <p className="text-2xl font-bold text-purple-400">
            {session.totalWagered > 0 ? ((session.totalWon / session.totalWagered) * 100).toFixed(1) : '0.0'}%
          </p>
        </div>
      </div>
    </div>
  );
}