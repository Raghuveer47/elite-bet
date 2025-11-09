import React, { useState, useMemo } from 'react';
import {
  Gamepad2, Search, Filter, Download, TrendingUp, TrendingDown,
  Calendar, User, DollarSign, Trophy, AlertCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAdmin } from '../../contexts/SupabaseAdminContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface GameTransaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  gameName: string;
  gameType: string;
  transactionType: 'bet' | 'win' | 'loss';
  amount: number;
  balance: number;
  status: string;
  metadata?: any;
  timestamp: Date;
}

export function GameTransactions() {
  const { transactions, users } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGame, setFilterGame] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Transform wallet transactions into game transactions
  const gameTransactions: GameTransaction[] = useMemo(() => {
    // Filter for bet and win transactions only
    const gameTransactionsList = transactions
      .filter(t => t.type === 'bet' || t.type === 'win')
      .map(t => {
        // Look up user information
        const user = users.find(u => u.id === t.userId);
        const userName = user ? `${user.firstName} ${user.lastName}`.trim() : null;
        
        // Get game name from metadata or method field
        const gameName = t.metadata?.gameName || t.method || 'Unknown Game';
        
        return {
          id: t.id,
          userId: t.userId || '',
          userName: userName || 'Unknown User',
          userEmail: user?.email || 'N/A',
          gameName: gameName,
          gameType: t.metadata?.gameType || 'casino',
          transactionType: t.type as 'bet' | 'win',
          amount: Math.abs(t.amount),
          balance: t.balanceAfter || 0,
          status: t.status,
          metadata: t.metadata,
          timestamp: new Date(t.createdAt)
        };
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    console.log('GameTransactions: Filtered', gameTransactionsList.length, 'game transactions from', transactions.length, 'total transactions');
    console.log('GameTransactions: Users loaded:', users.length);
    
    return gameTransactionsList;
  }, [transactions, users]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return gameTransactions.filter(transaction => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' || 
        transaction.userName.toLowerCase().includes(searchLower) ||
        transaction.userEmail.toLowerCase().includes(searchLower) ||
        transaction.gameName.toLowerCase().includes(searchLower) ||
        transaction.id.toLowerCase().includes(searchLower);

      // Game filter
      const matchesGame = filterGame === 'all' || transaction.gameName.toLowerCase().includes(filterGame.toLowerCase());

      // Type filter
      const matchesType = filterType === 'all' || transaction.transactionType === filterType;

      // Date filter
      const now = new Date();
      const transactionDate = transaction.timestamp;
      let matchesDate = true;
      
      if (filterDate === 'today') {
        matchesDate = transactionDate.toDateString() === now.toDateString();
      } else if (filterDate === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = transactionDate >= weekAgo;
      } else if (filterDate === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = transactionDate >= monthAgo;
      }

      return matchesSearch && matchesGame && matchesType && matchesDate;
    });
  }, [gameTransactions, searchQuery, filterGame, filterType, filterDate]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Statistics
  const stats = useMemo(() => {
    const bets = filteredTransactions.filter(t => t.transactionType === 'bet');
    const wins = filteredTransactions.filter(t => t.transactionType === 'win');
    
    const totalBets = bets.reduce((sum, t) => sum + t.amount, 0);
    const totalWins = wins.reduce((sum, t) => sum + t.amount, 0);
    const netProfit = totalWins - totalBets;

    return {
      totalTransactions: filteredTransactions.length,
      totalBets: bets.length,
      totalWins: wins.length,
      totalBetsAmount: totalBets,
      totalWinsAmount: totalWins,
      netProfit,
      houseEdge: totalBets > 0 ? ((totalBets - totalWins) / totalBets * 100) : 0
    };
  }, [filteredTransactions]);

  // Get unique game names for filter
  const gameNames = useMemo(() => {
    const names = new Set(gameTransactions.map(t => t.gameName));
    return Array.from(names).sort();
  }, [gameTransactions]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Transaction ID', 'Date', 'User', 'Email', 'Game', 'Type', 'Amount', 'Balance'];
    const rows = filteredTransactions.map(t => [
      t.id,
      formatDate(t.timestamp),
      t.userName,
      t.userEmail,
      t.gameName,
      t.transactionType.toUpperCase(),
      t.amount.toFixed(2),
      t.balance.toFixed(2)
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
            <Gamepad2 className="w-7 h-7 sm:w-8 sm:h-8 text-blue-400" />
            Game Transactions
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-1">View all game bets, wins, and losses</p>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="w-full sm:w-auto text-xs sm:text-sm">
          <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <div className="bg-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
          </div>
          <p className="text-slate-400 text-xs sm:text-sm">Total Transactions</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{stats.totalTransactions}</p>
        </div>

        <div className="bg-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
          </div>
          <p className="text-slate-400 text-xs sm:text-sm">Total Bets</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{formatCurrency(stats.totalBetsAmount)}</p>
          <p className="text-xs text-slate-500">{stats.totalBets} transactions</p>
        </div>

        <div className="bg-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
          </div>
          <p className="text-slate-400 text-xs sm:text-sm">Total Wins</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{formatCurrency(stats.totalWinsAmount)}</p>
          <p className="text-xs text-slate-500">{stats.totalWins} transactions</p>
        </div>

        <div className="bg-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <Trophy className={`w-5 h-5 sm:w-6 sm:h-6 ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`} />
          </div>
          <p className="text-slate-400 text-xs sm:text-sm">House Profit</p>
          <p className={`text-xl sm:text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(Math.abs(stats.netProfit))}
          </p>
          <p className="text-xs text-slate-500">{stats.houseEdge.toFixed(2)}% edge</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-slate-700">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          <h3 className="text-base sm:text-lg font-semibold text-white">Filters</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search user, game, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-xs sm:text-sm"
            />
          </div>

          {/* Game Filter */}
          <select
            value={filterGame}
            onChange={(e) => setFilterGame(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Games</option>
            {gameNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="bet">Bets Only</option>
            <option value="win">Wins Only</option>
          </select>

          {/* Date Filter */}
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-800 rounded-lg sm:rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Date/Time
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Game
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">
                  Balance
                </th>
                <th className="px-3 sm:px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No transactions found</p>
                    <p className="text-slate-500 text-xs mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center text-xs sm:text-sm text-white">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 mr-1 sm:mr-2" />
                        <div>
                          <div>{formatDate(transaction.timestamp).split(' ')[0]}</div>
                          <div className="text-[10px] sm:text-xs text-slate-400">{formatDate(transaction.timestamp).split(' ')[1]}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center">
                        <User className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 mr-1 sm:mr-2" />
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-medium text-white truncate">{transaction.userName}</div>
                          <div className="text-[10px] sm:text-xs text-slate-400 truncate hidden sm:block">{transaction.userEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center">
                        <Gamepad2 className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 mr-1 sm:mr-2" />
                        <span className="text-xs sm:text-sm text-white truncate">{transaction.gameName}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                        transaction.transactionType === 'bet'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {transaction.transactionType === 'bet' ? (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        )}
                        {transaction.transactionType.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end">
                        <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 mr-1" />
                        <span className={`text-xs sm:text-sm font-semibold ${
                          transaction.transactionType === 'bet' ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {formatCurrency(transaction.amount)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right whitespace-nowrap hidden md:table-cell">
                      <span className="text-xs sm:text-sm text-slate-300">{formatCurrency(transaction.balance)}</span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-center whitespace-nowrap hidden lg:table-cell">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : transaction.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-3 sm:px-4 py-3 sm:py-4 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs sm:text-sm text-slate-400">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="text-xs"
              >
                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline ml-1">Previous</span>
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="text-xs"
              >
                <span className="hidden sm:inline mr-1">Next</span>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

