import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Users, DollarSign, Trophy, Target, Gift, Crown, Star, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';

interface ActivityItem {
  id: string;
  type: 'win' | 'bet' | 'jackpot' | 'withdrawal' | 'registration';
  user: string;
  amount?: number;
  game?: string;
  country: string;
  timestamp: Date;
  multiplier?: number;
}

const COUNTRIES = ['🇺🇸', '🇬🇧', '🇨🇦', '🇦🇺', '🇩🇪', '🇫🇷', '🇪🇸', '🇮🇹', '🇳🇱', '🇸🇪'];
const NAMES = [
  'Alex', 'Sarah', 'Mike', 'Emma', 'David', 'Lisa', 'James', 'Anna', 'Tom', 'Maria',
  'Chris', 'Sophie', 'Ryan', 'Kate', 'Ben', 'Zoe', 'Max', 'Lily', 'Jake', 'Mia'
];
const GAMES = [
  'Mega Fortune', 'Lightning Roulette', 'Blackjack Pro', 'Starburst', 'Book of Dead',
  'Lakers vs Celtics', 'Chiefs vs Bills', 'Man City vs Arsenal', 'Prize Lottery'
];

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dismissedActivities, setDismissedActivities] = useState<Set<string>>(new Set());

  useEffect(() => {
    const generateActivity = (): ActivityItem => {
      const types: ActivityItem['type'][] = ['win', 'win', 'win', 'bet', 'jackpot', 'withdrawal', 'registration'];
      const type = types[Math.floor(Math.random() * types.length)];
      const name = NAMES[Math.floor(Math.random() * NAMES.length)];
      const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
      const game = GAMES[Math.floor(Math.random() * GAMES.length)];

      let amount = 0;
      let multiplier = 1;

      switch (type) {
        case 'win':
          amount = Math.random() < 0.05 ? 
            Math.floor(Math.random() * 25000) + 5000 : // 5% chance of big win
            Math.floor(Math.random() * 1500) + 50;
          multiplier = Math.random() * 20 + 2;
          break;
        case 'bet':
          amount = Math.floor(Math.random() * 2000) + 10;
          break;
        case 'jackpot':
          amount = Math.floor(Math.random() * 500000) + 100000;
          break;
        case 'withdrawal':
          amount = Math.floor(Math.random() * 15000) + 500;
          break;
        case 'registration':
          amount = 100; // Welcome bonus
          break;
      }

      return {
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        user: `${name} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}.`,
        amount,
        game,
        country,
        timestamp: new Date(),
        multiplier: type === 'win' ? multiplier : undefined
      };
    };

    // Generate initial activities
    const initialActivities = Array.from({ length: 8 }, generateActivity);
    setActivities(initialActivities);

    // Generate new activities periodically (reduced frequency)
    const interval = setInterval(() => {
      const newActivity = generateActivity();
      setActivities(prev => [newActivity, ...prev.slice(0, 19)]); // Keep only 20 activities
    }, Math.random() * 15000 + 10000); // Random interval 10-25 seconds (much slower)

    return () => clearInterval(interval);
  }, []);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'win': return Trophy;
      case 'bet': return Target;
      case 'jackpot': return Crown;
      case 'withdrawal': return DollarSign;
      case 'registration': return Users;
      default: return Activity;
    }
  };

  const getActivityColor = (type: ActivityItem['type'], amount?: number) => {
    if (type === 'jackpot' || (amount && amount >= 10000)) {
      return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    }
    
    switch (type) {
      case 'win': return amount && amount >= 1000 ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'bet': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'withdrawal': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'registration': return 'text-pink-400 bg-pink-500/10 border-pink-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const [lastDismissedId, setLastDismissedId] = useState<string | null>(null);

  const handleUndoDismiss = () => {
    if (lastDismissedId) {
      setDismissedActivities(prev => {
        const newSet = new Set(prev);
        newSet.delete(lastDismissedId);
        return newSet;
      });
      setLastDismissedId(null);
      toast.success('Activity restored');
    }
  };

  const handleDismissActivity = (activityId: string) => {
    setDismissedActivities(prev => new Set([...prev, activityId]));
    setLastDismissedId(activityId);
    
    // Show undo notification
    toast(
      (t) => (
        <div className="flex items-center gap-3">
          <span className="text-white">Activity dismissed</span>
          <button
            onClick={() => {
              handleUndoDismiss();
              toast.dismiss(t.id);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            Undo
          </button>
        </div>
      ),
      { duration: 4000, id: 'activity-dismissed' }
    );
  };

  const getActivityMessage = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'win':
        if (activity.amount! >= 10000) {
          return `🎰 MEGA WIN! Won ${formatCurrency(activity.amount!)} on ${activity.game}! (${activity.multiplier?.toFixed(1)}x)`;
        } else if (activity.amount! >= 1000) {
          return `🎉 BIG WIN! Won ${formatCurrency(activity.amount!)} on ${activity.game}! (${activity.multiplier?.toFixed(1)}x)`;
        }
        return `🎯 Won ${formatCurrency(activity.amount!)} on ${activity.game} (${activity.multiplier?.toFixed(1)}x)`;
      case 'bet':
        return `🎲 Placed ${formatCurrency(activity.amount!)} bet on ${activity.game}`;
      case 'jackpot':
        return `💰 HIT THE JACKPOT! Won ${formatCurrency(activity.amount!)} on ${activity.game}!`;
      case 'withdrawal':
        return `💸 Successfully withdrew ${formatCurrency(activity.amount!)}`;
      case 'registration':
        return `🎊 Joined Elite Bet and received ${formatCurrency(activity.amount!)} welcome bonus!`;
      default:
        return `Activity on ${activity.game}`;
    }
  };

  // Filter out dismissed activities
  const visibleActivities = activities.filter(activity => !dismissedActivities.has(activity.id));

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-2 sm:left-4 w-64 sm:w-72 max-h-48 sm:max-h-64 z-[25]">
      {/* Header - Clickable to expand/collapse */}
      <div 
        className={`bg-slate-800/95 backdrop-blur-sm rounded-t-lg p-2 sm:p-3 border border-slate-700 ${!isCollapsed ? 'border-b-0' : 'rounded-b-lg'} cursor-pointer transition-all duration-200`}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 animate-pulse" />
            <h3 className="font-semibold text-white text-xs sm:text-sm">Live Activity</h3>
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
            {isCollapsed && (
              <span className="text-xs text-slate-400 ml-2">({visibleActivities.length} new)</span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(false);
            }}
            className="text-slate-400 hover:text-white transition-colors text-xs"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Activity List */}
      {!isCollapsed && (
        <div className="bg-slate-800/95 backdrop-blur-sm rounded-b-lg border border-slate-700 border-t-0 max-h-32 sm:max-h-48 overflow-y-auto">
        <AnimatePresence>
          {visibleActivities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type, activity.amount);
            
            return (
              <motion.div
                key={activity.id}
                initial={{ x: -400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 30,
                  delay: index * 0.1
                }}
                className={`p-2 sm:p-3 border-b border-slate-700 last:border-b-0 hover:bg-slate-700/50 transition-colors cursor-pointer ${
                  activity.amount && activity.amount >= 5000 ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10' : ''
                }`}
                onClick={() => handleDismissActivity(activity.id)}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center border ${colorClass} ${
                    activity.amount && activity.amount >= 5000 ? 'animate-pulse' : ''
                  }`}>
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1 mb-1">
                      <p className="text-white font-medium text-xs truncate">
                        {activity.user}
                      </p>
                      <span className="text-xs">{activity.country}</span>
                      {activity.amount && activity.amount >= 10000 && (
                        <div className="flex space-x-1">
                          <Star className="w-2 h-2 sm:w-3 sm:h-3 text-yellow-400 fill-current animate-spin" />
                          <Crown className="w-2 h-2 sm:w-3 sm:h-3 text-yellow-400 fill-current" />
                        </div>
                      )}
                    </div>
                    
                    <p className={`text-xs leading-tight line-clamp-1 sm:line-clamp-2 ${
                      activity.amount && activity.amount >= 5000 ? 'text-yellow-200 font-bold' : 'text-slate-300'
                    }`}>
                      {getActivityMessage(activity)}
                    </p>
                    
                    <p className="text-xs text-slate-400">
                      {activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      )}

      {/* Stats Footer */}
      {!isCollapsed && (
        <div className="bg-slate-900/95 backdrop-blur-sm p-2 border border-slate-700 border-t-0">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <TrendingUp className="w-3 h-3 text-green-400 mx-auto mb-1" />
            <p className="text-green-400 font-bold">
              {visibleActivities.filter(a => a.type === 'win').length}
            </p>
            <p className="text-slate-400">Wins</p>
          </div>
          <div>
            <DollarSign className="w-3 h-3 text-blue-400 mx-auto mb-1" />
            <p className="text-blue-400 font-bold text-xs">
              {formatCurrency(visibleActivities.filter(a => a.amount).reduce((sum, a) => sum + (a.amount || 0), 0))}
            </p>
            <p className="text-slate-400">Total</p>
          </div>
          <div>
            <Users className="w-3 h-3 text-purple-400 mx-auto mb-1" />
            <p className="text-purple-400 font-bold">
              {new Set(visibleActivities.map(a => a.user)).size}
            </p>
            <p className="text-slate-400">Players</p>
          </div>
        </div>
      </div>
      )}
      {!isVisible && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setIsVisible(true)}
          className="fixed bottom-4 left-2 sm:left-4 bg-slate-800/90 backdrop-blur-sm text-white p-2 rounded-full border border-slate-600 hover:bg-slate-700 transition-colors shadow-lg"
          title="Show Live Activity"
        >
          <Activity className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  );
}