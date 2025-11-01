import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Shield, BarChart3, Users, DollarSign, Gamepad2, 
  AlertTriangle, MessageCircle, Gift, Settings, Wallet,
  ChevronLeft, ChevronRight, Home, LogOut, Activity,
  TrendingUp, Bell, Clock, CheckCircle
} from 'lucide-react';
import { useAdmin } from '../../contexts/SupabaseAdminContext';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

export function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { adminUser, adminLogout, systemStats, pendingPayments, riskAlerts } = useAdmin();
  const location = useLocation();

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/admin/dashboard', 
      icon: BarChart3,
      badge: null,
      description: 'Overview & analytics'
    },
    { 
      name: 'Withdrawals', 
      href: '/admin/withdrawals', 
      icon: Wallet,
      badge: pendingPayments.filter(p => p.type==='withdrawal' && p.status==='pending').length > 0 ? 
        pendingPayments.filter(p => p.type==='withdrawal' && p.status==='pending').length.toString() : null,
      description: 'Approve or reject withdrawals',
      urgent: pendingPayments.filter(p => p.type==='withdrawal' && p.status==='pending').length > 0
    },
    { 
      name: 'User Management', 
      href: '/admin/users', 
      icon: Users,
      badge: systemStats.totalUsers.toString(),
      description: 'Manage user accounts'
    },
    { 
      name: 'Financial', 
      href: '/admin/financial', 
      icon: DollarSign,
      badge: pendingPayments.filter(p => p.status === 'pending').length > 0 ? 
        pendingPayments.filter(p => p.status === 'pending').length.toString() : null,
      description: 'Payments & reports',
      urgent: pendingPayments.filter(p => p.status === 'pending').length > 0
    },
    { 
      name: 'Game Management', 
      href: '/admin/games', 
      icon: Gamepad2,
      badge: null,
      description: 'Configure games & RTPs'
    },
    { 
      name: 'Risk Management', 
      href: '/admin/risk', 
      icon: AlertTriangle,
      badge: riskAlerts.filter(a => a.severity === 'critical' || a.severity === 'high').length > 0 ?
        riskAlerts.filter(a => a.severity === 'critical' || a.severity === 'high').length.toString() : null,
      description: 'Security & fraud detection',
      urgent: riskAlerts.filter(a => a.severity === 'critical').length > 0
    },
    { 
      name: 'KYC Verification', 
      href: '/admin/kyc', 
      icon: Shield,
      badge: null,
      description: 'Identity verification'
    },
    { 
      name: 'Promotions', 
      href: '/admin/promotions', 
      icon: Gift,
      badge: null,
      description: 'Manage bonuses & offers'
    },
    { 
      name: 'Support Tickets', 
      href: '/admin/support', 
      icon: MessageCircle,
      badge: null,
      description: 'Customer support tickets'
    },
    { 
      name: 'Live Chat', 
      href: '/admin/live-chat', 
      icon: MessageCircle,
      badge: null, // Will be updated dynamically
      description: 'Real-time chat support',
      urgent: false // Will be updated dynamically
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={`bg-slate-900 border-r border-slate-700 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } flex flex-col`}>
      {/* Logo & Toggle */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <Link to="/admin/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">Elite Bet</span>
                <span className="text-xs text-red-400 block leading-none">ADMIN PANEL</span>
              </div>
            </Link>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group relative',
                active
                  ? 'bg-gradient-to-r from-red-600/20 to-orange-600/20 text-red-400 border border-red-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent'
              )}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-red-400' : 'text-slate-400 group-hover:text-white'}`} />
              {!isCollapsed && (
                <>
                  <span className="font-medium">{item.name}</span>
                  {item.badge && (
                    <span className={`ml-auto px-2 py-1 text-xs font-bold rounded-full ${
                      active ? 'bg-red-500 text-white' : 'bg-slate-600 text-slate-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.name}
                  {item.badge && (
                    <span className="ml-2 px-1 py-0.5 bg-red-500 text-white text-xs rounded">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* System Status in Sidebar */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-700">
          <div className="bg-slate-800 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-medium text-white mb-3">System Status</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Server Load</span>
                <span className="text-xs text-green-400 font-bold">23%</span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-1">
                <div className="bg-green-400 h-1 rounded-full" style={{ width: '23%' }}></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Response Time</span>
                <span className="text-xs text-green-400 font-bold">45ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Uptime</span>
                <span className="text-xs text-green-400 font-bold">99.98%</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Admin Info & Logout */}
      <div className="p-4 border-t border-slate-700">
        {!isCollapsed ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-slate-800 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {adminUser?.firstName?.charAt(0)}{adminUser?.lastName?.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {adminUser?.firstName} {adminUser?.lastName}
                </p>
                <p className="text-xs text-red-400 truncate">{adminUser?.role.name}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="text-xs">
                <Settings className="w-3 h-3 mr-1" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={adminLogout} className="text-xs">
                <LogOut className="w-3 h-3 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <button className="w-full p-2 rounded-lg hover:bg-slate-800 transition-colors group">
              <Settings className="w-5 h-5 text-slate-400 group-hover:text-white mx-auto" />
            </button>
            <button 
              onClick={adminLogout}
              className="w-full p-2 rounded-lg hover:bg-slate-800 transition-colors group"
            >
              <LogOut className="w-5 h-5 text-slate-400 group-hover:text-white mx-auto" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}