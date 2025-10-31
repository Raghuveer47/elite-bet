import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { Trophy, DollarSign, Gift, Zap, Crown, Star, Target, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../lib/utils';

interface LiveNotification {
  id: string;
  type: 'casino_win' | 'sports_win' | 'lottery_win' | 'jackpot' | 'withdrawal' | 'deposit' | 'big_bet';
  user: string;
  amount: number;
  game?: string;
  country?: string;
  timestamp: Date;
  special?: boolean;
}

const FAKE_USERS = [
  { name: 'Alex M.', country: '🇺🇸' },
  { name: 'Sarah K.', country: '🇬🇧' },
  { name: 'Mike C.', country: '🇨🇦' },
  { name: 'Emma W.', country: '🇦🇺' },
  { name: 'David L.', country: '🇩🇪' },
  { name: 'Lisa R.', country: '🇫🇷' },
  { name: 'James B.', country: '🇪🇸' },
  { name: 'Anna S.', country: '🇮🇹' },
  { name: 'Tom H.', country: '🇳🇱' },
  { name: 'Maria G.', country: '🇸🇪' },
  { name: 'Chris P.', country: '🇳🇴' },
  { name: 'Sophie T.', country: '🇩🇰' },
  { name: 'Ryan J.', country: '🇨🇭' },
  { name: 'Kate M.', country: '🇦🇹' },
  { name: 'Ben F.', country: '🇧🇪' },
  { name: 'Zoe D.', country: '🇮🇪' },
  { name: 'Max V.', country: '🇵🇹' },
  { name: 'Lily N.', country: '🇫🇮' }
];

const CASINO_GAMES = [
  'Mega Fortune Slots', 'Lightning Roulette', 'Blackjack Pro', 'Elite Baccarat',
  'Starburst', 'Book of Dead', 'Gonzo\'s Quest', 'Sweet Bonanza',
  'Crazy Time', 'Dream Catcher', 'Monopoly Live', 'Deal or No Deal'
];

const SPORTS_EVENTS = [
  'Lakers vs Celtics', 'Chiefs vs Bills', 'Man City vs Arsenal',
  'Real Madrid vs Barcelona', 'Cowboys vs Giants', 'Warriors vs Nets',
  'Liverpool vs Chelsea', 'Bayern vs Dortmund', 'Yankees vs Red Sox'
];

const LOTTERY_PRIZES = [
  'iPhone 15 Pro Max', 'MacBook Pro M3', 'Apple Watch Ultra', 'AirPods Pro',
  'iPad Pro', 'PlayStation 5', 'Xbox Series X', 'Nintendo Switch'
];

export function LiveNotificationSystem() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [visibleNotifications, setVisibleNotifications] = useState<Set<string>>(new Set());
  const [nextNotificationTime, setNextNotificationTime] = useState(Date.now() + 3000);
  const removalTimers = useRef<Record<string, number>>({});

  // Show only for the first 15 seconds after a user logs in.
  // After that, hide until a different user logs in.
  useEffect(() => {
    if (!user) return;

    const storedUserId = localStorage.getItem('liveNotifUser');
    const storedSeen = localStorage.getItem('liveNotifSeen');

    if (storedUserId === (user.id || user.userId) && storedSeen === 'true') {
      setIsActive(false);
      return;
    }

    setIsActive(true);
    const timer = window.setTimeout(() => {
      setIsActive(false);
      localStorage.setItem('liveNotifUser', (user.id || user.userId || 'unknown'));
      localStorage.setItem('liveNotifSeen', 'true');
    }, 15000);

    return () => clearTimeout(timer);
  }, [user?.id]);

  useEffect(() => {
    if (!isActive) return;

    const generateNotification = (): LiveNotification => {
      const user = FAKE_USERS[Math.floor(Math.random() * FAKE_USERS.length)];
      const types: LiveNotification['type'][] = [
        'casino_win', 'casino_win', 'casino_win', 'casino_win', // More casino wins
        'sports_win', 'sports_win', 'sports_win',
        'lottery_win', 'lottery_win',
        'jackpot',
        'withdrawal', 'withdrawal',
        'deposit', 'deposit',
        'big_bet'
      ];
      
      const type = types[Math.floor(Math.random() * types.length)];
      let amount = 0;
      let game = '';
      let special = false;

      switch (type) {
        case 'casino_win':
          amount = Math.random() < 0.1 ? 
            Math.floor(Math.random() * 50000) + 10000 : // 10% chance of big win
            Math.floor(Math.random() * 2000) + 100;
          game = CASINO_GAMES[Math.floor(Math.random() * CASINO_GAMES.length)];
          special = amount > 5000;
          break;
        case 'sports_win':
          amount = Math.floor(Math.random() * 5000) + 200;
          game = SPORTS_EVENTS[Math.floor(Math.random() * SPORTS_EVENTS.length)];
          special = amount > 2000;
          break;
        case 'lottery_win':
          amount = Math.random() < 0.3 ? 
            Math.floor(Math.random() * 2000) + 500 : // 30% chance of big prize
            Math.floor(Math.random() * 500) + 100;
          game = LOTTERY_PRIZES[Math.floor(Math.random() * LOTTERY_PRIZES.length)];
          special = amount > 800;
          break;
        case 'jackpot':
          amount = Math.floor(Math.random() * 100000) + 50000;
          game = CASINO_GAMES[Math.floor(Math.random() * 4)]; // Only major games
          special = true;
          break;
        case 'withdrawal':
          amount = Math.floor(Math.random() * 10000) + 500;
          break;
        case 'deposit':
          amount = Math.floor(Math.random() * 5000) + 100;
          break;
        case 'big_bet':
          amount = Math.floor(Math.random() * 10000) + 1000;
          game = CASINO_GAMES[Math.floor(Math.random() * CASINO_GAMES.length)];
          break;
      }

      return {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        user: user.name,
        amount,
        game,
        country: user.country,
        timestamp: new Date(),
        special
      };
    };

    // Generate notifications one at a time
    const generateRandomNotification = () => {
      const now = Date.now();
      
      // Only show notification if enough time has passed
      if (now >= nextNotificationTime) {
        const notification = generateNotification();
        setNotifications(prev => [notification]); // Show only ONE notification at a time
        setVisibleNotifications(prev => new Set([notification.id]));

        // Auto-hide notification after 8 seconds, then schedule removal (storable timer for Undo)
        window.setTimeout(() => {
          setVisibleNotifications(prev => {
            const newSet = new Set(prev);
            newSet.delete(notification.id);
            return newSet;
          });
          // Schedule removal in 4s to allow Undo
          removalTimers.current[notification.id] = window.setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
            delete removalTimers.current[notification.id];
          }, 4000);
        }, 8000);
        
        // Set next notification time to 10 seconds from now
        setNextNotificationTime(now + 10000);
      }
    };

    // Start showing notifications after 3 seconds
    setTimeout(() => {
      generateRandomNotification();
    }, 3000);

    // Check every second if it's time for next notification
    const interval = setInterval(() => {
      generateRandomNotification();
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, nextNotificationTime]);

  const getNotificationIcon = (type: LiveNotification['type']) => {
    switch (type) {
      case 'casino_win': return Trophy;
      case 'sports_win': return Target;
      case 'lottery_win': return Gift;
      case 'jackpot': return Crown;
      case 'withdrawal': return DollarSign;
      case 'deposit': return Coins;
      case 'big_bet': return Zap;
      default: return Star;
    }
  };

  const getNotificationColor = (type: LiveNotification['type'], special: boolean) => {
    if (special) {
      return 'from-yellow-400 via-orange-500 to-red-500';
    }
    
    switch (type) {
      case 'casino_win': return 'from-purple-500 to-pink-500';
      case 'sports_win': return 'from-blue-500 to-cyan-500';
      case 'lottery_win': return 'from-pink-500 to-purple-500';
      case 'jackpot': return 'from-yellow-400 to-orange-500';
      case 'withdrawal': return 'from-green-500 to-emerald-500';
      case 'deposit': return 'from-blue-500 to-indigo-500';
      case 'big_bet': return 'from-red-500 to-pink-500';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  const getNotificationMessage = (notification: LiveNotification) => {
    switch (notification.type) {
      case 'casino_win':
        return notification.special ? 
          `🎰 MEGA WIN! ${notification.user} won ${formatCurrency(notification.amount)} on ${notification.game}!` :
          `🎉 ${notification.user} won ${formatCurrency(notification.amount)} on ${notification.game}`;
      case 'sports_win':
        return notification.special ?
          `🏆 BIG WIN! ${notification.user} won ${formatCurrency(notification.amount)} on ${notification.game}!` :
          `⚽ ${notification.user} won ${formatCurrency(notification.amount)} on ${notification.game}`;
      case 'lottery_win':
        return notification.special ?
          `🎁 AMAZING! ${notification.user} won ${notification.game} worth ${formatCurrency(notification.amount)}!` :
          `🎫 ${notification.user} won ${notification.game} in Prize Lottery!`;
      case 'jackpot':
        return `💰 JACKPOT! ${notification.user} hit the ${formatCurrency(notification.amount)} jackpot on ${notification.game}!`;
      case 'withdrawal':
        return `💸 ${notification.user} successfully withdrew ${formatCurrency(notification.amount)}`;
      case 'deposit':
        return `💳 ${notification.user} deposited ${formatCurrency(notification.amount)} and is ready to play!`;
      case 'big_bet':
        return `🔥 ${notification.user} placed a ${formatCurrency(notification.amount)} bet on ${notification.game}!`;
      default:
        return `${notification.user} won ${formatCurrency(notification.amount)}`;
    }
  };

  // sounds disabled in production for now

  return (
    <div className="fixed top-16 sm:top-20 right-2 sm:right-4 z-[35] space-y-1 sm:space-y-2 pointer-events-none max-w-48 sm:max-w-xs">
      <AnimatePresence>
        {notifications.map((notification) => {
          const Icon = getNotificationIcon(notification.type);
          const gradient = getNotificationColor(notification.type, notification.special || false);
          
          return (
                          <motion.div
              key={notification.id}
              initial={{ x: 400, opacity: 0, scale: 0.8 }}
              animate={{ 
                x: 0, 
                opacity: visibleNotifications.has(notification.id) ? 1 : 0.6, 
                scale: visibleNotifications.has(notification.id) ? 1 : 0.95 
              }}
              exit={{ x: 400, opacity: 0, scale: 0.8 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                duration: 0.3
              }}
              className={`
                bg-gradient-to-r ${gradient} p-2 sm:p-3 rounded-lg border border-white/20 shadow-lg backdrop-blur-sm
                w-full pointer-events-auto cursor-pointer hover:scale-105 transition-transform duration-200
                ${notification.special ? 'animate-pulse shadow-2xl shadow-yellow-400/50' : ''}
                ${visibleNotifications.has(notification.id) ? '' : 'opacity-50'}
              `}
              onClick={() => {
                setVisibleNotifications(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(notification.id);
                  return newSet;
                });
                // Schedule removal and store timer so Undo can cancel it
                removalTimers.current[notification.id] = window.setTimeout(() => {
                  setNotifications(prev => prev.filter(n => n.id !== notification.id));
                  delete removalTimers.current[notification.id];
                }, 4000);
              }}
            >
              {/* Special effects for big wins */}
              {notification.special && (
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 to-orange-500/30 rounded-lg animate-ping"></div>
              )}
              
              <div className="relative z-10 flex items-center space-x-2">
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                  notification.special ? 'bg-white/20 animate-bounce' : 'bg-white/10'
                }`}>
                  <Icon className={`w-3 h-3 sm:w-4 sm:h-4 text-white ${notification.special ? 'animate-pulse' : ''}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1 mb-1">
                    <p className="text-white font-bold text-xs truncate">
                      {notification.user}
                    </p>
                    <span className="text-xs">{notification.country}</span>
                    {notification.special && (
                      <Star className="w-2 h-2 text-yellow-200 fill-current animate-spin" />
                    )}
                  </div>
                  
                  <p className={`text-white/90 text-xs leading-tight line-clamp-1 sm:line-clamp-2 ${
                    notification.special ? 'font-bold animate-pulse' : ''
                  }`}>
                    {getNotificationMessage(notification)}
                  </p>
                  
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-white/70 text-xs">
                      {notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {notification.special && (
                      <Zap className="w-2 h-2 text-yellow-200 animate-pulse" />
                    )}
                  </div>
                  
                  {/* Undo button */}
                  {!visibleNotifications.has(notification.id) && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Cancel any pending removal timer
                        const timerId = removalTimers.current[notification.id];
                        if (timerId) {
                          clearTimeout(timerId);
                          delete removalTimers.current[notification.id];
                        }
                        setVisibleNotifications(prev => new Set(prev).add(notification.id));
                      }}
                      className="mt-2 w-full bg-white/20 hover:bg-white/30 text-white text-xs py-1 px-2 rounded transition-colors"
                    >
                      Undo
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Sparkle effects for special wins */}
              {notification.special && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1 right-1 w-1 h-1 bg-yellow-300 rounded-full animate-ping"></div>
                  <div className="absolute bottom-2 left-2 w-1 h-1 bg-white rounded-full animate-pulse"></div>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setIsActive(!isActive)}
        className="bg-slate-800/80 backdrop-blur-sm text-white p-1.5 rounded-full border border-slate-600 hover:bg-slate-700 transition-colors pointer-events-auto"
        title={isActive ? 'Disable Live Notifications' : 'Enable Live Notifications'}
      >
        {isActive ? '🔔' : '🔕'}
      </motion.button>
    </div>
  );
}