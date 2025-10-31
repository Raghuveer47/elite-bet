import React, { useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, Activity, AlertTriangle, Shield, RefreshCw, Trophy } from 'lucide-react';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';
import { useWallet } from '../../contexts/SupabaseWalletContext';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { formatCurrency } from '../../lib/utils';

export function WalletOverview() {
  const { user, isAuthenticated } = useAuth();
  const { accounts, stats, limits, refreshWallet, isLoading, getBalance, getAvailableBalance } = useWallet();

  // Always refresh wallet on page mount
  useEffect(() => {
    refreshWallet();
    // Also refresh whenever a bet/win updates wallet
    const onWalletUpdated = () => refreshWallet();
    window.addEventListener('wallet_updated', onWalletUpdated);
    return () => window.removeEventListener('wallet_updated', onWalletUpdated);
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <div className="text-center py-12">
        <Wallet className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400 mb-4">Please login to view your wallet</p>
        <Link to="/login">
          <Button>Login</Button>
        </Link>
      </div>
    );
  }

  const currentBalance = getAvailableBalance(); // Use the same balance for consistency
  const availableBalance = getAvailableBalance();
  const mainAccount = accounts.find(acc => acc.accountType === 'main' && acc.currency === 'INR');
  const bonusAccount = accounts.find(acc => acc.accountType === 'bonus' && acc.currency === 'INR');

  const walletStats = [
    { 
      label: 'Total Balance', 
      value: formatCurrency(currentBalance), 
      icon: Wallet, 
      color: 'text-green-400',
      description: 'Your total account balance'
    },
    { 
      label: 'Available Balance', 
      value: formatCurrency(availableBalance), 
      icon: Activity, 
      color: 'text-blue-400',
      description: 'Available for betting and withdrawals'
    },
    { 
      label: 'Bonus Balance', 
      value: formatCurrency(bonusAccount?.balance || 0), 
      icon: TrendingUp, 
      color: 'text-purple-400',
      description: 'Promotional funds'
    },
    { 
      label: 'Pending Withdrawals', 
      value: formatCurrency(stats.pendingWithdrawals), 
      icon: TrendingDown, 
      color: 'text-yellow-400',
      description: 'Being processed'
    }
  ];

  const accountInfo = [
    { label: 'Account Status', value: user?.isVerified ? 'Verified' : 'Unverified', verified: user?.isVerified },
    { label: 'Currency', value: user?.currency || 'INR' },
    { label: 'Member Since', value: new Date().toLocaleDateString() },
    { label: 'Last Activity', value: 'Just now' }
  ];

  const todayActivity = [
    { label: 'Deposited Today', value: formatCurrency(stats.todayDeposited), color: 'text-green-400' },
    { label: 'Withdrawn Today', value: formatCurrency(stats.todayWithdrawn), color: 'text-red-400' },
    { label: 'Remaining Daily Deposit', value: formatCurrency(limits.dailyDepositLimit - stats.todayDeposited), color: 'text-blue-400' },
    { label: 'Remaining Daily Withdrawal', value: formatCurrency(limits.dailyWithdrawLimit - stats.todayWithdrawn), color: 'text-purple-400' }
  ];

  return (
    <div className="space-y-6">
      {/* Main Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {walletStats.map((stat, index) => (
          <div key={index} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
              <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
            </div>
            <p className="text-slate-300 font-medium text-sm">{stat.label}</p>
            <p className="text-slate-400 text-xs mt-1">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Account Information */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Account Information</h3>
            <Button variant="ghost" size="sm" onClick={refreshWallet} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="space-y-4">
            {accountInfo.map((info, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-slate-400">{info.label}:</span>
                <span className={`font-medium ${
                  'verified' in info 
                    ? info.verified ? 'text-green-400' : 'text-yellow-400'
                    : 'text-white'
                }`}>
                  {info.value}
                  {'verified' in info && !info.verified && (
                    <AlertTriangle className="w-4 h-4 inline ml-1" />
                  )}
                </span>
              </div>
            ))}
          </div>

          {!user?.isVerified && (
            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-400 mb-1">Account Verification Required</h4>
                  <p className="text-sm text-slate-300 mb-3">
                    Complete account verification to increase your limits and access all features.
                  </p>
                  <Button variant="outline" size="sm">
                    Verify Account
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold mb-6">Today's Activity</h3>
          <div className="space-y-4">
            {todayActivity.map((activity, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-slate-400">{activity.label}:</span>
                <span className={`font-medium ${activity.color}`}>{activity.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lifetime Statistics */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-semibold mb-6">Lifetime Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="text-center">
            <TrendingDown className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-400">{formatCurrency(stats.totalDeposited)}</p>
            <p className="text-slate-400 text-sm">Total Deposited</p>
          </div>
          <div className="text-center">
            <TrendingUp className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-400">{formatCurrency(stats.totalWithdrawn)}</p>
            <p className="text-slate-400 text-sm">Total Withdrawn</p>
          </div>
          <div className="text-center">
            <Activity className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-400">{formatCurrency(stats.totalWagered)}</p>
            <p className="text-slate-400 text-sm">Total Wagered</p>
          </div>
          <div className="text-center">
            <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-400">{formatCurrency(stats.totalWon)}</p>
            <p className="text-slate-400 text-sm">Total Won</p>
          </div>
          <div className="text-center">
            <Activity className="w-8 h-8 text-orange-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-400">{formatCurrency(stats.activeBets)}</p>
            <p className="text-slate-400 text-sm">Active Bets</p>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-lg text-slate-300">Net Profit: 
            <span className={`font-bold ml-2 ${stats.totalWon - stats.totalWagered >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(stats.totalWon - stats.totalWagered)}
            </span>
          </p>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-gradient-to-r from-blue-600/20 to-green-600/20 rounded-xl p-6 border border-blue-500/30">
        <div className="flex items-start space-x-3">
          <Shield className="w-6 h-6 text-blue-400 mt-1" />
          <div>
            <h3 className="text-lg font-semibold mb-2">Your Funds Are Protected</h3>
            <p className="text-sm text-slate-300 mb-4">
              Your funds are secured with industry-leading security measures and regulatory compliance.
            </p>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(currentBalance)}</p>
            <p className="text-sm text-blue-400">Available: {formatCurrency(availableBalance)}</p>
            <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
              <div>✓ SSL Encrypted</div>
              <div>✓ Segregated Accounts</div>
              <div>✓ Regulatory Compliant</div>
              <div>✓ Insured Funds</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}