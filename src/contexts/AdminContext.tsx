import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserManagement, SystemStats, GameManagement, FinancialReport, RiskAlert, AuditLog } from '../types/admin';
import { AdminUser, AdminSession } from '../types/auth';
import { Transaction, PendingPayment } from '../types/wallet';
import { SessionManager } from '../utils/sessionStorage';
import { DataStorage } from '../utils/dataStorage';
import toast from 'react-hot-toast';

interface AdminContextType {
  adminUser: AdminUser | null;
  isLoading: boolean;
  error: string | null;
  
  // Authentication
  adminLogin: (email: string, password: string) => Promise<void>;
  adminLogout: () => void;
  
  // User Management
  users: UserManagement[];
  getUserById: (id: string) => UserManagement | null;
  updateUserStatus: (userId: string, status: 'active' | 'suspended' | 'closed') => Promise<void>;
  verifyUser: (userId: string) => Promise<void>;
  adjustUserBalance: (userId: string, amount: number, reason: string) => Promise<void>;
  
  // System Stats
  systemStats: SystemStats;
  refreshSystemStats: () => Promise<void>;
  
  // Game Management
  games: GameManagement[];
  updateGameStatus: (gameId: string, isActive: boolean) => Promise<void>;
  updateGameRTP: (gameId: string, rtp: number) => Promise<void>;
  
  // Financial Reports
  financialReports: FinancialReport[];
  generateReport: (period: string) => Promise<FinancialReport>;
  
  // Risk Management
  riskAlerts: RiskAlert[];
  updateAlertStatus: (alertId: string, status: RiskAlert['status']) => Promise<void>;
  
  // Audit Logs
  auditLogs: AuditLog[];
  logAdminAction: (action: string, resourceType: string, resourceId: string, oldValues?: any, newValues?: any) => void;
  
