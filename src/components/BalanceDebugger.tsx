import React from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useWallet } from '../contexts/SupabaseWalletContext';

export function BalanceDebugger() {
  const { user } = useAuth();
  const { getBalance, getAvailableBalance, validateBalance, accounts } = useWallet();

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 m-4">
      <h3 className="text-white font-bold mb-4">Balance Debug Info</h3>
      
      <div className="space-y-2 text-sm">
        <div className="text-slate-300">
          <strong>User Balance:</strong> ${user?.balance || 'undefined'}
        </div>
        
        <div className="text-slate-300">
          <strong>Wallet getBalance():</strong> ${getBalance()}
        </div>
        
        <div className="text-slate-300">
          <strong>getAvailableBalance():</strong> ${getAvailableBalance()}
        </div>
        
        <div className="text-slate-300">
          <strong>Can bet $10:</strong> {validateBalance(10) ? '✅ Yes' : '❌ No'}
        </div>
        
        <div className="text-slate-300">
          <strong>Can bet $50:</strong> {validateBalance(50) ? '✅ Yes' : '❌ No'}
        </div>
        
        <div className="text-slate-300">
          <strong>Can bet $100:</strong> {validateBalance(100) ? '✅ Yes' : '❌ No'}
        </div>
        
        <div className="text-slate-300">
          <strong>Accounts Count:</strong> {accounts.length}
        </div>
        
        {accounts.map((account, index) => (
          <div key={index} className="text-slate-300 ml-4">
            <strong>Account {index + 1}:</strong> {account.currency} - ${account.balance}
          </div>
        ))}
      </div>
    </div>
  );
}
