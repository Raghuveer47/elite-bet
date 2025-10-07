import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Zap, Star } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface JackpotData {
  name: string;
  amount: number;
  lastWinner?: string;
  timeAgo?: string;
}

export function JackpotTicker() {
  const [isVisible, setIsVisible] = useState(true);
  const [jackpots, setJackpots] = useState<JackpotData[]>([
    { name: 'Mega Fortune', amount: 2847392, lastWinner: 'Sarah K.', timeAgo: '2h ago' },
    { name: 'Divine Fortune', amount: 1923847, lastWinner: 'Mike C.', timeAgo: '5h ago' },
    { name: 'Hall of Gods', amount: 3291847, lastWinner: 'Emma W.', timeAgo: '1d ago' },
    { name: 'Arabian Nights', amount: 1647293, lastWinner: 'Alex M.', timeAgo: '3h ago' }
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [recentWin, setRecentWin] = useState<{ game: string; amount: number; user: string } | null>(null);

  useEffect(() => {
    // Update jackpot amounts continuously
    const jackpotInterval = setInterval(() => {
      setJackpots(prev => prev.map(jackpot => ({
        ...jackpot,
        amount: jackpot.amount + Math.floor(Math.random() * 500) + 100
      })));
    }, 2000);

    // Rotate through jackpots
    const rotateInterval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % jackpots.length);
    }, 4000);

    // Simulate jackpot wins occasionally
    const winInterval = setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance every interval
        const winningJackpot = jackpots[Math.floor(Math.random() * jackpots.length)];
        const winner = `${['Alex', 'Sarah', 'Mike', 'Emma', 'David'][Math.floor(Math.random() * 5)]} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}.`;
        
        setRecentWin({
          game: winningJackpot.name,
          amount: winningJackpot.amount,
          user: winner
        });

        // Reset jackpot and update winner info
        setJackpots(prev => prev.map(j => 
          j.name === winningJackpot.name 
            ? { ...j, amount: Math.floor(Math.random() * 500000) + 1000000, lastWinner: winner, timeAgo: 'Just now' }
            : j
        ));

        // Clear recent win after 8 seconds
        setTimeout(() => setRecentWin(null), 8000);
      }
    }, 15000); // Check every 15 seconds

    return () => {
      clearInterval(jackpotInterval);
      clearInterval(rotateInterval);
      clearInterval(winInterval);
    };
  }, [jackpots.length]);

  const currentJackpot = jackpots[currentIndex];

  if (!isVisible) return null;

  return (
    <div className="fixed top-16 sm:top-20 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-xs sm:max-w-sm px-2">
      {/* Recent Jackpot Win Alert */}
      {recentWin && (
        <motion.div
          initial={{ y: -100, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -100, opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="mb-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 p-2 sm:p-3 rounded-lg border-2 border-yellow-300 shadow-xl shadow-yellow-400/30 animate-pulse"
        >
          <div className="flex items-center justify-center space-x-2">
            <Crown className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-200 animate-bounce" />
            <div className="text-center">
              <p className="text-sm sm:text-lg font-bold text-white animate-bounce">
                🎉 JACKPOT WINNER! 🎉
              </p>
              <p className="text-xs sm:text-base text-yellow-200 font-bold">
                {recentWin.user} won {formatCurrency(recentWin.amount)}
              </p>
              <p className="text-xs sm:text-sm text-white">
                on {recentWin.game}!
              </p>
            </div>
            <Crown className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-200 animate-bounce" />
          </div>
          
          {/* Sparkle effects */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 15 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 0], 
                  scale: [0, 1, 0],
                  x: Math.random() * 300 - 150,
                  y: Math.random() * 200 - 100
                }}
                transition={{ 
                  duration: 2,
                  delay: Math.random() * 2,
                  repeat: Infinity,
                  repeatDelay: Math.random() * 3
                }}
                className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-200 rounded-full"
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Main Jackpot Ticker */}
      <motion.div
        key={currentIndex}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 p-2 sm:p-3 rounded-lg border border-white/20 shadow-lg backdrop-blur-sm"
      >
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 animate-pulse" />
            <div>
              <p className="text-white font-bold text-xs sm:text-sm">{currentJackpot.name}</p>
              <p className="text-white/80 text-xs">Progressive</p>
            </div>
          </div>
          
          <div className="text-center">
            <motion.p
              key={currentJackpot.amount}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.3 }}
              className="text-sm sm:text-lg font-bold text-yellow-300 animate-pulse"
            >
              {formatCurrency(currentJackpot.amount)}
            </motion.p>
            <p className="text-white/70 text-xs hidden sm:block">growing...</p>
          </div>
          
          {currentJackpot.lastWinner && (
            <div className="text-right hidden md:block">
              <p className="text-white/80 text-xs">Last Winner:</p>
              <p className="text-yellow-300 font-bold text-xs">{currentJackpot.lastWinner}</p>
              <p className="text-white/60 text-xs">{currentJackpot.timeAgo}</p>
            </div>
          )}
          
          <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 animate-bounce" />
        </div>

        {/* Progress indicators */}
        <div className="flex justify-center space-x-1 mt-2">
          {jackpots.map((_, index) => (
            <div
              key={index}
              className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'bg-yellow-400 scale-125' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </motion.div>

      {/* Mini jackpot amounts */}
      <div className="mt-1 flex justify-center space-x-1 overflow-x-auto">
        {jackpots.map((jackpot, index) => (
          <motion.div
            key={jackpot.name}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: index === currentIndex ? 1 : 0.5 }}
            className={`px-1 sm:px-2 py-1 rounded text-xs font-bold transition-all duration-300 whitespace-nowrap ${
              index === currentIndex 
                ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30' 
                : 'bg-slate-800/60 text-slate-300 border border-slate-600/30'
            }`}
          >
            <span className="hidden md:inline">{jackpot.name}: </span>{formatCurrency(jackpot.amount)}
          </motion.div>
        ))}
      </div>
      
      {/* Toggle Button */}
      <div className="mt-2 text-center">
        <button
          onClick={() => setIsVisible(false)}
          className="text-white/60 hover:text-white text-xs px-2 py-1 rounded bg-slate-800/60 border border-slate-600/30"
        >
          Hide
        </button>
      </div>
    </div>
  );
}