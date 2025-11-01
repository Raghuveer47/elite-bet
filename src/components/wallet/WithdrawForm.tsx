import React, { useState } from 'react';
import { ArrowUpRight, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { useWallet } from '../../contexts/SupabaseWalletContext';
import { formatCurrency } from '../../lib/utils';

export function WithdrawForm() {
  const { limits, stats, submitManualWithdraw, getBalance, getAvailableBalance, isLoading, error } = useWallet();
  const [amount, setAmount] = useState('');
  
  // Bank details fields
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');
  
  const [success, setSuccess] = useState<string | null>(null);

  const currentBalance = getBalance('USD');
  const availableBalance = getAvailableBalance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!amount) {
      toast.error('Please enter withdrawal amount');
      return;
    }
    
    if (!accountHolderName.trim()) {
      toast.error('Please enter account holder name');
      return;
    }
    
    if (!bankAccountNumber.trim()) {
      toast.error('Please enter bank account number');
      return;
    }
    
    if (!ifscCode.trim()) {
      toast.error('Please enter IFSC code');
      return;
    }
    
    if (!upiId.trim()) {
      toast.error('Please enter UPI ID');
      return;
    }

    const amountValue = parseFloat(amount);
    
    // Enhanced validation
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (amountValue < limits.minWithdraw || amountValue > availableBalance) {
      toast.error(`Amount must be between ${formatCurrency(limits.minWithdraw)} and ${formatCurrency(availableBalance)}`);
      return;
    }

    // Check daily limits
    const todayWithdrawals = stats.todayWithdrawn;
    if (todayWithdrawals + amountValue > limits.dailyWithdrawLimit) {
      toast.error(`Daily withdrawal limit of ${formatCurrency(limits.dailyWithdrawLimit)} would be exceeded`);
      return;
    }
    
    try {
      setSuccess(null);
      await submitManualWithdraw({
        amount: parseFloat(amount),
        currency: 'INR',
        method: 'bank_transfer',
        destination: `${accountHolderName} - ${bankAccountNumber}`,
        metadata: {
          bankDetails: {
            accountHolderName,
            bankAccountNumber,
            ifscCode,
            upiId
          }
        }
      });
      
      setSuccess('Withdrawal request submitted successfully! Funds have been reserved and admin will process your request within 24-48 hours.');
      toast.success('Withdrawal submitted for verification!');
      
      // Reset form
      setAmount('');
      setAccountHolderName('');
      setBankAccountNumber('');
      setIfscCode('');
      setUpiId('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Withdrawal submission failed';
      toast.error(errorMessage);
    }
  };

  const amountValue = parseFloat(amount) || 0;

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center space-x-2 mb-6">
        <ArrowUpRight className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-semibold">Withdraw Funds</h3>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-400">{success}</p>
          </div>
        </div>
      )}

      {/* Balance Info */}
      <div className="bg-slate-700 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-400">Total Balance:</span>
            <span className="float-right font-medium">{formatCurrency(currentBalance)}</span>
          </div>
          <div>
            <span className="text-slate-400">Active Bets:</span>
            <span className="float-right font-medium text-yellow-400">{formatCurrency(stats.activeBets)}</span>
          </div>
          <div className="col-span-2 border-t border-slate-600 pt-2">
            <span className="text-slate-400">Available for Withdrawal:</span>
            <span className="float-right font-bold text-green-400">{formatCurrency(availableBalance)}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Withdrawal Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          min={limits.minWithdraw}
          max={availableBalance}
          step="0.01"
          disabled={isLoading}
        />

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-slate-300">Bank Account Details</h4>
          
          <Input
            label="Account Holder Name"
            value={accountHolderName}
            onChange={(e) => setAccountHolderName(e.target.value)}
            placeholder="Enter full name as per bank account"
            disabled={isLoading}
            required
          />

          <Input
            label="Bank Account Number"
            value={bankAccountNumber}
            onChange={(e) => setBankAccountNumber(e.target.value)}
            placeholder="Enter your bank account number"
            disabled={isLoading}
            required
          />

          <Input
            label="IFSC Code"
            value={ifscCode}
            onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
            placeholder="Enter IFSC code (e.g., SBIN0001234)"
            disabled={isLoading}
            required
          />

          <Input
            label="UPI ID"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="Enter UPI ID (e.g., yourname@paytm)"
            disabled={isLoading}
            required
          />
        </div>

        <Button
          type="submit"
          variant="secondary"
          className="w-full"
          disabled={
            isLoading || 
            !amount ||
            !accountHolderName.trim() ||
            !bankAccountNumber.trim() ||
            !ifscCode.trim() ||
            !upiId.trim() ||
            amountValue < limits.minWithdraw || 
            amountValue > availableBalance
          }
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <LoadingSpinner size="sm" />
              <span>Submitting...</span>
            </div>
          ) : (
            'Submit Withdrawal Request'
          )}
        </Button>
      </form>

      {/* Security Notice */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-6">
        <div className="flex items-start space-x-2">
          <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-400 mb-1">Admin Processing</h4>
            <p className="text-sm text-slate-300">
              Your withdrawal request will be reviewed by our admin team. Once approved, 
              admin will upload payment proof which you can view in your transaction history.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
        <h4 className="font-medium mb-2">Withdrawal Limits</h4>
        <div className="grid grid-cols-2 gap-4 text-sm text-slate-400">
          <div>
            <span>Daily Limit:</span>
            <span className="float-right">{formatCurrency(limits.dailyWithdrawLimit)}</span>
          </div>
          <div>
            <span>Monthly Limit:</span>
            <span className="float-right">{formatCurrency(limits.monthlyWithdrawLimit)}</span>
          </div>
          <div>
            <span>Min Withdrawal:</span>
            <span className="float-right">{formatCurrency(limits.minWithdraw)}</span>
          </div>
          <div>
            <span>Max Withdrawal:</span>
            <span className="float-right">{formatCurrency(limits.maxWithdraw)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}