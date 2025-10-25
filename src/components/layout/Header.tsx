import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, Wallet, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

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
    { name: 'Contact', href: 'mailto:support@spinzos.com', external: true },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-50">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="https://res.cloudinary.com/dy9zlgjh6/image/upload/v1761390123/Gemini_Generated_Image_7764vh7764vh7764_hhd94q.png" 
              alt="Spinzos Logo" 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg"
            />
            <span className="text-xl sm:text-2xl font-bold text-white">Spinzos</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            {navigation.map((item) => (
              item.external ? (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium transition-colors duration-200 text-slate-300 hover:text-white"
                >
                  {item.name}
                </a>
              ) : (
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
              )
            ))}
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
                <Button variant="ghost" size="sm" onClick={() => logout()}>
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
                item.external ? (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-sm font-medium transition-colors duration-200 text-slate-300 hover:text-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                ) : (
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
                )
              ))}
              
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
                  <Button variant="ghost" size="sm" onClick={() => logout()} className="w-full justify-start">
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