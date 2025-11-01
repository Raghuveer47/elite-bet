import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, Wallet, Trophy, Clock, DollarSign, Activity, 
  Target, Star, Zap, Crown, Gift, AlertTriangle, CheckCircle,
  BarChart3, Users, Calendar, MapPin, Eye, Settings, Bell,
  ArrowUp, ArrowDown, Play, Pause, RefreshCw, Filter, Shield
} from 'lucide-react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { WalletProvider, useWallet } from '../contexts/SupabaseWalletContext';
import { formatCurrency, formatDate } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { WelcomeBonusNotification } from '../components/WelcomeBonusNotification';
import { BalanceDebugger } from '../components/BalanceDebugger';
import { KYCVerificationBanner } from '../components/notifications/KYCVerificationBanner';

function DashboardContent() {
  const { user, isAuthenticated } = useAuth();
  const { getTransactions, stats, getBalance, getAvailableBalance, refreshWallet, accounts, transactions } = useWallet();
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    activeSessions: 1,
    avgSessionTime: 45,
    winRate: 0,
    profitLoss: 0,
    favoriteGame: 'None',
    totalSessions: 0
  });

  // Memoize transactions to prevent infinite loops
  const recentTransactions = useMemo(() => getTransactions(10), [transactions.length, user?.id]);
  const currentBalance = getBalance();
  const availableBalance = getAvailableBalance();

  // Calculate real-time user metrics - use transactions.length as stable dependency
  useEffect(() => {
    if (!user || recentTransactions.length === 0) return;

    const bets = recentTransactions.filter(t => t.type === 'bet' && t.status === 'completed');
    const wins = recentTransactions.filter(t => t.type === 'win' && t.status === 'completed');
    
    const totalWagered = bets.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalWon = wins.reduce((sum, t) => sum + t.amount, 0);
    const winRate = bets.length > 0 ? (wins.length / bets.length) * 100 : 0;
    const profitLoss = totalWon - totalWagered;

    // Find favorite game
    const gameFrequency: Record<string, number> = {};
    bets.forEach(bet => {
      const game = bet.metadata?.gameName || bet.method || 'Unknown';
      gameFrequency[game] = (gameFrequency[game] || 0) + 1;
    });
    const favoriteGame = Object.keys(gameFrequency).reduce((a, b) => 
      gameFrequency[a] > gameFrequency[b] ? a : b, 'None'
    );

    setRealTimeMetrics({
      activeSessions: 1,
      avgSessionTime: Math.floor(Math.random() * 30) + 30,
      winRate: winRate,
      profitLoss: profitLoss,
      favoriteGame: favoriteGame,
      totalSessions: bets.length
    });
  }, [user?.id, transactions.length]); // Use stable dependencies to prevent infinite loop

  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Please login to access your dashboard</p>
          <Link to="/login">
            <Button>Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  const dashboardStats = [
    { 
      label: 'Current Balance', 
      value: formatCurrency(currentBalance), 
      icon: Wallet, 
      color: 'text-green-400',
      change: stats.totalWon - stats.totalWagered >= 0 ? '+' : '',
      trend: stats.totalWon - stats.totalWagered >= 0 ? 'up' : 'down',
      description: 'Total account balance'
    },
    { 
      label: 'Available Balance', 
      value: formatCurrency(availableBalance), 
      icon: Activity, 
      color: 'text-blue-400',
      change: availableBalance > currentBalance * 0.8 ? 'High' : 'Low',
      trend: availableBalance > currentBalance * 0.8 ? 'up' : 'down',
      description: 'Available for new bets'
    },
    { 
      label: 'Total Winnings', 
      value: formatCurrency(stats.totalWon), 
      icon: Trophy, 
      color: 'text-yellow-400',
      change: stats.totalWon > 0 ? `+${((stats.totalWon / Math.max(stats.totalWagered, 1)) * 100).toFixed(1)}%` : '0%',
      trend: stats.totalWon > stats.totalWagered ? 'up' : 'down',
      description: 'Lifetime winnings'
    },
    { 
      label: 'Net Profit', 
      value: formatCurrency(stats.totalWon - stats.totalWagered), 
      icon: TrendingUp, 
      color: stats.totalWon - stats.totalWagered >= 0 ? 'text-green-400' : 'text-red-400',
      change: stats.totalWagered > 0 ? `${((stats.totalWon - stats.totalWagered) / stats.totalWagered * 100).toFixed(1)}%` : '0%',
      trend: stats.totalWon - stats.totalWagered >= 0 ? 'up' : 'down',
      description: 'Total profit/loss'
    }
  ];

  const quickActions = [
    { 
      title: 'Sports Betting', 
      description: 'Live markets and events', 
      href: '/sports', 
      icon: Activity,
      stats: `${recentTransactions.filter(t => t.method.includes('Sports')).length} recent bets`,
      color: 'from-blue-500/10 to-cyan-500/10',
      borderColor: 'border-blue-500/20'
    },
    { 
      title: 'Casino Games', 
      description: 'Slots and table games', 
      href: '/casino', 
      icon: Trophy,
      stats: `${recentTransactions.filter(t => t.method.includes('Casino')).length} recent plays`,
      color: 'from-purple-500/10 to-pink-500/10',
      borderColor: 'border-purple-500/20'
    },
    { 
      title: 'My Wallet', 
      description: 'Manage your funds', 
      href: '/wallet', 
      icon: DollarSign,
      stats: `${recentTransactions.filter(t => t.type === 'deposit' || t.type === 'withdraw').length} transactions`,
      color: 'from-green-500/10 to-emerald-500/10',
      borderColor: 'border-green-500/20'
    },
    { 
      title: 'Promotions', 
      description: 'Available bonuses', 
      href: '/promotions', 
      icon: Gift,
      stats: 'Active offers available',
      color: 'from-yellow-500/10 to-orange-500/10',
      borderColor: 'border-yellow-500/20'
    },
    { 
      title: 'Account Settings', 
      description: 'Profile and security', 
      href: '/account', 
      icon: Settings,
      stats: user.isVerified ? 'Verified account' : 'Verification pending',
      color: 'from-slate-500/10 to-slate-600/10',
      borderColor: 'border-slate-500/20'
    },
    { 
      title: 'Support Center', 
      description: 'Help and assistance', 
      href: '/support', 
      icon: Bell,
      stats: 'Live chat available',
      color: 'from-indigo-500/10 to-purple-500/10',
      borderColor: 'border-indigo-500/20'
    }
  ];

  const todayTransactions = recentTransactions.filter(t => 
    new Date(t.createdAt).toDateString() === new Date().toDateString()
  );

  const weeklyStats = {
    totalWagered: recentTransactions
      .filter(t => t.type === 'bet' && new Date(t.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    totalWon: recentTransactions
      .filter(t => t.type === 'win' && new Date(t.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .reduce((sum, t) => sum + t.amount, 0),
    sessionsPlayed: recentTransactions
      .filter(t => t.type === 'bet' && new Date(t.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .length
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* KYC Verification Banner */}
      <KYCVerificationBanner />
      
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-500 to-green-400 bg-clip-text text-transparent">
                Welcome back, {user.firstName}!
              </h1>
              <p className="text-slate-400 text-lg">Here's your comprehensive betting overview</p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
              <Button variant="outline" size="sm" onClick={refreshWallet}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Account Status Banner */}
          <div className={`rounded-xl p-6 border-2 mb-6 ${
            user.isVerified 
              ? 'bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-green-500/30' 
              : 'bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-slate-300">{user.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {user.isVerified ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-green-400 font-medium">Verified Account</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        <span className="text-yellow-400 font-medium">Verification Pending</span>
                        <Link to="/account">
                          <Button variant="outline" size="sm" className="ml-2">
                            Complete Verification
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-400">Account Balance</p>
                <p className="text-3xl font-bold text-green-400">
                  {formatCurrency(currentBalance)}
                </p>
                <p className="text-slate-300">Available: {formatCurrency(availableBalance)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardStats.map((stat, index) => (
            <div key={index} className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:scale-105 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
                <stat.icon className="w-full h-full" />
              </div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className={`w-8 h-8 ${stat.color} group-hover:scale-110 transition-transform`} />
                  <div className="flex items-center space-x-1">
                    {stat.trend === 'up' ? (
                      <ArrowUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-red-400" />
                    )}
                    <span className={`text-sm font-medium ${
                      stat.trend === 'up' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                <p className="text-slate-500 text-xs mt-1">{stat.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Performance Analytics */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Betting Performance */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-bold text-white">Betting Performance</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAdvancedStats(!showAdvancedStats)}>
                <Eye className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Win Rate:</span>
                  <span className={`font-bold text-lg ${realTimeMetrics.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                    {realTimeMetrics.winRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      realTimeMetrics.winRate >= 50 ? 'bg-green-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.min(100, realTimeMetrics.winRate)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Sessions:</p>
                  <p className="text-white font-bold">{realTimeMetrics.totalSessions}</p>
                </div>
                <div>
                  <p className="text-slate-400">Avg Time:</p>
                  <p className="text-white font-bold">{realTimeMetrics.avgSessionTime}m</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400">Favorite Game:</p>
                  <p className="text-purple-400 font-bold">{realTimeMetrics.favoriteGame}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Activity */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center space-x-2 mb-6">
              <Calendar className="w-6 h-6 text-green-400" />
              <h3 className="text-lg font-bold text-white">Today's Activity</h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                  <p className="text-green-400 font-medium text-sm">Deposits</p>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(todayTransactions
                      .filter(t => t.type === 'deposit')
                      .reduce((sum, t) => sum + t.amount, 0)
                    )}
                  </p>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                  <p className="text-blue-400 font-medium text-sm">Bets</p>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(todayTransactions
                      .filter(t => t.type === 'bet')
                      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
                    )}
                  </p>
                </div>
                <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
                  <p className="text-yellow-400 font-medium text-sm">Wins</p>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(todayTransactions
                      .filter(t => t.type === 'win')
                      .reduce((sum, t) => sum + t.amount, 0)
                    )}
                  </p>
                </div>
                <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                  <p className="text-purple-400 font-medium text-sm">Net</p>
                  <p className={`text-xl font-bold ${
                    realTimeMetrics.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatCurrency(realTimeMetrics.profitLoss)}
                  </p>
                </div>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Active Bets:</span>
                  <span className="text-white font-bold">{formatCurrency(stats.activeBets)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Summary */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center space-x-2 mb-6">
              <TrendingUp className="w-6 h-6 text-purple-400" />
              <h3 className="text-lg font-bold text-white">Weekly Summary</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Wagered:</span>
                  <span className="text-blue-400 font-bold">{formatCurrency(weeklyStats.totalWagered)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Won:</span>
                  <span className="text-yellow-400 font-bold">{formatCurrency(weeklyStats.totalWon)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-600 pt-3">
                  <span className="text-slate-400">Net Result:</span>
                  <span className={`font-bold text-lg ${
                    weeklyStats.totalWon - weeklyStats.totalWagered >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatCurrency(weeklyStats.totalWon - weeklyStats.totalWagered)}
                  </span>
                </div>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Sessions Played:</span>
                  <span className="text-white font-bold">{weeklyStats.sessionsPlayed}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
            <Zap className="w-6 h-6 text-yellow-400" />
            <span>Quick Actions</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.href}>
                <div className={`bg-gradient-to-br ${action.color} rounded-xl p-6 border ${action.borderColor} hover:scale-105 transition-all duration-300 group relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
                    <action.icon className="w-full h-full" />
                  </div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <action.icon className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded-full">
                        Quick Access
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-white">{action.title}</h3>
                    <p className="text-slate-400 text-sm mb-3">{action.description}</p>
                    <p className="text-slate-300 text-xs font-medium">{action.stats}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Enhanced Recent Activity */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-6 h-6 text-blue-400" />
                  <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    {recentTransactions.length}
                  </span>
                </div>
                <Link to="/wallet">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View All
                  </Button>
                </Link>
              </div>
            </div>
            
            {recentTransactions.length === 0 ? (
              <div className="p-12 text-center">
                <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-400 mb-2">No Recent Activity</h3>
                <p className="text-slate-500 mb-6">Start betting or playing to see your activity here</p>
                <div className="flex justify-center space-x-4">
                  <Link to="/sports">
                    <Button>
                      <Target className="w-4 h-4 mr-2" />
                      Sports Betting
                    </Button>
                  </Link>
                  <Link to="/casino">
                    <Button variant="outline">
                      <Trophy className="w-4 h-4 mr-2" />
                      Casino Games
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <div className="divide-y divide-slate-700">
                  {recentTransactions.map((transaction, index) => (
                    <div key={transaction.id} className="p-4 hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                          transaction.type === 'deposit' || transaction.type === 'win' || transaction.type === 'bonus'
                            ? 'bg-green-500/10 border-green-500/30 text-green-400'
                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}>
                          {transaction.type === 'deposit' && <ArrowDown className="w-5 h-5" />}
                          {transaction.type === 'withdraw' && <ArrowUp className="w-5 h-5" />}
                          {transaction.type === 'bet' && <Target className="w-5 h-5" />}
                          {transaction.type === 'win' && <Trophy className="w-5 h-5" />}
                          {transaction.type === 'bonus' && <Gift className="w-5 h-5" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-white truncate capitalize">
                              {transaction.type}
                            </h4>
                            <span className={`text-sm font-bold ${
                              transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                            </span>
                          </div>
                          
                          <p className="text-sm text-slate-300 truncate">{transaction.description}</p>
                          
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-slate-400">{transaction.method}</span>
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                transaction.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {transaction.status}
                              </span>
                              <span className="text-xs text-slate-400">
                                {formatDate(transaction.createdAt)}
                              </span>
                            </div>
                          </div>
                          
                          {transaction.metadata?.profit !== undefined && (
                            <div className="mt-2">
                              <span className={`text-xs font-medium ${
                                transaction.metadata.profit >= 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                P/L: {formatCurrency(transaction.metadata.profit)}
                                {transaction.metadata.multiplier && ` (${transaction.metadata.multiplier.toFixed(1)}x)`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Account Insights */}
          <div className="space-y-6">
            {/* Account Health */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center space-x-2 mb-6">
                <Shield className="w-6 h-6 text-green-400" />
                <h3 className="text-lg font-bold text-white">Account Health</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Security Score:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-slate-600 rounded-full h-2">
                      <div className={`h-2 rounded-full ${user.isVerified ? 'bg-green-400' : 'bg-yellow-400'}`} 
                           style={{ width: user.isVerified ? '100%' : '60%' }}></div>
                    </div>
                    <span className={`text-sm font-bold ${user.isVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                      {user.isVerified ? '100%' : '60%'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-slate-300">Email Verified</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {user.isVerified ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-400" />
                    )}
                    <span className="text-slate-300">Identity {user.isVerified ? 'Verified' : 'Pending'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-slate-300">2FA Ready</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Responsible Gaming */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center space-x-2 mb-6">
                <Shield className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-bold text-white">Responsible Gaming</h3>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-400 font-medium">Session Time:</span>
                    <span className="text-white font-bold">{realTimeMetrics.avgSessionTime}m</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-1">
                    <div className="bg-blue-400 h-1 rounded-full" style={{ width: `${Math.min(100, (realTimeMetrics.avgSessionTime / 120) * 100)}%` }}></div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Recommended: 2 hours max</p>
                </div>
                
                <div className="text-center">
                  <Link to="/account">
                    <Button variant="outline" size="sm" className="w-full">
                      <Settings className="w-4 h-4 mr-2" />
                      Set Limits
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Analytics (if enabled) */}
        {showAdvancedStats && (
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Advanced Analytics</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAdvancedStats(false)}>
                <Eye className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <p className="text-2xl font-bold text-blue-400">{((stats.totalWon / Math.max(stats.totalWagered, 1)) * 100).toFixed(1)}%</p>
                <p className="text-slate-400 text-sm">Return Rate</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <p className="text-2xl font-bold text-green-400">{recentTransactions.filter(t => t.type === 'win').length}</p>
                <p className="text-slate-400 text-sm">Total Wins</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <p className="text-2xl font-bold text-purple-400">
                  {recentTransactions.filter(t => t.metadata?.multiplier && t.metadata.multiplier > 5).length}
                </p>
                <p className="text-slate-400 text-sm">Big Wins (5x+)</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <p className="text-2xl font-bold text-yellow-400">
                  {Math.max(...recentTransactions.filter(t => t.metadata?.multiplier).map(t => t.metadata?.multiplier || 0), 0).toFixed(1)}x
                </p>
                <p className="text-slate-400 text-sm">Best Multiplier</p>
              </div>
            </div>
          </div>
        )}

        {/* Account Recommendations */}
        <div className="bg-gradient-to-r from-slate-800 via-blue-800/20 to-slate-800 rounded-xl p-6 border border-blue-500/30">
          <div className="flex items-center space-x-2 mb-4">
            <Star className="w-6 h-6 text-yellow-400" />
            <h3 className="text-lg font-bold text-white">Personalized Recommendations</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {!user.isVerified && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <h4 className="font-medium text-yellow-400">Complete Verification</h4>
                </div>
                <p className="text-sm text-slate-300 mb-3">
                  Unlock higher limits and faster withdrawals
                </p>
                <Link to="/account">
                  <Button variant="outline" size="sm" className="w-full">
                    Verify Now
                  </Button>
                </Link>
              </div>
            )}
            
            {currentBalance < 100 && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <h4 className="font-medium text-green-400">Add Funds</h4>
                </div>
                <p className="text-sm text-slate-300 mb-3">
                  Deposit funds to continue playing
                </p>
                <Link to="/wallet">
                  <Button variant="outline" size="sm" className="w-full">
                    Deposit Now
                  </Button>
                </Link>
              </div>
            )}
            
            {stats.totalWagered === 0 && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Play className="w-5 h-5 text-blue-400" />
                  <h4 className="font-medium text-blue-400">Start Playing</h4>
                </div>
                <p className="text-sm text-slate-300 mb-3">
                  Explore our sports and casino games
                </p>
                <Link to="/sports">
                  <Button variant="outline" size="sm" className="w-full">
                    Browse Games
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Welcome Bonus Notification */}
      <WelcomeBonusNotification />
    </div>
  );
}

export function DashboardPage() {
  return (
    <WalletProvider>
      <DashboardContent />
    </WalletProvider>
  );
}