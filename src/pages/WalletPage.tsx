import React, { useState } from 'react';
import { Wallet, ArrowDownLeft, ArrowUpRight, History, ArrowRightLeft, Settings } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { WalletProvider } from '../contexts/WalletContext';
import { WalletOverview } from '../components/wallet/WalletOverview';
import { DepositForm } from '../components/wallet/DepositForm';
import { WithdrawForm } from '../components/wallet/WithdrawForm';
import { TransactionHistory } from '../components/wallet/TransactionHistory';
import { CurrencyConverter } from '../components/wallet/CurrencyConverter';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

function WalletPageContent() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Wallet },
    { id: 'deposit', name: 'Deposit', icon: ArrowDownLeft },
    { id: 'withdraw', name: 'Withdraw', icon: ArrowUpRight },
    { id: 'history', name: 'History', icon: History },
    { id: 'convert', name: 'Convert', icon: ArrowRightLeft },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <WalletOverview />;
      case 'deposit':
        return <DepositForm />;
      case 'withdraw':
        return <WithdrawForm />;
      case 'history':
        return <TransactionHistory />;
      case 'convert':
        return <CurrencyConverter />;
      case 'settings':
        return <WalletSettings />;
      default:
        return <WalletOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Wallet</h1>
          <p className="text-slate-400">Manage your funds, view transactions, and control your account</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 bg-slate-800 rounded-lg p-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

function WalletSettings() {
  const [autoConvert, setAutoConvert] = useState(false);
  const [notifications, setNotifications] = useState({
    deposits: true,
    withdrawals: true,
    lowBalance: true,
    promotions: false
  });

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-semibold mb-6">Wallet Settings</h3>
        
        <div className="space-y-6">
          {/* Auto Convert */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Auto Currency Conversion</h4>
              <p className="text-sm text-slate-400">Automatically convert winnings to your preferred currency</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoConvert}
                onChange={(e) => setAutoConvert(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Notifications */}
          <div>
            <h4 className="font-medium mb-4">Notification Preferences</h4>
            <div className="space-y-4">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                    <p className="text-sm text-slate-400">
                      {key === 'deposits' && 'Get notified when deposits are completed'}
                      {key === 'withdrawals' && 'Get notified about withdrawal status updates'}
                      {key === 'lowBalance' && 'Alert when balance falls below $50'}
                      {key === 'promotions' && 'Receive promotional offers and bonuses'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Responsible Gaming Limits */}
          <div>
            <h4 className="font-medium mb-4">Responsible Gaming Limits</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Daily Deposit Limit" type="number" placeholder="5000" />
              <Input label="Daily Loss Limit" type="number" placeholder="1000" />
              <Input label="Session Time Limit (minutes)" type="number" placeholder="180" />
              <Input label="Single Bet Limit" type="number" placeholder="500" />
            </div>
            <Button variant="outline" className="mt-4">
              Update Limits
            </Button>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-semibold mb-6">Security Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
            <div>
              <h4 className="font-medium">Two-Factor Authentication</h4>
              <p className="text-sm text-slate-400">Add an extra layer of security to your account</p>
            </div>
            <Button variant="outline" size="sm">
              Enable 2FA
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
            <div>
              <h4 className="font-medium">Withdrawal PIN</h4>
              <p className="text-sm text-slate-400">Require PIN for all withdrawal requests</p>
            </div>
            <Button variant="outline" size="sm">
              Set PIN
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
            <div>
              <h4 className="font-medium">Login Notifications</h4>
              <p className="text-sm text-slate-400">Get notified of new login attempts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WalletPage() {
  return (
    <WalletProvider>
      <WalletPageContent />
    </WalletProvider>
  );
}