import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, Gift, Target, Star, Zap } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface FloatingWinner {
  id: string;
  user: string;
  amount: number;
  game: string;
  type: 'casino' | 'sports' | 'lottery' | 'jackpot';
  country: string;
  position: { x: number; y: number };
  timestamp: Date;
}

const WINNER_NAMES = [
  'Alex M.', 'Sarah K.', 'Mike C.', 'Emma W.', 'David L.', 'Lisa R.',
  'James B.', 'Anna S.', 'Tom H.', 'Maria G.', 'Chris P.', 'Sophie T.'
];

const COUNTRIES = ['🇺🇸', '🇬🇧', '🇨🇦', '🇦🇺', '🇩🇪', '🇫🇷', '🇪🇸', '🇮🇹'];

const CASINO_GAMES = ['Mega Fortune', 'Lightning Roulette', 'Blackjack Pro', 'Starburst'];
const SPORTS_GAMES = ['Lakers vs Celtics', 'Chiefs vs Bills', 'Man City vs Arsenal'];
const LOTTERY_PRIZES = ['iPhone 15 Pro', 'MacBook Pro', 'Apple Watch', 'AirPods Pro'];

export function FloatingWinners() {
  const [winners, setWinners] = useState<FloatingWinner[]>([]);

  useEffect(() => {
    const generateWinner = () => {
      const types: FloatingWinner['type'][] = ['casino', 'casino', 'casino', 'sports', 'lottery', 'jackpot'];
      const type = types[Math.floor(Math.random() * types.length)];
      const user = WINNER_NAMES[Math.floor(Math.random() * WINNER_NAMES.length)];
      const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
      
      let amount = 0;
      let game = '';

      switch (type) {
        case 'casino':
          amount = Math.random() < 0.1 ? 
            Math.floor(Math.random() * 30000) + 10000 : // 10% big wins
            Math.floor(Math.random() * 3000) + 100;
          game = CASINO_GAMES[Math.floor(Math.random() * CASINO_GAMES.length)];
          break;
        case 'sports':
          amount = Math.floor(Math.random() * 8000) + 200;
          game = SPORTS_GAMES[Math.floor(Math.random() * SPORTS_GAMES.length)];
          break;
        case 'lottery':
          amount = Math.floor(Math.random() * 2500) + 250;
          game = LOTTERY_PRIZES[Math.floor(Math.random() * LOTTERY_PRIZES.length)];
          break;
        case 'jackpot':
          amount = Math.floor(Math.random() * 200000) + 50000;
          game = 'Progressive Jackpot';
          break;
      }

      // Adjust position for mobile screens
      const maxX = Math.max(200, window.innerWidth - 300);
      const maxY = Math.max(100, window.innerHeight - 300);

      const winner: FloatingWinner = {
        id: `winner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user,
        amount,
        game,
        type,
        country,
        position: {
          x: Math.random() * maxX,
          y: Math.random() * maxY + 100
        },
        timestamp: new Date()
      };

      setWinners(prev => [winner, ...prev.slice(0, 4)]); // Keep max 5 floating winners

      // Remove after animation
      setTimeout(() => {
        setWinners(prev => prev.filter(w => w.id !== winner.id));
      }, 6000);
    };

    // Generate winners at random intervals
    const interval = setInterval(() => {
      if (Math.random() < 0.7) { // 70% chance to generate
        generateWinner();
      }
    }, Math.random() * 4000 + 2000); // 2-6 seconds

    // Initial winner
    setTimeout(generateWinner, 2000);

    return () => clearInterval(interval);
  }, []);

  const getWinnerIcon = (type: FloatingWinner['type']) => {
    switch (type) {
      case 'casino': return Trophy;
      case 'sports': return Target;
      case 'lottery': return Gift;
      case 'jackpot': return Crown;
      default: return Star;
    }
  };

  const getWinnerGradient = (type: FloatingWinner['type'], amount: number) => {
    if (amount >= 50000) return 'from-yellow-400 via-orange-500 to-red-500';
    if (amount >= 10000) return 'from-purple-400 via-pink-500 to-red-500';
    
    switch (type) {
      case 'casino': return 'from-purple-500 to-pink-500';
      case 'sports': return 'from-blue-500 to-cyan-500';
      case 'lottery': return 'from-pink-500 to-purple-500';
      case 'jackpot': return 'from-yellow-400 to-orange-500';
      default: return 'from-green-400 to-blue-500';
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-20">
      <AnimatePresence>
        {winners.map((winner) => {
          const Icon = getWinnerIcon(winner.type);
          const gradient = getWinnerGradient(winner.type, winner.amount);
          const isMegaWin = winner.amount >= 10000;
          
          return (
            <motion.div
              key={winner.id}
              initial={{ 
                scale: 0, 
                opacity: 0,
                x: winner.position.x,
                y: winner.position.y,
                rotate: -180
              }}
              animate={{ 
                scale: [0, 1.2, 1],
                opacity: [0, 1, 1, 0.8, 0],
                y: winner.position.y - 100,
                rotate: 0
              }}
              exit={{ 
                scale: 0, 
                opacity: 0,
                y: winner.position.y - 200
              }}
              transition={{ 
                duration: 4,
                times: [0, 0.2, 0.3, 0.8, 1],
                ease: "easeOut"
              }}
              className="absolute pointer-events-auto"
              style={{ 
                left: winner.position.x,
                top: winner.position.y
              }}
            >
              <div className={`
                bg-gradient-to-r ${gradient} p-2 sm:p-3 rounded-lg border border-white/30 shadow-lg backdrop-blur-sm
                ${isMegaWin ? 'animate-pulse shadow-2xl shadow-yellow-400/50' : ''}
                hover:scale-110 transition-transform duration-200 cursor-pointer
                max-w-48 sm:max-w-xs
              `}>
                {/* Sparkle effects for mega wins */}
                {isMegaWin && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1 right-1 w-1 h-1 bg-yellow-200 rounded-full animate-ping"></div>
                    <div className="absolute bottom-1 left-1 w-1 h-1 bg-white rounded-full animate-pulse"></div>
                  </div>
                )}
                
                <div className="relative z-10 flex items-center space-x-2 min-w-0">
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                    isMegaWin ? 'bg-white/30 animate-bounce' : 'bg-white/20'
                  }`}>
                    <Icon className={`w-3 h-3 sm:w-4 sm:h-4 text-white ${isMegaWin ? 'animate-pulse' : ''}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1 mb-1">
                      <p className="text-white font-bold text-xs truncate">
                        {winner.user}
                      </p>
                      <span className="text-xs">{winner.country}</span>
                      {isMegaWin && (
                        <Star className="w-2 h-2 text-yellow-200 fill-current animate-spin" />
                      )}
                    </div>
                    
                    <p className={`text-white text-xs leading-tight line-clamp-1 ${
                      isMegaWin ? 'font-bold animate-pulse' : ''
                    }`}>
                      {winner.type === 'jackpot' ? '💰 JACKPOT!' : 
                       winner.type === 'lottery' ? '🎁 Prize Win!' :
                       winner.type === 'sports' ? '⚽ Sports Win!' : '🎰 Casino Win!'}
                    </p>
                    
                    <p className={`text-white font-bold text-xs ${
                      isMegaWin ? 'text-yellow-200 animate-pulse' : ''
                    }`}>
                      {formatCurrency(winner.amount)}
                    </p>
                    
                    <p className="text-white/70 text-xs truncate hidden md:block">
                      {winner.game}
                    </p>
                  </div>
                </div>

                {/* Mega win badge */}
                {isMegaWin && (
                  <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1 border border-yellow-300 animate-pulse">
                    <Zap className="w-2 h-2 text-white" />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}