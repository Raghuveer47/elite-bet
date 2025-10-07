import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Shield, Menu, X, User, LogOut, Bell, Settings,
  Users, DollarSign, Gamepad2, AlertTriangle, BarChart3, Gift, MessageCircle
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

export function AdminHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { adminUser, adminLogout } = useAdmin();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3 },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Financial', href: '/admin/financial', icon: DollarSign },
    { name: 'Games', href: '/admin/games', icon: Gamepad2 },
    { name: 'Risk', href: '/admin/risk', icon: AlertTriangle },
    { name: 'KYC', href: '/admin/kyc', icon: Shield },
    { name: 'Promotions', href: '/admin/promotions', icon: Gift },
    { name: 'Support', href: '/admin/support', icon: MessageCircle },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-slate-900/95 backdrop-blur-sm border-b border-red-800/50 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/admin/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white">Elite Bet</span>
              <span className="text-xs text-red-400 block leading-none">ADMIN</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                    isActive(item.href)
                      ? 'text-red-400 bg-red-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Admin Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {adminUser?.firstName} {adminUser?.lastName}
                </p>
                <p className="text-xs text-red-400">{adminUser?.role.name}</p>
              </div>
              
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
            
            <Button variant="ghost" size="sm" onClick={adminLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-slate-300 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800">
            <div className="flex flex-col space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                      isActive(item.href)
                        ? 'text-red-400 bg-red-500/10'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              <div className="flex flex-col space-y-2 pt-4 border-t border-slate-800">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-white">
                    {adminUser?.firstName} {adminUser?.lastName}
                  </p>
                  <p className="text-xs text-red-400">{adminUser?.role.name}</p>
                </div>
                
                <Button variant="ghost" size="sm" onClick={adminLogout} className="w-full justify-start">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}