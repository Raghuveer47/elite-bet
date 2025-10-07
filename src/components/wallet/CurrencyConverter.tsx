import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, RefreshCw, TrendingUp } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { useWallet } from '../../contexts/WalletContext';
import { formatCurrency } from '../../lib/utils';

export function CurrencyConverter() {
  const { accounts, transferFunds, isLoading } = useWallet();
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [amount, setAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState(1.1);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
    { code: 'BTC', name: 'Bitcoin', symbol: '₿', flag: '₿' },
    { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', flag: 'Ξ' }
  ];

  // Mock exchange rates
  const exchangeRates: Record<string, Record<string, number>> = {
    USD: { EUR: 0.92, GBP: 0.79, BTC: 0.000023, ETH: 0.00031 },
    EUR: { USD: 1.09, GBP: 0.86, BTC: 0.000025, ETH: 0.00034 },
    GBP: { USD: 1.27, EUR: 1.16, BTC: 0.000029, ETH: 0.00039 },
    BTC: { USD: 43500, EUR: 39900, GBP: 34500, ETH: 13.5 },
    ETH: { USD: 3200, EUR: 2940, GBP: 2520, BTC: 0.074 }
  };

  useEffect(() => {
    // Update exchange rate when currencies change
    const rate = exchangeRates[fromCurrency]?.[toCurrency] || 1;
    setExchangeRate(rate);
    setLastUpdated(new Date());
  }, [fromCurrency, toCurrency]);

  const fromAccount = accounts.find(acc => acc.currency === fromCurrency && acc.accountType === 'main');
  const toAccount = accounts.find(acc => acc.currency === toCurrency && acc.accountType === 'main');
  
  const amountValue = parseFloat(amount) || 0;
  const convertedAmount = amountValue * exchangeRate;
  const fromBalance = fromAccount?.balance || 0;
  const toBalance = toAccount?.balance || 0;

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amountValue <= 0) return;

    try {
      await transferFunds(fromCurrency, toCurrency, amountValue);
      toast.success(`Successfully converted ${formatCurrency(amountValue)} ${fromCurrency} to ${toCurrency}`);
      setAmount('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transfer failed';
      toast.error(errorMessage);
    }
  };

  const refreshRates = () => {
    // Simulate rate refresh
    const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
    const newRate = exchangeRate * (1 + variation);
    setExchangeRate(newRate);
    setLastUpdated(new Date());
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <ArrowRightLeft className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-semibold">Currency Converter</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={refreshRates}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Rates
        </Button>
      </div>

      {/* Current Balances */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-700 rounded-lg p-4">
          <p className="text-slate-400 text-sm">From Balance</p>
          <p className="text-lg font-bold text-green-400">{formatCurrency(fromBalance)} {fromCurrency}</p>
        </div>
        <div className="bg-slate-700 rounded-lg p-4">
          <p className="text-slate-400 text-sm">To Balance</p>
          <p className="text-lg font-bold text-blue-400">{formatCurrency(toBalance)} {toCurrency}</p>
        </div>
      </div>

      {/* Exchange Rate */}
      <div className="bg-slate-700 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">Exchange Rate</p>
            <p className="text-lg font-bold">
              1 {fromCurrency} = {exchangeRate.toFixed(fromCurrency.includes('BTC') || fromCurrency.includes('ETH') ? 2 : 4)} {toCurrency}
            </p>
          </div>
          <div className="text-right">
            <TrendingUp className="w-5 h-5 text-green-400 mx-auto" />
            <p className="text-xs text-slate-400">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleTransfer} className="space-y-6">
        {/* From Currency */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">From</label>
          <div className="grid grid-cols-2 gap-4">
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.flag} {currency.code} - {currency.name}
                </option>
              ))}
            </select>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              min="0"
              max={fromBalance}
              step="0.01"
              disabled={isLoading}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Available: {formatCurrency(fromBalance)} {fromCurrency}
          </p>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={handleSwapCurrencies}
            disabled={isLoading}
          >
            <ArrowRightLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* To Currency */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">To</label>
          <div className="grid grid-cols-2 gap-4">
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              {currencies.filter(c => c.code !== fromCurrency).map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.flag} {currency.code} - {currency.name}
                </option>
              ))}
            </select>
            <div className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 flex items-center">
              {convertedAmount.toFixed(toCurrency.includes('BTC') || toCurrency.includes('ETH') ? 6 : 2)}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Current balance: {formatCurrency(toBalance)} {toCurrency}
          </p>
        </div>

        {/* Conversion Summary */}
        {amountValue > 0 && (
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="font-medium mb-3">Conversion Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">You Send:</span>
                <span>{formatCurrency(amountValue)} {fromCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Exchange Rate:</span>
                <span>1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}</span>
              </div>
              <div className="flex justify-between border-t border-slate-600 pt-2">
                <span className="font-medium">You Receive:</span>
                <span className="font-bold text-green-400">
                  {convertedAmount.toFixed(toCurrency.includes('BTC') || toCurrency.includes('ETH') ? 6 : 2)} {toCurrency}
                </span>
              </div>
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={
            isLoading || 
            !amount || 
            amountValue <= 0 || 
            amountValue > fromBalance ||
            fromCurrency === toCurrency
          }
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <LoadingSpinner size="sm" />
              <span>Converting...</span>
            </div>
          ) : (
            `Convert ${amountValue > 0 ? formatCurrency(amountValue) : 'Funds'}`
          )}
        </Button>
      </form>
    </div>
  );
}