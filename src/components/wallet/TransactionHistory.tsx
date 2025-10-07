import React, { useState } from 'react';
import { History, Filter, Download, Search, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useWallet } from '../../contexts/WalletContext';
import { Transaction } from '../../types/wallet';
import { formatCurrency, formatDate } from '../../lib/utils';

export function TransactionHistory() {
  const { transactions, isLoading } = useWallet();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const filterOptions = [
    { value: 'all', label: 'All Transactions' },
    { value: 'deposit', label: 'Deposits' },
    { value: 'withdraw', label: 'Withdrawals' },
    { value: 'bet', label: 'Bets' },
    { value: 'win', label: 'Winnings' },
    { value: 'bonus', label: 'Bonuses' }
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' }
  ];

  const getTransactionIcon = (type: string, status: string) => {
    if (status === 'failed') return <XCircle className="w-5 h-5 text-red-400" />;
    if (status === 'pending') return <Clock className="w-5 h-5 text-yellow-400" />;
    
    switch (type) {
      case 'deposit':
      case 'win':
      case 'bonus':
        return <ArrowDownLeft className="w-5 h-5 text-green-400" />;
      case 'withdraw':
      case 'bet':
        return <ArrowUpRight className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { color: 'text-green-400 bg-green-400/10', icon: CheckCircle },
      pending: { color: 'text-yellow-400 bg-yellow-400/10', icon: Clock },
      processing: { color: 'text-blue-400 bg-blue-400/10', icon: Clock },
      failed: { color: 'text-red-400 bg-red-400/10', icon: XCircle },
      cancelled: { color: 'text-slate-400 bg-slate-400/10', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        <span className="capitalize">{status}</span>
      </div>
    );
  };

  const filterTransactions = (transactions: Transaction[]): Transaction[] => {
    return transactions.filter(transaction => {
      // Type filter
      if (filter !== 'all' && transaction.type !== filter) return false;
      
      // Search filter
      if (searchTerm && !transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !transaction.method.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Date range filter
      if (dateRange !== 'all') {
        const transactionDate = new Date(transaction.createdAt);
        const now = new Date();
        
        switch (dateRange) {
          case 'today':
            if (transactionDate.toDateString() !== now.toDateString()) return false;
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (transactionDate < weekAgo) return false;
            break;
          case 'month':
            if (transactionDate.getMonth() !== now.getMonth() || 
                transactionDate.getFullYear() !== now.getFullYear()) return false;
            break;
          case 'quarter':
            const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
            if (transactionDate < quarterStart) return false;
            break;
        }
      }
      
      return true;
    });
  };

  const filteredTransactions = filterTransactions(transactions);

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Type', 'Amount', 'Currency', 'Fee', 'Method', 'Status', 'Description'].join(','),
      ...filteredTransactions.map(t => [
        formatDate(new Date(t.createdAt)),
        t.type,
        t.amount,
        t.currency,
        t.fee,
        t.method,
        t.status,
        `"${t.description}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <History className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold">Transaction History</h3>
          </div>
          <Button variant="outline" size="sm" onClick={exportTransactions}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {filterOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {dateRangeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transaction List */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No transactions found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Fee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getTransactionIcon(transaction.type, transaction.status)}
                      <div>
                        <span className="text-sm font-medium text-white capitalize">{transaction.type}</span>
                        {transaction.metadata?.gameId && (
                          <div className="text-xs text-slate-400">Game: {transaction.metadata.gameId}</div>
                        )}
                        {transaction.metadata?.betId && (
                          <div className="text-xs text-slate-400">Bet ID: {transaction.metadata.betId.slice(-8)}</div>
                        )}
                      </div>
                      {transaction.metadata?.paymentProofUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedImage(transaction.metadata.paymentProofUrl);
                            setShowImageModal(true);
                          }}
                          className="text-xs"
                        >
                          View Proof
                        </Button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                    </div>
                    <div className="text-xs text-slate-400">{transaction.currency}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-300">
                      {transaction.fee > 0 ? formatCurrency(transaction.fee) : 'Free'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-300">{transaction.method}</div>
                    {transaction.provider && (
                      <div className="text-xs text-slate-400">{transaction.provider}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(transaction.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-300">{formatDate(new Date(transaction.createdAt))}</div>
                    {transaction.completedAt && (
                      <div className="text-xs text-slate-400">
                        Completed: {formatDate(new Date(transaction.completedAt))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-300 max-w-xs truncate">{transaction.description}</div>
                    {transaction.externalReference && (
                      <div className="text-xs text-slate-400">Ref: {transaction.externalReference}</div>
                    )}
                    {transaction.metadata?.profit !== undefined && (
                      <div className={`text-xs font-medium ${transaction.metadata.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        Profit: {formatCurrency(transaction.metadata.profit)}
                      </div>
                    )}
                    {transaction.metadata?.multiplier && (
                      <div className="text-xs text-yellow-400">
                        Multiplier: {transaction.metadata.multiplier.toFixed(2)}x
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Image Modal for Payment Proof */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Payment Proof</h3>
              <Button variant="ghost" onClick={() => setShowImageModal(false)}>
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            <div className="text-center">
              <img 
                src={selectedImage} 
                alt="Payment Proof" 
                className="max-w-full max-h-[70vh] rounded-lg border border-slate-600"
                onError={(e) => {
                  console.error('Failed to load image:', selectedImage);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {filteredTransactions.length > 0 && (
        <div className="p-6 border-t border-slate-700 bg-slate-700/30">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="text-center">
              <p className="text-slate-400">Total Transactions</p>
              <p className="text-lg font-bold text-white">{filteredTransactions.length}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-400">Total In</p>
              <p className="text-lg font-bold text-green-400">
                {formatCurrency(
                  filteredTransactions
                    .filter(t => t.amount > 0 && t.status === 'completed')
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
            </div>
            <div className="text-center">
              <p className="text-slate-400">Total Out</p>
              <p className="text-lg font-bold text-red-400">
                {formatCurrency(
                  Math.abs(filteredTransactions
                    .filter(t => t.amount < 0 && t.status === 'completed')
                    .reduce((sum, t) => sum + t.amount, 0))
                )}
              </p>
            </div>
            <div className="text-center">
              <p className="text-slate-400">Total Fees</p>
              <p className="text-lg font-bold text-yellow-400">
                {formatCurrency(
                  filteredTransactions
                    .filter(t => t.status === 'completed')
                    .reduce((sum, t) => sum + t.fee, 0)
                )}
              </p>
            </div>
            <div className="text-center">
              <p className="text-slate-400">Net Result</p>
              <p className={`text-lg font-bold ${
                filteredTransactions
                  .filter(t => t.status === 'completed')
                  .reduce((sum, t) => sum + t.amount, 0) >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {formatCurrency(filteredTransactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0))}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}