import { useState, useMemo } from 'react';
import { History, Download, Search, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, Eye, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useWallet } from '../../contexts/SupabaseWalletContext';
import { Transaction } from '../../types/wallet';
import { formatCurrency, formatDate } from '../../lib/utils';

export function TransactionHistory() {
  const { transactions, isLoading, refreshWallet } = useWallet();
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

  // Calculate balance history
  const balanceHistory = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    // Calculate current balance from completed transactions
    let currentBalance = 0;
    sortedTransactions.forEach(transaction => {
      if (transaction.status === 'completed') {
        if (transaction.type === 'deposit' || transaction.type === 'win' || transaction.type === 'bonus') {
          currentBalance += transaction.amount;
        } else if (transaction.type === 'withdrawal' || transaction.type === 'bet') {
          currentBalance -= Math.abs(transaction.amount);
        }
      }
    });
    
    let runningBalance = currentBalance;
    const history = [];
    
    // Work backwards from current balance
    for (let i = sortedTransactions.length - 1; i >= 0; i--) {
      const transaction = sortedTransactions[i];
      history.unshift({
        ...transaction,
        balanceAfter: runningBalance
      });
      
      // Adjust balance based on transaction type and status
      if (transaction.status === 'completed') {
        if (transaction.type === 'deposit' || transaction.type === 'win' || transaction.type === 'bonus') {
          runningBalance -= transaction.amount;
        } else if (transaction.type === 'withdrawal' || transaction.type === 'bet') {
          runningBalance += Math.abs(transaction.amount);
        }
      }
    }
    
    return history;
  }, [transactions]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { 
        color: 'text-green-400 bg-green-400/10 border-green-400/20', 
        icon: CheckCircle, 
        label: 'Completed',
        bgColor: 'bg-green-500/10'
      },
      pending: { 
        color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', 
        icon: Clock, 
        label: 'Pending Review',
        bgColor: 'bg-yellow-500/10'
      },
      processing: { 
        color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', 
        icon: Clock, 
        label: 'Processing',
        bgColor: 'bg-blue-500/10'
      },
      failed: { 
        color: 'text-red-400 bg-red-400/10 border-red-400/20', 
        icon: XCircle, 
        label: 'Failed',
        bgColor: 'bg-red-500/10'
      },
      cancelled: { 
        color: 'text-slate-400 bg-slate-400/10 border-slate-400/20', 
        icon: XCircle, 
        label: 'Cancelled',
        bgColor: 'bg-slate-500/10'
      },
      approved: { 
        color: 'text-green-400 bg-green-400/10 border-green-400/20', 
        icon: CheckCircle, 
        label: 'Approved',
        bgColor: 'bg-green-500/10'
      },
      rejected: { 
        color: 'text-red-400 bg-red-400/10 border-red-400/20', 
        icon: XCircle, 
        label: 'Rejected',
        bgColor: 'bg-red-500/10'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-3 h-3" />
        <span className="capitalize">{config.label}</span>
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

  const filteredTransactions = filterTransactions(balanceHistory);

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
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshWallet}
              disabled={isLoading}
            >
              <History className="w-4 h-4 mr-2" />
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button variant="outline" size="sm" onClick={exportTransactions}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
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

      {/* Balance Summary */}
      <div className="p-6 border-b border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm font-medium">Current Balance</p>
                <p className="text-white text-2xl font-bold">{formatCurrency(
                  filteredTransactions
                    .filter(t => t.status === 'completed')
                    .reduce((sum, t) => {
                      if (t.type === 'deposit' || t.type === 'win' || t.type === 'bonus') {
                        return sum + t.amount;
                      } else if (t.type === 'withdrawal' || t.type === 'bet') {
                        return sum - Math.abs(t.amount);
                      }
                      return sum;
                    }, 0)
                )}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm font-medium">Total Deposits</p>
                <p className="text-white text-xl font-semibold">
                  {formatCurrency(
                    filteredTransactions
                      .filter(t => t.type === 'deposit' && t.status === 'completed')
                      .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm font-medium">Total Winnings</p>
                <p className="text-white text-xl font-semibold">
                  {formatCurrency(
                    filteredTransactions
                      .filter(t => t.type === 'win' && t.status === 'completed')
                      .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-400 text-sm font-medium">Total Bets</p>
                <p className="text-white text-xl font-semibold">
                  {formatCurrency(
                    filteredTransactions
                      .filter(t => t.type === 'bet' && t.status === 'completed')
                      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
                  )}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="p-6">
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
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div 
                key={transaction.id} 
                className={`bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-200 ${
                  transaction.status === 'pending' ? 'ring-2 ring-yellow-500/20' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${
                      transaction.type === 'deposit' || transaction.type === 'win' || transaction.type === 'bonus' 
                        ? 'bg-green-500/10 text-green-400' 
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {getTransactionIcon(transaction.type, transaction.status)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-white capitalize">{transaction.type}</h4>
                        {getStatusBadge(transaction.status)}
                      </div>
                      
                      <p className="text-slate-300 mb-3">{transaction.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Amount</p>
                          <p className={`font-semibold ${
                            transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-slate-400">Balance After</p>
                          <p className="text-white font-semibold">{formatCurrency(transaction.balanceAfter || 0)}</p>
                        </div>
                        
                        <div>
                          <p className="text-slate-400">Method</p>
                          <p className="text-slate-300 capitalize">{transaction.method}</p>
                        </div>
                        
                        <div>
                          <p className="text-slate-400">Date</p>
                          <p className="text-slate-300">{formatDate(new Date(transaction.createdAt))}</p>
                        </div>
                      </div>
                      
                      {/* Additional Details */}
                      {(transaction.metadata?.gameId || transaction.metadata?.betId || transaction.metadata?.multiplier) && (
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <div className="flex flex-wrap gap-4 text-xs">
                            {transaction.metadata?.gameId && (
                              <span className="text-slate-400">Game: <span className="text-slate-300">{transaction.metadata.gameId}</span></span>
                            )}
                            {transaction.metadata?.betId && (
                              <span className="text-slate-400">Bet ID: <span className="text-slate-300">{transaction.metadata.betId.slice(-8)}</span></span>
                            )}
                            {transaction.metadata?.multiplier && (
                              <span className="text-slate-400">Multiplier: <span className="text-yellow-400">{transaction.metadata.multiplier.toFixed(2)}x</span></span>
                            )}
                            {transaction.metadata?.profit !== undefined && (
                              <span className={`font-medium ${transaction.metadata.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                Profit: {formatCurrency(transaction.metadata.profit)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Payment Proof */}
                      {transaction.metadata?.paymentProofUrl && (
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedImage(transaction.metadata?.paymentProofUrl || '');
                              setShowImageModal(true);
                            }}
                            className="text-xs"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View Payment Proof
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{transaction.currency}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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