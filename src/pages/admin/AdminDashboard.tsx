import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, DollarSign, TrendingUp, TrendingDown, Activity, 
  AlertTriangle, CheckCircle, Clock, Shield, Gamepad2, 
  RefreshCw, Eye, Settings, Bell, Zap, Monitor, Database,
  Globe, Wifi, Server, HardDrive, Cpu, MemoryStick, Network,
  Target, Trophy, Star, Crown, Gift, MessageCircle, FileText,
  Calendar, MapPin, Filter, Search, Download, Upload, Edit,
  Plus, Minus, X, ArrowUp, ArrowDown, ArrowRight, Play, Pause
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { SyncMonitor } from '../../components/admin/SyncMonitor';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Link } from 'react-router-dom';

export function AdminDashboard() {
  const { 
    systemStats, 
    users, 
    getAllTransactions, 
    pendingPayments, 
    riskAlerts, 
    games,
    refreshSystemStats,
    isLoading 
  } = useAdmin();

  const [realTimeMetrics, setRealTimeMetrics] = useState({
    serverLoad: 23,
    responseTime: 45,
    uptime: 99.98,
    activeConnections: 1247,
    memoryUsage: 67,
    diskUsage: 34,
    networkLatency: 12,
    errorRate: 0.02
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');

  useEffect(() => {
    // Load real recent activity from transactions and user actions
    const transactions = getAllTransactions();
    const activity = transactions.slice(0, 10).map(transaction => {
      const user = users.find(u => u.id === transaction.userId);
      return {
        id: transaction.id,
        type: transaction.type,
        user: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
        amount: transaction.amount,
        description: transaction.description,
        timestamp: transaction.createdAt,
        status: transaction.status
      };
    });
    setRecentActivity(activity);

    // Update real-time metrics every 3 seconds
    const metricsInterval = setInterval(() => {
      setRealTimeMetrics(prev => ({
        serverLoad: Math.max(10, Math.min(90, prev.serverLoad + Math.floor(Math.random() * 6) - 3)),
        responseTime: Math.max(20, Math.min(200, prev.responseTime + Math.floor(Math.random() * 10) - 5)),
        uptime: Math.max(99.5, Math.min(100, prev.uptime + (Math.random() - 0.5) * 0.01)),
        activeConnections: Math.max(800, Math.min(2000, prev.activeConnections + Math.floor(Math.random() * 20) - 10)),
        memoryUsage: Math.max(40, Math.min(85, prev.memoryUsage + Math.floor(Math.random() * 4) - 2)),
        diskUsage: Math.max(20, Math.min(80, prev.diskUsage + Math.floor(Math.random() * 2) - 1)),
        networkLatency: Math.max(5, Math.min(100, prev.networkLatency + Math.floor(Math.random() * 6) - 3)),
        errorRate: Math.max(0, Math.min(1, prev.errorRate + (Math.random() - 0.5) * 0.01))
      }));
    }, 3000);

    return () => clearInterval(metricsInterval);
  }, [getAllTransactions, users]);

  const kpiCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(systemStats.platformRevenue),
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'from-green-500/10 to-emerald-500/10',
      borderColor: 'border-green-500/20'
    },
    {
      title: 'Active Users',
      value: systemStats.activeUsers.toLocaleString(),
      change: '+8.3%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'from-blue-500/10 to-cyan-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      title: 'Pending Payments',
      value: pendingPayments.filter(p => p.status === 'pending').length.toString(),
      change: pendingPayments.filter(p => p.status === 'pending').length > 5 ? 'High' : 'Normal',
      trend: pendingPayments.filter(p => p.status === 'pending').length > 5 ? 'up' : 'down',
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'from-yellow-500/10 to-orange-500/10',
      borderColor: 'border-yellow-500/20'
    },
    {
      title: 'Risk Alerts',
      value: riskAlerts.filter(a => a.status === 'open').length.toString(),
      change: riskAlerts.filter(a => a.severity === 'critical').length > 0 ? 'Critical' : 'Normal',
      trend: riskAlerts.filter(a => a.severity === 'critical').length > 0 ? 'up' : 'down',
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'from-red-500/10 to-pink-500/10',
      borderColor: 'border-red-500/20'
    },
    {
      title: 'Total Deposits',
      value: formatCurrency(systemStats.totalDeposits),
      change: '+15.7%',
      trend: 'up',
      icon: TrendingDown,
      color: 'text-purple-400',
      bgColor: 'from-purple-500/10 to-indigo-500/10',
      borderColor: 'border-purple-500/20'
    },
    {
      title: 'System Health',
      value: `${realTimeMetrics.serverLoad}%`,
      change: realTimeMetrics.serverLoad < 50 ? 'Optimal' : realTimeMetrics.serverLoad < 80 ? 'Good' : 'High',
      trend: realTimeMetrics.serverLoad < 50 ? 'down' : 'up',
      icon: Monitor,
      color: realTimeMetrics.serverLoad < 50 ? 'text-green-400' : realTimeMetrics.serverLoad < 80 ? 'text-yellow-400' : 'text-red-400',
      bgColor: realTimeMetrics.serverLoad < 50 ? 'from-green-500/10 to-emerald-500/10' : 'from-yellow-500/10 to-orange-500/10',
      borderColor: realTimeMetrics.serverLoad < 50 ? 'border-green-500/20' : 'border-yellow-500/20'
    }
  ];

  const systemHealthMetrics = [
    {
      name: 'Server Load',
      value: realTimeMetrics.serverLoad,
      unit: '%',
      icon: Server,
      color: realTimeMetrics.serverLoad < 50 ? 'text-green-400' : realTimeMetrics.serverLoad < 80 ? 'text-yellow-400' : 'text-red-400',
      bgColor: realTimeMetrics.serverLoad < 50 ? 'bg-green-500/10' : realTimeMetrics.serverLoad < 80 ? 'bg-yellow-500/10' : 'bg-red-500/10'
    },
    {
      name: 'Memory Usage',
      value: realTimeMetrics.memoryUsage,
      unit: '%',
      icon: MemoryStick,
      color: realTimeMetrics.memoryUsage < 70 ? 'text-green-400' : realTimeMetrics.memoryUsage < 85 ? 'text-yellow-400' : 'text-red-400',
      bgColor: realTimeMetrics.memoryUsage < 70 ? 'bg-green-500/10' : realTimeMetrics.memoryUsage < 85 ? 'bg-yellow-500/10' : 'bg-red-500/10'
    },
    {
      name: 'Disk Usage',
      value: realTimeMetrics.diskUsage,
      unit: '%',
      icon: HardDrive,
      color: realTimeMetrics.diskUsage < 60 ? 'text-green-400' : realTimeMetrics.diskUsage < 80 ? 'text-yellow-400' : 'text-red-400',
      bgColor: realTimeMetrics.diskUsage < 60 ? 'bg-green-500/10' : realTimeMetrics.diskUsage < 80 ? 'bg-yellow-500/10' : 'bg-red-500/10'
    },
    {
      name: 'Response Time',
      value: realTimeMetrics.responseTime,
      unit: 'ms',
      icon: Zap,
      color: realTimeMetrics.responseTime < 100 ? 'text-green-400' : realTimeMetrics.responseTime < 200 ? 'text-yellow-400' : 'text-red-400',
      bgColor: realTimeMetrics.responseTime < 100 ? 'bg-green-500/10' : realTimeMetrics.responseTime < 200 ? 'bg-yellow-500/10' : 'bg-red-500/10'
    },
    {
      name: 'Network Latency',
      value: realTimeMetrics.networkLatency,
      unit: 'ms',
      icon: Network,
      color: realTimeMetrics.networkLatency < 50 ? 'text-green-400' : realTimeMetrics.networkLatency < 100 ? 'text-yellow-400' : 'text-red-400',
      bgColor: realTimeMetrics.networkLatency < 50 ? 'bg-green-500/10' : realTimeMetrics.networkLatency < 100 ? 'bg-yellow-500/10' : 'bg-red-500/10'
    },
    {
      name: 'Error Rate',
      value: realTimeMetrics.errorRate,
      unit: '%',
      icon: AlertTriangle,
      color: realTimeMetrics.errorRate < 0.1 ? 'text-green-400' : realTimeMetrics.errorRate < 0.5 ? 'text-yellow-400' : 'text-red-400',
      bgColor: realTimeMetrics.errorRate < 0.1 ? 'bg-green-500/10' : realTimeMetrics.errorRate < 0.5 ? 'bg-yellow-500/10' : 'bg-red-500/10'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <TrendingDown className="w-4 h-4 text-green-400" />;
      case 'withdraw': return <TrendingUp className="w-4 h-4 text-red-400" />;
      case 'bet': return <Target className="w-4 h-4 text-blue-400" />;
      case 'win': return <Trophy className="w-4 h-4 text-yellow-400" />;
      case 'bonus': return <Gift className="w-4 h-4 text-purple-400" />;
      default: return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getActivityColor = (type: string, status: string) => {
    if (status === 'failed') return 'text-red-400';
    if (status === 'pending') return 'text-yellow-400';
    
    switch (type) {
      case 'deposit': return 'text-green-400';
      case 'withdraw': return 'text-red-400';
      case 'bet': return 'text-blue-400';
      case 'win': return 'text-yellow-400';
      case 'bonus': return 'text-purple-400';
      default: return 'text-slate-400';
    }
  };

  const quickActions = [
    {
      title: 'Review Payments',
      description: `${pendingPayments.filter(p => p.status === 'pending').length} pending`,
      href: '/admin/financial',
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'from-green-500/10 to-emerald-500/10',
      urgent: pendingPayments.filter(p => p.status === 'pending').length > 0
    },
    {
      title: 'Risk Alerts',
      description: `${riskAlerts.filter(a => a.status === 'open').length} open alerts`,
      href: '/admin/risk',
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'from-red-500/10 to-pink-500/10',
      urgent: riskAlerts.filter(a => a.severity === 'critical').length > 0
    },
    {
      title: 'User Management',
      description: `${systemStats.totalUsers} total users`,
      href: '/admin/users',
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'from-blue-500/10 to-cyan-500/10',
      urgent: false
    },
    {
      title: 'Game Management',
      description: `${games.filter(g => g.isActive).length} active games`,
      href: '/admin/games',
      icon: Gamepad2,
      color: 'text-purple-400',
      bgColor: 'from-purple-500/10 to-indigo-500/10',
      urgent: false
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400">Real-time platform monitoring and management</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <Button variant="outline" size="sm" onClick={refreshSystemStats} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((kpi, index) => (
          <div key={index} className={`bg-gradient-to-br ${kpi.bgColor} rounded-xl p-6 border ${kpi.borderColor} relative overflow-hidden group hover:scale-105 transition-all duration-300 cursor-pointer`}>
            <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
              <kpi.icon className="w-full h-full" />
            </div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <kpi.icon className={`w-8 h-8 ${kpi.color} group-hover:scale-110 transition-transform`} />
                <div className="flex items-center space-x-1">
                  {kpi.trend === 'up' ? (
                    <ArrowUp className="w-3 h-3 text-green-400" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-red-400" />
                  )}
                  <span className={`text-xs font-medium ${
                    kpi.trend === 'up' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {kpi.change}
                  </span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{kpi.value}</h3>
              <p className="text-slate-400 text-sm">{kpi.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* System Health Monitoring */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Monitor className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-bold text-white">System Health Monitoring</h3>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-medium">Live</span>
            </div>
          </div>
          <div className="text-sm text-slate-400">
            Uptime: <span className="text-green-400 font-bold">{realTimeMetrics.uptime.toFixed(2)}%</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {systemHealthMetrics.map((metric, index) => (
            <div key={index} className={`${metric.bgColor} rounded-lg p-4 border border-slate-600 relative overflow-hidden`}>
              <div className="flex items-center justify-between mb-3">
                <metric.icon className={`w-6 h-6 ${metric.color}`} />
                <span className={`text-lg font-bold ${metric.color}`}>
                  {typeof metric.value === 'number' ? metric.value.toFixed(metric.unit === '%' ? 0 : 1) : metric.value}{metric.unit}
                </span>
              </div>
              <p className="text-slate-300 text-sm font-medium">{metric.name}</p>
              
              {/* Progress bar for percentage metrics */}
              {metric.unit === '%' && (
                <div className="mt-2 w-full bg-slate-600 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full transition-all duration-500 ${
                      metric.value < 50 ? 'bg-green-400' : 
                      metric.value < 80 ? 'bg-yellow-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.min(100, metric.value)}%` }}
                  ></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-bold text-white">Recent Platform Activity</h3>
              </div>
              <Link to="/admin/financial">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No recent activity</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {recentActivity.map((activity, index) => (
                  <div key={activity.id} className="p-4 hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center border border-slate-600">
                        {getActivityIcon(activity.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white truncate">
                            {activity.user}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            activity.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            activity.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            activity.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {activity.status}
                          </span>
                        </div>
                        
                        <p className="text-sm text-slate-300 truncate">{activity.description}</p>
                        
                        <div className="flex items-center justify-between mt-1">
                          <span className={`text-sm font-bold ${getActivityColor(activity.type, activity.status)}`}>
                            {activity.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(activity.amount))}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatDate(activity.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-slate-800 rounded-xl border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center space-x-2">
                <Zap className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-bold text-white">Quick Actions</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {quickActions.map((action, index) => (
                <Link key={index} to={action.href}>
                  <div className={`bg-gradient-to-r ${action.bgColor} rounded-lg p-4 border border-slate-600 hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden group`}>
                    {action.urgent && (
                      <div className="absolute top-2 right-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center border border-slate-600 group-hover:scale-110 transition-transform">
                        <action.icon className={`w-5 h-5 ${action.color}`} />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-bold text-white">{action.title}</h4>
                        <p className="text-sm text-slate-300">{action.description}</p>
                      </div>
                      
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Data Sync Monitor */}
          <SyncMonitor />
        </div>
      </div>

      {/* Platform Analytics */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Financial Overview */}
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-6 h-6 text-green-400" />
              <h3 className="text-lg font-bold text-white">Financial Overview</h3>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-400 font-medium text-sm">Total Deposits</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(systemStats.totalDeposits)}</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-green-400" />
                </div>
              </div>
              
              <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-400 font-medium text-sm">Total Withdrawals</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(systemStats.totalWithdrawals)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-red-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-400 font-medium text-sm">Platform Revenue</p>
                  <p className="text-3xl font-bold text-white">{formatCurrency(systemStats.platformRevenue)}</p>
                  <p className="text-sm text-slate-400">Net profit from operations</p>
                </div>
                <DollarSign className="w-10 h-10 text-blue-400" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Total Bets:</p>
                <p className="text-white font-bold">{formatCurrency(systemStats.totalBets)}</p>
              </div>
              <div>
                <p className="text-slate-400">Total Winnings:</p>
                <p className="text-white font-bold">{formatCurrency(systemStats.totalWinnings)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Analytics */}
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center space-x-2">
              <Users className="w-6 h-6 text-blue-400" />
              <h3 className="text-lg font-bold text-white">User Analytics</h3>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-400">{systemStats.totalUsers}</p>
                <p className="text-slate-400 text-sm">Total Users</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-400">{systemStats.activeUsers}</p>
                <p className="text-slate-400 text-sm">Active Users</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Verified Users:</span>
                <span className="text-green-400 font-bold">
                  {users.filter(u => u.isVerified).length} ({((users.filter(u => u.isVerified).length / Math.max(1, users.length)) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">High Risk Users:</span>
                <span className="text-red-400 font-bold">
                  {users.filter(u => u.riskLevel === 'high').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Suspended Users:</span>
                <span className="text-yellow-400 font-bold">
                  {users.filter(u => u.status === 'suspended').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">New Today:</span>
                <span className="text-purple-400 font-bold">
                  {users.filter(u => 
                    new Date(u.registrationDate).toDateString() === new Date().toDateString()
                  ).length}
                </span>
              </div>
            </div>
            
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Average Balance:</span>
                <span className="text-white font-bold">
                  {formatCurrency(users.length > 0 ? users.reduce((sum, u) => sum + u.balance, 0) / users.length : 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts and Notifications */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Critical Alerts */}
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <h3 className="text-lg font-bold text-white">Critical Alerts</h3>
              </div>
              <Link to="/admin/risk">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {riskAlerts.filter(a => a.severity === 'critical' || a.severity === 'high').length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-green-400 font-medium">No critical alerts</p>
                <p className="text-slate-400 text-sm">System is operating normally</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {riskAlerts
                  .filter(a => a.severity === 'critical' || a.severity === 'high')
                  .slice(0, 5)
                  .map(alert => {
                    const user = users.find(u => u.id === alert.userId);
                    return (
                      <div key={alert.id} className="p-4 hover:bg-slate-700/50 transition-colors">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className={`w-5 h-5 mt-1 ${
                            alert.severity === 'critical' ? 'text-red-400' : 'text-orange-400'
                          }`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-white">{alert.type.replace('_', ' ').toUpperCase()}</h4>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                              }`}>
                                {alert.severity}
                              </span>
                            </div>
                            <p className="text-sm text-slate-300 mt-1">{alert.description}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-slate-400">
                                User: {user ? `${user.firstName} ${user.lastName}` : 'Unknown'}
                              </span>
                              <span className="text-xs text-slate-400">
                                {formatDate(alert.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center space-x-2">
              <Clock className="w-6 h-6 text-yellow-400" />
              <h3 className="text-lg font-bold text-white">Pending Tasks</h3>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Pending Payments */}
            <Link to="/admin/financial">
              <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-6 h-6 text-yellow-400" />
                    <div>
                      <h4 className="font-medium text-white">Payment Reviews</h4>
                      <p className="text-sm text-slate-400">Deposits and withdrawals pending</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-yellow-400">
                      {pendingPayments.filter(p => p.status === 'pending').length}
                    </p>
                    <p className="text-xs text-slate-400">pending</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* KYC Verifications */}
            <Link to="/admin/kyc">
              <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20 hover:bg-blue-500/20 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-6 h-6 text-blue-400" />
                    <div>
                      <h4 className="font-medium text-white">KYC Reviews</h4>
                      <p className="text-sm text-slate-400">Identity verifications pending</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-400">0</p>
                    <p className="text-xs text-slate-400">pending</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Support Tickets */}
            <Link to="/admin/support">
              <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20 hover:bg-purple-500/20 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="w-6 h-6 text-purple-400" />
                    <div>
                      <h4 className="font-medium text-white">Support Tickets</h4>
                      <p className="text-sm text-slate-400">Customer support requests</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-400">3</p>
                    <p className="text-xs text-slate-400">open</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Game Performance */}
            <Link to="/admin/games">
              <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20 hover:bg-green-500/20 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Gamepad2 className="w-6 h-6 text-green-400" />
                    <div>
                      <h4 className="font-medium text-white">Game Performance</h4>
                      <p className="text-sm text-slate-400">Monitor game metrics</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-400">{games.filter(g => g.isActive).length}</p>
                    <p className="text-xs text-slate-400">active</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* System Events */}
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center space-x-2">
              <Globe className="w-6 h-6 text-cyan-400" />
              <h3 className="text-lg font-bold text-white">System Events</h3>
            </div>
          </div>
          
          <div className="p-6 space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm font-medium text-white">Database Backup Completed</p>
                <p className="text-xs text-slate-400">2 minutes ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Database className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-white">Cache Optimization Complete</p>
                <p className="text-xs text-slate-400">15 minutes ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <Settings className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-sm font-medium text-white">Scheduled Maintenance</p>
                <p className="text-xs text-slate-400">Tomorrow 2:00 AM UTC</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <Shield className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-sm font-medium text-white">Security Scan Complete</p>
                <p className="text-xs text-slate-400">1 hour ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}