import React, { useState, useEffect } from 'react';
import { 
  Bell, Search, Settings, User, Shield, Activity,
  AlertTriangle, CheckCircle, Clock, RefreshCw, DollarSign,
  Globe, Zap, Monitor, Database, Wifi, TrendingUp, BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAdmin } from '../../contexts/SupabaseAdminContext';
import { formatCurrency } from '../../lib/utils';

export function AdminTopBar() {
  const { adminUser, systemStats, pendingPayments, riskAlerts } = useAdmin();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickStats, setShowQuickStats] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemHealth, setSystemHealth] = useState({
    cpu: 23,
    memory: 67,
    disk: 34,
    network: 12
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setSystemHealth(prev => ({
        cpu: Math.max(10, Math.min(90, prev.cpu + Math.floor(Math.random() * 6) - 3)),
        memory: Math.max(30, Math.min(85, prev.memory + Math.floor(Math.random() * 4) - 2)),
        disk: Math.max(20, Math.min(80, prev.disk + Math.floor(Math.random() * 2) - 1)),
        network: Math.max(5, Math.min(50, prev.network + Math.floor(Math.random() * 4) - 2))
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const notifications = [
    {
      id: '1',
      type: 'payment',
      title: 'New Deposit Pending',
      message: 'Sarah K. submitted $2,500 deposit',
      time: '2 min ago',
      unread: true,
      severity: 'medium',
      action: 'Review Payment'
    },
    {
      id: '2',
      type: 'risk',
      title: 'High Risk Alert',
      message: 'Unusual betting pattern detected',
      time: '5 min ago',
      unread: true,
      severity: 'high',
      action: 'Investigate'
    },
    {
      id: '3',
      type: 'kyc',
      title: 'KYC Verification',
      message: 'Mike C. uploaded documents',
      time: '8 min ago',
      unread: false,
      severity: 'low',
      action: 'Review Documents'
    },
    {
      id: '4',
      type: 'system',
      title: 'System Update',
      message: 'Database optimization completed successfully',
      time: '15 min ago',
      unread: false,
      severity: 'low',
      action: 'View Report'
    },
    {
      id: '5',
      type: 'jackpot',
      title: 'Jackpot Win',
      message: 'Emma W. won $25,000 progressive jackpot',
      time: '22 min ago',
      unread: false,
      severity: 'low',
      action: 'View Transaction'
    }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;
  const criticalAlerts = riskAlerts.filter(a => a.severity === 'critical' || a.severity === 'high').length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment': return <DollarSign className="w-4 h-4 text-green-400" />;
      case 'risk': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'kyc': return <Shield className="w-4 h-4 text-blue-400" />;
      case 'system': return <Monitor className="w-4 h-4 text-cyan-400" />;
      case 'jackpot': return <TrendingUp className="w-4 h-4 text-yellow-400" />;
      default: return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-l-red-500 bg-red-500/5';
      case 'medium': return 'border-l-yellow-500 bg-yellow-500/5';
      case 'low': return 'border-l-blue-500 bg-blue-500/5';
      default: return 'border-l-slate-500 bg-slate-500/5';
    }
  };

  return (
    <header className="bg-slate-800/95 backdrop-blur-sm border-b border-slate-700 px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search users, transactions, or reports..."
              className="pl-10 bg-slate-700 border-slate-600 focus:border-blue-500 transition-all duration-200"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Quick Stats Toggle */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQuickStats(!showQuickStats)}
              className="flex items-center space-x-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden md:inline">Stats</span>
            </Button>
            
            {showQuickStats && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50">
                <div className="p-4 border-b border-slate-700">
                  <h3 className="font-semibold text-white">Quick Statistics</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">{formatCurrency(systemStats.platformRevenue)}</p>
                      <p className="text-xs text-slate-400">Total Revenue</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">{systemStats.totalUsers}</p>
                      <p className="text-xs text-slate-400">Total Users</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="text-center">
                      <p className="text-green-400 font-bold">{systemHealth.cpu}%</p>
                      <p className="text-slate-400">CPU</p>
                    </div>
                    <div className="text-center">
                      <p className="text-blue-400 font-bold">{systemHealth.memory}%</p>
                      <p className="text-slate-400">RAM</p>
                    </div>
                    <div className="text-center">
                      <p className="text-purple-400 font-bold">{systemHealth.disk}%</p>
                      <p className="text-slate-400">Disk</p>
                    </div>
                    <div className="text-center">
                      <p className="text-cyan-400 font-bold">{systemHealth.network}ms</p>
                      <p className="text-slate-400">Ping</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* System Status Indicators */}
          <div className="hidden md:flex items-center space-x-4 px-4 py-2 bg-slate-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <Monitor className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400 font-medium">Online</span>
            </div>
            <div className="w-px h-4 bg-slate-600"></div>
            <div className="flex items-center space-x-1">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span className="text-sm text-yellow-400">{systemHealth.cpu}%</span>
            </div>
            <div className="w-px h-4 bg-slate-600"></div>
            <div className="text-sm text-slate-300">
              {currentTime.toLocaleTimeString()}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="hidden lg:flex items-center space-x-4 px-4 py-2 bg-slate-700 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-slate-400">Revenue</p>
              <p className="text-sm font-bold text-green-400">{formatCurrency(systemStats.platformRevenue / 1000)}K</p>
            </div>
            <div className="w-px h-8 bg-slate-600"></div>
            <div className="text-center">
              <p className="text-xs text-slate-400">Users</p>
              <p className="text-sm font-bold text-blue-400">{systemStats.totalUsers.toLocaleString()}</p>
            </div>
            <div className="w-px h-8 bg-slate-600"></div>
            <div className="text-center">
              <p className="text-xs text-slate-400">Pending</p>
              <p className="text-sm font-bold text-yellow-400">{pendingPayments.filter(p => p.status === 'pending').length}</p>
            </div>
          </div>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative hover:bg-slate-700"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50">
                <div className="p-4 border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-5 h-5 text-blue-400" />
                      <h3 className="font-semibold text-white">Live Notifications</h3>
                    </div>
                    <span className="text-xs text-slate-400">{unreadCount} unread</span>
                  </div>
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`p-4 border-l-4 transition-all duration-300 cursor-pointer ${getSeverityColor(notification.severity)}`}
                    >
                      <div className="flex items-start space-x-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-white truncate">{notification.title}</h4>
                            {notification.unread && (
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{notification.message}</p>
                          <p className="text-xs text-slate-500 mt-1">{notification.time}</p>
                          {notification.action && (
                            <Button variant="ghost" size="sm" className="mt-2 text-xs">
                              {notification.action}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-3 border-t border-slate-700">
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" className="flex-1 text-xs">
                    View All Notifications
                  </Button>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Mark All Read
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Admin Profile */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-white">
                {adminUser?.firstName} {adminUser?.lastName}
              </p>
              <div className="flex items-center space-x-2">
                <p className="text-xs text-red-400 font-medium">{adminUser?.role.name}</p>
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
            </div>
            
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Alert Bar */}
      {criticalAlerts > 0 && (
        <div className="bg-red-600/20 border-b border-red-500/30 px-6 py-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="text-red-400 font-bold text-sm">
                {criticalAlerts} critical alert{criticalAlerts > 1 ? 's' : ''} require immediate attention
              </span>
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-bounce">
                URGENT
              </span>
            </div>
            <Link to="/admin/risk">
              <Button variant="danger" size="sm" className="text-xs animate-pulse">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Review Now
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}