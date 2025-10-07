import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, Wallet, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { cn, formatCurrency } from '../../lib/utils';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Sports', href: '/sports' },
    { name: 'Casino', href: '/casino' },
    { name: 'Live', href: '/live' },
    { name: 'Promotions', href: '/promotions' },
    { name: 'Support', href: '/support' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-50">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm sm:text-lg">E</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-white">Elite Bet</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'text-sm font-medium transition-colors duration-200',
                  isActive(item.href)
                    ? 'text-blue-400'
                    : 'text-slate-300 hover:text-white'
                )}
              >
                {item.name}
              </Link>
            ))}
            <Link
              to="/admin/login"
              className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors duration-200"
            >
              Admin
            </Link>
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {isAuthenticated && user ? (
              <>
                <Link to="/wallet">
                  <Button variant="outline" size="sm" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                    <Wallet className="w-4 h-4" />
                    <span className="hidden sm:inline">{(user.balance || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                    <span className="sm:hidden">${Math.floor(user.balance || 0)}</span>
                  </Button>
                </Link>
                <Link to="/account">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                    <User className="w-4 h-4" />
                    <span className="hidden lg:inline">{user.firstName}</span>
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden text-slate-300 hover:text-white p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-800">
            <div className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'text-sm font-medium transition-colors duration-200',
                    isActive(item.href)
                      ? 'text-blue-400'
                      : 'text-slate-300 hover:text-white'
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              <Link
                to="/admin/login"
                className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Admin
              </Link>
              
              {isAuthenticated && user ? (
                <div className="flex flex-col space-y-2 pt-4 border-t border-slate-800">
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <User className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link to="/account" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <User className="w-4 h-4 mr-2" />
                      Account
                    </Button>
                  </Link>
                  <Link to="/wallet" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Wallet className="w-4 h-4 mr-2" />
                      Wallet ({(user.balance || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })})
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2 pt-4 border-t border-slate-800">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full">Login</Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="primary" size="sm" className="w-full">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}