  // Transactions
  getAllTransactions: () => Transaction[];
  pendingPayments: PendingPayment[];
  approvePendingPayment: (paymentId: string, adminNotes?: string, adminProofUrl?: string) => Promise<void>;
  rejectPendingPayment: (paymentId: string, reason: string) => Promise<void>;
  investigatePendingPayment: (paymentId: string, adminNotes: string) => Promise<void>;
  approveWithdrawal: (transactionId: string) => Promise<void>;
  rejectWithdrawal: (transactionId: string, reason: string) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);

  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalBets: 0,
    totalWinnings: 0,
    platformRevenue: 0,
    pendingWithdrawals: 0,
    pendingVerifications: 0,
    systemHealth: 'healthy'
  });

  const [games, setGames] = useState<GameManagement[]>([
    {
      id: 'mega-fortune-dreams',
      name: 'Mega Fortune Dreams',
      provider: 'NetEnt',
      category: 'slots',
      rtp: 96.4,
      isActive: true,
      totalPlayed: 0,
      totalWagered: 0,
      totalPayout: 0,
      profitMargin: 3.6,
      lastPlayed: new Date()
    },
    {
      id: 'lightning-roulette',
      name: 'Lightning Roulette',
      provider: 'Evolution',
      category: 'table',
      rtp: 97.3,
      isActive: true,
      totalPlayed: 0,
      totalWagered: 0,
      totalPayout: 0,
      profitMargin: 2.7,
      lastPlayed: new Date()
    },
    {
      id: 'blackjack-professional',
      name: 'Blackjack Professional',
      provider: 'Pragmatic Play',
      category: 'table',
      rtp: 99.5,
      isActive: true,
      totalPlayed: 0,
      totalWagered: 0,
      totalPayout: 0,
      profitMargin: 0.5,
      lastPlayed: new Date()
    }
  ]);

  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [financialReports, setFinancialReports] = useState<FinancialReport[]>([]);

  // Load all data on mount
  useEffect(() => {
    console.log('AdminContext: Initializing...');
    loadAllData();
    
    // Set up storage event listeners
    const handleStorageChange = (e: StorageEvent) => {
      console.log('AdminContext: Storage event received:', e.key);
      
      // Handle force refresh events
      if (e.key === 'elitebet_force_admin_refresh') {
        console.log('AdminContext: Force refresh requested');
        setTimeout(() => {
          loadAllData();
        }, 100);
        return;
      }
      
      // Handle new pending payments
      if (e.key === 'elitebet_pending_payment_added' && e.newValue) {
        try {
          const payment = JSON.parse(e.newValue);
          console.log('AdminContext: New pending payment received:', payment.id);
          setPendingPayments(prev => {
            const exists = prev.some(p => p.id === payment.id);
            if (!exists) {
              const updated = [payment, ...prev];
              // Force immediate re-render
              setTimeout(() => setPendingPayments([...updated]), 50);
              return updated;
            }
            return prev;
          });
        } catch (error) {
          console.error('AdminContext: Failed to parse pending payment event:', error);
        }
      }
      
      // Handle new transactions
      if (e.key === 'elitebet_transaction_added' && e.newValue) {
        try {
          const transaction = JSON.parse(e.newValue);
          console.log('AdminContext: New transaction received:', transaction.id);
          setTransactions(prev => {
            const exists = prev.some(t => t.id === transaction.id);
            if (!exists) {
              const updated = [transaction, ...prev];
              updateSystemStatsFromTransactions(updated);
              // Force immediate re-render
              setTimeout(() => setTransactions([...updated]), 50);
              return updated;
            }
            return prev;
          });
        } catch (error) {
          console.error('AdminContext: Failed to parse transaction event:', error);
        }
      }
      
      if (e.key === 'elitebet_data_sync' && e.newValue) {
        try {
          const update = JSON.parse(e.newValue);
          console.log('AdminContext: Processing data sync event:', update.type);
          
          if (update.type === 'transaction_added') {
            setTransactions(prev => {
              const exists = prev.some(t => t.id === update.data.id);
              if (!exists) {
                console.log('AdminContext: Adding transaction from sync:', update.data.id);
                const updated = [update.data, ...prev];
                updateSystemStatsFromTransactions(updated);
                // Force re-render and update storage
                setTimeout(() => {
                  setTransactions([...updated]);
                  const currentData = DataStorage.loadData();
                  updateSystemStats(currentData);
                }, 50);
                return updated;
              }
              return prev;
            });
          }
          
          if (update.type === 'pending_payment_added') {
            setPendingPayments(prev => {
              const exists = prev.some(p => p.id === update.data.id);
              if (!exists) {
                console.log('AdminContext: Adding pending payment from sync:', update.data.id);
                const updated = [update.data, ...prev];
                // Force re-render
                setTimeout(() => setPendingPayments([...updated]), 50);
                return updated;
              }
              return prev;
            });
          }
          
          if (update.type === 'pending_payment_updated') {
            setPendingPayments(prev => {
              const updated = prev.map(p => p.id === update.data.id ? { ...p, ...update.data } : p);
              console.log('AdminContext: Updated pending payment from sync:', update.data.id);
              return updated;
            });
          }
          
          if (update.type === 'user_updated') {
            setUsers(prev => {
              const exists = prev.some(u => u.id === update.data.id);
              if (exists) {
                console.log('AdminContext: Updating user from sync:', update.data.id);
                return prev.map(u => u.id === update.data.id ? { ...u, ...update.data } : u);
              } else {
                console.log('AdminContext: Adding new user from sync:', update.data.id);
                const updated = [update.data, ...prev];
                updateSystemStatsFromUsers(updated);
                return updated;
              }
            });
          }
        } catch (error) {
          console.error('AdminContext: Failed to parse storage sync event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Load all data from storage
  const loadAllData = async () => {
    try {
      console.log('AdminContext: Loading all data from storage...');
      
      // Small delay to ensure any pending writes are complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Load admin session
      const session = SessionManager.getAdminSession();
      if (session) {
        setAdminUser(session.adminUser);
        console.log('AdminContext: Admin session loaded');
      }

      // Use DataStorage for consistent data loading
      const storedData = DataStorage.loadData();
      
      setUsers(storedData.users || []);
      setTransactions(storedData.transactions || []);
      setPendingPayments(storedData.pendingPayments || []);

      console.log('AdminContext: Data loaded successfully:', {
        users: storedData.users?.length || 0,
        transactions: storedData.transactions?.length || 0,
        pendingPayments: storedData.pendingPayments?.length || 0
      });

      // Update system stats
      updateSystemStats(storedData);
    } catch (error) {
      console.error('AdminContext: Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update system stats from loaded data
  const updateSystemStats = (data: any) => {
    const allUsers = data.users || [];
    const allTransactions = data.transactions || [];
    const allPendingPayments = data.pendingPayments || [];
    
    console.log('AdminContext: Updating system stats:', {
      users: allUsers.length,
      transactions: allTransactions.length,
      pendingPayments: allPendingPayments.length
    });
    
    setSystemStats({
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter((u: any) => u.status === 'active').length,
      totalDeposits: allTransactions
        .filter((t: any) => t.type === 'deposit' && t.status === 'completed')
        .reduce((sum: number, t: any) => sum + t.amount, 0),
      totalWithdrawals: allTransactions
        .filter((t: any) => t.type === 'withdraw' && t.status === 'completed')
        .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0),
      totalBets: allTransactions
        .filter((t: any) => t.type === 'bet' && t.status === 'completed')
        .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0),
      totalWinnings: allTransactions
        .filter((t: any) => t.type === 'win' && t.status === 'completed')
        .reduce((sum: number, t: any) => sum + t.amount, 0),
      platformRevenue: allTransactions
        .filter((t: any) => (t.type === 'bet' || t.type === 'win') && t.status === 'completed')
        .reduce((sum: number, t: any) => sum + (t.type === 'bet' ? Math.abs(t.amount) : -t.amount), 0),
      pendingWithdrawals: allPendingPayments
        .filter((p: any) => p.type === 'withdraw' && p.status === 'pending')
        .reduce((sum: number, p: any) => sum + p.amount, 0),
      pendingVerifications: 0,
      systemHealth: 'healthy' as const
    });
  };

  // Update system stats from transactions only
  const updateSystemStatsFromTransactions = (allTransactions: Transaction[]) => {
    setSystemStats(prev => ({
      ...prev,
      totalDeposits: allTransactions
        .filter(t => t.type === 'deposit' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0),
      totalWithdrawals: allTransactions
        .filter(t => t.type === 'withdraw' && t.status === 'completed')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
      totalBets: allTransactions
        .filter(t => t.type === 'bet' && t.status === 'completed')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
      totalWinnings: allTransactions
        .filter(t => t.type === 'win' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0),
      platformRevenue: allTransactions
        .filter(t => (t.type === 'bet' || t.type === 'win') && t.status === 'completed')
        .reduce((sum, t) => sum + (t.type === 'bet' ? Math.abs(t.amount) : -t.amount), 0)
    }));
  };

  // Update system stats from users only
  const updateSystemStatsFromUsers = (allUsers: UserManagement[]) => {
    setSystemStats(prev => ({
      ...prev,
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter(u => u.status === 'active').length
    }));
  };

  const adminLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (email === 'admin@elitebet.com' && password === 'Admin123!') {
        const mockAdmin: AdminUser = {
          id: 'admin_1',
          email,
          firstName: 'Admin',
          lastName: 'User',
          role: {
            id: 'super_admin',
            name: 'Super Administrator',
            description: 'Full system access',
            permissions: ['*'],
            level: 10
          },
          permissions: ['*'],
          lastLogin: new Date(),
          isActive: true
        };
        
        const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
        const session: AdminSession = {
          adminUser: mockAdmin,
          token: `admin_token_${Date.now()}`,
          expiresAt,
          refreshToken: `admin_refresh_${Date.now()}`
        };

        SessionManager.saveAdminSession(session);
        setAdminUser(mockAdmin);
        
        logAdminAction('admin_login', 'admin', mockAdmin.id);
        toast.success('Admin login successful');
        
        // Reload data after login
        loadAllData();
      } else {
        throw new Error('Invalid admin credentials');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogout = () => {
    if (adminUser) {
      logAdminAction('admin_logout', 'admin', adminUser.id);
    }
    SessionManager.clearAdminSession();
    setAdminUser(null);
    toast.success('Admin logged out');
  };

  const getUserById = (id: string): UserManagement | null => {
    return users.find(user => user.id === id) || null;
  };

  const updateUserStatus = async (userId: string, status: 'active' | 'suspended' | 'closed') => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const oldUser = users.find(u => u.id === userId);
      if (!oldUser) throw new Error('User not found');
      
      const updatedUser = { ...oldUser, status };
      
      setUsers(prev => prev.map(user => user.id === userId ? updatedUser : user));
      DataStorage.addOrUpdateUser(updatedUser);
      
      logAdminAction('update_user_status', 'user', userId, 
        { status: oldUser.status }, 
        { status }
      );
      
      toast.success(`User ${oldUser.firstName} ${oldUser.lastName} status updated to ${status}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user status';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyUser = async (userId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const user = users.find(u => u.id === userId);
      if (!user) throw new Error('User not found');
      
      const updatedUser = { ...user, isVerified: true };
      
      setUsers(prev => prev.map(user => user.id === userId ? updatedUser : user));
      DataStorage.addOrUpdateUser(updatedUser);
      
      logAdminAction('verify_user', 'user', userId, 
        { isVerified: false }, 
        { isVerified: true }
      );
      
      toast.success(`User ${user.firstName} ${user.lastName} verified successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify user';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const adjustUserBalance = async (userId: string, amount: number, reason: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const oldUser = users.find(u => u.id === userId);
      if (!oldUser) throw new Error('User not found');
      
      const newBalance = Math.max(0, oldUser.balance + amount);
      const updatedUser = { ...oldUser, balance: newBalance };
      
      setUsers(prev => prev.map(user => user.id === userId ? updatedUser : user));
      DataStorage.addOrUpdateUser(updatedUser);
      
      // Add transaction record for balance adjustment
      const adjustmentTransaction: Transaction = {
        id: `txn_adjustment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: amount > 0 ? 'bonus' : 'fee',
        status: 'completed',
        amount,
        currency: 'INR',
        fee: 0,
        method: 'Admin Adjustment',
        description: `Balance adjustment: ${reason}`,
        metadata: { adjustedBy: adminUser?.id, reason },
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date()
      };
      
      setTransactions(prev => [adjustmentTransaction, ...prev]);
      DataStorage.addTransaction(adjustmentTransaction);
      
      logAdminAction('adjust_balance', 'user', userId, 
        { balance: oldUser.balance }, 
        { balance: newBalance, adjustment: amount, reason }
      );
      
      // Trigger storage event for user context sync
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'elitebet_balance_update',
        newValue: JSON.stringify({ userId, amount, newBalance, reason })
      }));
      
      toast.success(`Balance adjusted by ${amount > 0 ? '+' : ''}${formatCurrency(amount)} for ${oldUser.firstName} ${oldUser.lastName}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to adjust balance';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSystemStats = async () => {
    setIsLoading(true);
    try {
      console.log('AdminContext: Refreshing system stats...');
      const currentData = DataStorage.loadData();
      updateSystemStats(currentData);
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('System stats refreshed');
    } finally {
      setIsLoading(false);
    }
  };

  const updateGameStatus = async (gameId: string, isActive: boolean) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const oldGame = games.find(g => g.id === gameId);
      if (!oldGame) throw new Error('Game not found');
      
      setGames(prev => prev.map(game => 
        game.id === gameId ? { ...game, isActive } : game
      ));
      
      logAdminAction('update_game_status', 'game', gameId, 
        { isActive: oldGame.isActive }, 
        { isActive }
      );
      
      toast.success(`Game "${oldGame.name}" ${isActive ? 'activated' : 'deactivated'}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update game status';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateGameRTP = async (gameId: string, rtp: number) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const oldGame = games.find(g => g.id === gameId);
      if (!oldGame) throw new Error('Game not found');
      
      const newProfitMargin = 100 - rtp;
      
      setGames(prev => prev.map(game => 
        game.id === gameId ? { ...game, rtp, profitMargin: newProfitMargin } : game
      ));
      
      logAdminAction('update_game_rtp', 'game', gameId, 
        { rtp: oldGame.rtp }, 
        { rtp }
      );
      
      toast.success(`Game "${oldGame.name}" RTP updated to ${rtp}%`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update game RTP';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async (period: string): Promise<FinancialReport> => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const report: FinancialReport = {
        period: `${period.charAt(0).toUpperCase() + period.slice(1)} Report - ${new Date().toLocaleDateString()}`,
        totalRevenue: systemStats.platformRevenue,
        totalDeposits: systemStats.totalDeposits,
        totalWithdrawals: systemStats.totalWithdrawals,
        totalBets: systemStats.totalBets,
        totalWinnings: systemStats.totalWinnings,
        netProfit: systemStats.platformRevenue,
        activeUsers: systemStats.activeUsers,
        newUsers: Math.floor(Math.random() * 100) + 50,
        conversionRate: Math.random() * 5 + 15
      };
      
      setFinancialReports(prev => [report, ...prev]);
      
      logAdminAction('generate_financial_report', 'report', period, {}, { period, revenue: report.totalRevenue });
      
      toast.success(`${period} financial report generated successfully`);
      return report;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate report';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAlertStatus = async (alertId: string, status: RiskAlert['status']) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const oldAlert = riskAlerts.find(a => a.id === alertId);
      if (!oldAlert) throw new Error('Alert not found');
      
      setRiskAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { 
          ...alert, 
          status,
          assignedTo: status === 'investigating' ? adminUser?.email : alert.assignedTo
        } : alert
      ));
      
      logAdminAction('update_alert_status', 'alert', alertId, 
        { status: oldAlert.status }, 
        { status, assignedTo: adminUser?.email }
      );
      
      toast.success(`Risk alert status updated to ${status.replace('_', ' ')}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update alert status';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logAdminAction = (action: string, resourceType: string, resourceId: string, oldValues?: any, newValues?: any) => {
    if (!adminUser) return;
    
    const log: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      adminId: adminUser.id,
      adminName: `${adminUser.firstName} ${adminUser.lastName}`,
      action,
      resourceType,
      resourceId,
      oldValues,
      newValues,
      ipAddress: '192.168.1.100',
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      severity: action.includes('delete') || action.includes('suspend') || action.includes('close') ? 'critical' : 
                action.includes('update') || action.includes('adjust') || action.includes('verify') ? 'warning' : 'info'
    };
    
    setAuditLogs(prev => [log, ...prev.slice(0, 99)]);
  };

  const getAllTransactions = (): Transaction[] => {
    return transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const approvePendingPayment = async (paymentId: string, adminNotes?: string, adminProofUrl?: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const payment = pendingPayments.find(p => p.id === paymentId);
      if (!payment) throw new Error('Payment not found');
      
      console.log('AdminContext: Approving payment:', paymentId, payment.type, payment.amount);
      
      // Update payment status
      const updatedPayment = {
        ...payment,
        status: 'approved' as const,
        reviewedAt: new Date(),
        reviewedBy: adminUser?.email,
        adminNotes,
        paymentProofUrl: adminProofUrl || payment.paymentProofUrl
      };
      
      setPendingPayments(prev => prev.map(p => p.id === paymentId ? updatedPayment : p));
      
      // Update in localStorage directly
      const currentData = JSON.parse(localStorage.getItem('elitebet_app_data') || '{"transactions":[],"pendingPayments":[],"users":[]}');
      
      // Update pending payment
      DataStorage.updatePendingPayment(paymentId, updatedPayment);

      if (payment.type === 'deposit') {
        // For deposits: create a completed transaction
        const completedTransaction: Transaction = {
          id: payment.transactionId,
          userId: payment.userId,
          type: 'deposit',
          status: 'completed',
          amount: payment.amount,
          currency: payment.currency,
          fee: 0,
          method: payment.method,
          externalReference: payment.transactionId,
          description: `Deposit via ${payment.method} - Approved`,
          metadata: {
            paymentProofUrl: payment.paymentProofUrl,
            approvedBy: adminUser?.email,
            adminNotes,
            adminProofUrl: adminProofUrl || ''
          },
          createdAt: payment.submittedAt,
          updatedAt: new Date(),
          completedAt: new Date()
        };
        
        setTransactions(prev => [completedTransaction, ...prev]);
        
        // Add transaction to storage
        DataStorage.addTransaction(completedTransaction);
        
        // Add funds to user balance
        const depositUser = users.find(u => u.id === payment.userId);
        if (depositUser) {
          const newBalance = depositUser.balance + payment.amount;
          const updatedUser = {
            ...depositUser,
            balance: newBalance,
            totalDeposited: depositUser.totalDeposited + payment.amount
          };
          
          setUsers(prev => prev.map(u => u.id === payment.userId ? updatedUser : u));
          
          // Update user in storage
          DataStorage.addOrUpdateUser(updatedUser);
          
          // Trigger balance update for user context
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'elitebet_balance_update',
            newValue: JSON.stringify({ 
              userId: payment.userId, 
              amount: payment.amount,
              newBalance: newBalance,
              reason: `Deposit approved by admin`
            })
          }));
          
          // Trigger transaction update for user context
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'elitebet_transaction_added',
            newValue: JSON.stringify(completedTransaction)
          }));
        }
      } else {
        // For withdrawals: update existing transaction to completed
        const existingTransaction = transactions.find(t => t.id === payment.transactionId);
        if (existingTransaction) {
          const updatedTransaction = {
            ...existingTransaction,
            status: 'completed' as const,
            completedAt: new Date(),
            updatedAt: new Date(),
            metadata: {
              ...existingTransaction.metadata,
              approvedBy: adminUser?.email,
              adminNotes,
              adminProofUrl: adminProofUrl || ''
            }
          };
          
          DataStorage.addTransaction(updatedTransaction);
        }
        
        setTransactions(prev => prev.map(t => 
          t.id === payment.transactionId ? {
            ...t,
            status: 'completed' as const,
            completedAt: new Date(),
            updatedAt: new Date(),
            metadata: {
              ...t.metadata,
              approvedBy: adminUser?.email,
              adminNotes,
              adminProofUrl: adminProofUrl || ''
            }
          } : t
        ));
        
        // Trigger transaction update for user context
        const updatedTransaction = transactions.find(t => t.id === payment.transactionId);
        if (updatedTransaction) {
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'elitebet_transaction_updated',
            newValue: JSON.stringify(updatedTransaction)
          }));
        }
      }
      
      logAdminAction('approve_payment', 'payment', paymentId, 
        { status: 'pending' }, 
        { status: 'approved', amount: payment.amount, type: payment.type }
      );
      
      // Update system stats
      const refreshedData = DataStorage.loadData();
      updateSystemStats(refreshedData);
      
      toast.success(`${payment.type === 'deposit' ? 'Deposit' : 'Withdrawal'} of ${formatCurrency(payment.amount)} approved`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve payment';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const rejectPendingPayment = async (paymentId: string, reason: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const payment = pendingPayments.find(p => p.id === paymentId);
      if (!payment) throw new Error('Payment not found');
      
      console.log('AdminContext: Rejecting payment:', paymentId, payment.type, payment.amount);
      
      // Update payment status
      const updatedPayment = {
        ...payment,
        status: 'rejected' as const,
        reviewedAt: new Date(),
        reviewedBy: adminUser?.email,
        rejectionReason: reason
      };
      
      setPendingPayments(prev => prev.map(p => p.id === paymentId ? updatedPayment : p));
      
      // Update in storage
      DataStorage.updatePendingPayment(paymentId, updatedPayment);

      // Update corresponding transaction
      const existingTransaction = transactions.find(t => t.id === payment.transactionId);
      if (existingTransaction) {
        const updatedTransaction = {
          ...existingTransaction,
          status: 'failed' as const,
          updatedAt: new Date(),
          metadata: {
            ...existingTransaction.metadata,
            rejectionReason: reason,
            rejectedBy: adminUser?.email
          }
        };
        
        setTransactions(prev => prev.map(t => t.id === payment.transactionId ? updatedTransaction : t));
        
        // Update transaction in storage
        DataStorage.addTransaction(updatedTransaction);
        
        // Trigger transaction update for user context
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'elitebet_transaction_updated',
          newValue: JSON.stringify(updatedTransaction)
        }));
      }

      if (payment.type === 'withdraw') {
        // Return funds to user balance for rejected withdrawals
        const user = users.find(u => u.id === payment.userId);
        if (user) {
          const refundAmount = payment.amount;
          const updatedUser = { ...user, balance: user.balance + refundAmount };
          
          setUsers(prev => prev.map(u => u.id === payment.userId ? updatedUser : u));
          
          // Update user in storage
          DataStorage.addOrUpdateUser(updatedUser);
          
          // Trigger balance update for user context
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'elitebet_balance_update',
            newValue: JSON.stringify({ 
              userId: payment.userId, 
              amount: refundAmount,
              newBalance: updatedUser.balance,
              reason: `Withdrawal rejected: ${reason}`
            })
          }));
        }
      }
      
      logAdminAction('reject_payment', 'payment', paymentId, 
        { status: 'pending' }, 
        { status: 'rejected', reason, type: payment.type }
      );
      
      toast.success(`${payment.type === 'deposit' ? 'Deposit' : 'Withdrawal'} rejected`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject payment';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const investigatePendingPayment = async (paymentId: string, adminNotes: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const payment = pendingPayments.find(p => p.id === paymentId);
      if (!payment) throw new Error('Payment not found');
      
      const updatedPayment = {
        ...payment,
        status: 'investigating' as const,
        reviewedAt: new Date(),
        reviewedBy: adminUser?.email,
        adminNotes
      };
      
      setPendingPayments(prev => prev.map(p => p.id === paymentId ? updatedPayment : p));
      DataStorage.updatePendingPayment(paymentId, updatedPayment);

      // Update corresponding transaction
      const existingTransaction = transactions.find(t => t.id === payment.transactionId);
      if (existingTransaction) {
        const updatedTransaction = {
          ...existingTransaction,
          status: 'processing' as const,
          updatedAt: new Date(),
          metadata: {
            ...existingTransaction.metadata,
            investigationNotes: adminNotes,
            investigatedBy: adminUser?.email
          }
        };
        
        setTransactions(prev => prev.map(t => t.id === payment.transactionId ? updatedTransaction : t));
        DataStorage.addTransaction(updatedTransaction);
      }

      logAdminAction('investigate_payment', 'payment', paymentId, 
        { status: 'pending' }, 
        { status: 'investigating', adminNotes }
      );
      
      toast.success(`${payment.type === 'deposit' ? 'Deposit' : 'Withdrawal'} marked for investigation`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update payment status';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const approveWithdrawal = async (transactionId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const transaction = transactions.find(t => t.id === transactionId);
      if (!transaction) throw new Error('Transaction not found');
      
      const updatedTransaction = {
        ...transaction,
        status: 'completed' as const,
        completedAt: new Date(),
        updatedAt: new Date()
      };
      
      setTransactions(prev => prev.map(t => t.id === transactionId ? updatedTransaction : t));
      DataStorage.addTransaction(updatedTransaction);
      
      const user = users.find(u => u.id === transaction.userId);
      if (user) {
        const updatedUser = {
          ...user,
          totalWithdrawn: user.totalWithdrawn + Math.abs(transaction.amount)
        };
        
        setUsers(prev => prev.map(u => u.id === transaction.userId ? updatedUser : u));
        DataStorage.addOrUpdateUser(updatedUser);
      }
      
      logAdminAction('approve_withdrawal', 'transaction', transactionId, 
        { status: 'pending' }, 
        { status: 'completed', approvedBy: adminUser?.id }
      );
      
      toast.success(`Withdrawal of ${formatCurrency(Math.abs(transaction.amount))} approved and processed`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve withdrawal';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const rejectWithdrawal = async (transactionId: string, reason: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const transaction = transactions.find(t => t.id === transactionId);
      if (!transaction) throw new Error('Transaction not found');
      
      const updatedTransaction = {
        ...transaction,
        status: 'failed' as const,
        updatedAt: new Date(),
        metadata: { ...transaction.metadata, rejectionReason: reason, rejectedBy: adminUser?.id }
      };
      
      setTransactions(prev => prev.map(t => t.id === transactionId ? updatedTransaction : t));
      DataStorage.addTransaction(updatedTransaction);
      
      // Return funds to user's balance
      const user = users.find(u => u.id === transaction.userId);
      if (user) {
        const refundAmount = Math.abs(transaction.amount) + transaction.fee;
        const updatedUser = { ...user, balance: user.balance + refundAmount };
        
        setUsers(prev => prev.map(u => u.id === transaction.userId ? updatedUser : u));
        DataStorage.addOrUpdateUser(updatedUser);
        
        // Trigger storage event for user context sync
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'elitebet_balance_update',
          newValue: JSON.stringify({ 
            userId: transaction.userId, 
            amount: refundAmount,
            newBalance: updatedUser.balance,
            reason: `Withdrawal rejected: ${reason}`
          })
        }));
      }
      
      logAdminAction('reject_withdrawal', 'transaction', transactionId, 
        { status: 'pending' }, 
        { status: 'failed', reason, rejectedBy: adminUser?.id }
      );
      
      toast.success(`Withdrawal rejected. Funds returned to user account.`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject withdrawal';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminContext.Provider value={{
      adminUser,
      isLoading,
      error,
      adminLogin,
      adminLogout,
      users,
      getUserById,
      updateUserStatus,
      verifyUser,
      adjustUserBalance,
      systemStats,
      refreshSystemStats,
      games,
      updateGameStatus,
      updateGameRTP,
      financialReports,
      generateReport,
      riskAlerts,
      updateAlertStatus,
      auditLogs,
      logAdminAction,
      getAllTransactions,
      pendingPayments,
      approvePendingPayment,
      rejectPendingPayment,
      investigatePendingPayment,
      approveWithdrawal,
      rejectWithdrawal
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}