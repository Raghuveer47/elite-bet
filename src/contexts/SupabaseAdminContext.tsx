import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser, UserManagement, SystemStats, GameManagement, RiskAlert, AuditLog, FinancialReport } from '../types/admin';
import { Transaction, PendingPayment } from '../types/wallet';
import { SupabaseAuthService } from '../services/supabaseAuthService';
import toast from 'react-hot-toast';

interface AdminContextType {
  adminUser: AdminUser | null;
  isLoading: boolean;
  error: string | null;
  users: UserManagement[];
  transactions: Transaction[];
  pendingPayments: PendingPayment[];
  systemStats: SystemStats;
  games: GameManagement[];
  riskAlerts: RiskAlert[];
  auditLogs: AuditLog[];
  financialReports: FinancialReport[];
  
  // Auth methods
  adminLogin: (email: string, password: string) => Promise<void>;
  adminLogout: () => void;
  
  // User management
  getUserById: (id: string) => UserManagement | null;
  updateUserStatus: (userId: string, status: 'active' | 'suspended' | 'closed') => Promise<void>;
  updateUserBalance: (userId: string, balance: number) => Promise<void>;
  verifyUser: (userId: string) => Promise<void>;
  
  // Transaction management
  approveWithdrawal: (transactionId: string) => Promise<void>;
  rejectWithdrawal: (transactionId: string, reason: string) => Promise<void>;
  approveDeposit: (paymentId: string) => Promise<void>;
  rejectDeposit: (paymentId: string, reason: string) => Promise<void>;
  
  // Data loading
  loadAllData: () => Promise<void>;
  refreshData: () => Promise<void>;
  refreshLocalTransactions: () => void;
  forceRefresh: () => Promise<void>;
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
  const [games, setGames] = useState<GameManagement[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [financialReports, setFinancialReports] = useState<FinancialReport[]>([]);

  // Initialize admin session
  useEffect(() => {
    let isMounted = true;
    const loadingTimeout = setTimeout(() => {
      console.log('AdminContext: Loading timeout reached');
      if (isMounted) {
        setIsLoading(false);
      }
    }, 5000); // 5 seconds max loading time

    const initializeAdminSession = async () => {
      try {
        console.log('AdminContext: Initializing admin session...');
        
        // Check for existing admin session in sessionStorage
        const adminSession = sessionStorage.getItem('elitebet_admin_session');
        if (adminSession) {
          const session = JSON.parse(adminSession);
          if (session.adminUser && new Date(session.expiresAt) > new Date()) {
            if (isMounted) {
              setAdminUser(session.adminUser);
              await loadAllData();
              console.log('AdminContext: Admin session restored');
            }
          }
        }
      } catch (error) {
        console.error('AdminContext: Failed to initialize admin session:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          console.log('AdminContext: Initialization complete');
        }
      }
    };

    initializeAdminSession();

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
    };
  }, []);

  // Listen for Supabase changes (no localStorage fallback)
  useEffect(() => {
    // No localStorage listener needed - we use Supabase directly
    console.log('AdminContext: Using Supabase directly - no localStorage fallback');
  }, []);

  // Periodic refresh to check for new Supabase transactions
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('AdminContext: Periodic refresh of Supabase data');
      loadAllData(); // Refresh from Supabase directly
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const adminLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('AdminContext: Attempting admin login for:', email);
      
      // Simple admin login for demo purposes
      if (email === 'admin@spinzos.com' && password === 'Admin123!') {
        const mockAdmin: AdminUser = {
          id: 'admin_1',
          email: email,
          firstName: 'Admin',
          lastName: 'User',
          role: {
            id: 'super_admin',
            name: 'Super Administrator',
            description: 'Full administrative access',
            permissions: ['*'],
            level: 10
          },
          permissions: ['*'],
          lastLogin: new Date(),
          isActive: true
        };

        // Store admin session in sessionStorage (to match SessionManager)
        sessionStorage.setItem('elitebet_admin_session', JSON.stringify({
          adminUser: mockAdmin,
          loginTime: Date.now(),
          expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        }));

        setAdminUser(mockAdmin);
        console.log('AdminContext: Admin login successful');
        
        // Load all admin data
        await loadAllData();
        
        toast.success('Admin login successful');
      } else {
        throw new Error('Invalid admin credentials');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogout = () => {
    try {
      console.log('AdminContext: Admin logout');
      
      // Clear session
      sessionStorage.removeItem('elitebet_admin_session');
      
      setAdminUser(null);
      setUsers([]);
      setTransactions([]);
      setPendingPayments([]);
      setAuditLogs([]);
      
      toast.success('Admin logged out');
      console.log('AdminContext: Admin logout successful');
    } catch (error) {
      console.error('AdminContext: Logout error:', error);
    }
  };

  // Helper method to get locally stored transactions
  const getLocalTransactions = (): Transaction[] => {
    try {
      // Get transactions from localStorage (stored by wallet context)
      const storedTransactions = localStorage.getItem('elitebet_local_transactions');
      if (storedTransactions) {
        const parsed = JSON.parse(storedTransactions);
        return parsed.map((tx: any) => ({
          ...tx,
          createdAt: new Date(tx.createdAt),
          completedAt: tx.completedAt ? new Date(tx.completedAt) : undefined,
          updatedAt: new Date(tx.updatedAt)
        }));
      }
      return [];
    } catch (error) {
      console.error('AdminContext: Error parsing local transactions:', error);
      return [];
    }
  };

  // Helper method to update local transaction status
  const updateLocalTransactionStatus = (transactionId: string, status: string, metadata?: any) => {
    try {
      const existingLocal = localStorage.getItem('elitebet_local_transactions');
      if (existingLocal) {
        const localTransactions = JSON.parse(existingLocal);
        const updatedTransactions = localTransactions.map((tx: any) => {
          if (tx.id === transactionId) {
            return {
              ...tx,
              status,
              completedAt: status === 'completed' ? new Date().toISOString() : tx.completedAt,
              updatedAt: new Date().toISOString(),
              metadata: {
                ...tx.metadata,
                ...metadata
              }
            };
          }
          return tx;
        });
        localStorage.setItem('elitebet_local_transactions', JSON.stringify(updatedTransactions));
        console.log('AdminContext: Updated local transaction status:', transactionId, 'to', status);
      }
    } catch (error) {
      console.error('AdminContext: Failed to update local transaction status:', error);
    }
  };

  const loadAllData = async () => {
    try {
      console.log('AdminContext: Loading real data from Supabase...');
      
      // Try to load real data from Supabase with more detailed error logging
      console.log('AdminContext: Attempting to load real data from Supabase...');
      
      const [
        usersResult,
        transactionsResult,
        statsResult,
        auditLogsResult
      ] = await Promise.all([
        SupabaseAuthService.getAllUsers().catch(err => {
          console.error('AdminContext: Failed to load users:', err);
          return { success: false, users: [], error: err };
        }),
        SupabaseAuthService.getAllTransactions().catch(err => {
          console.error('AdminContext: Failed to load transactions:', err);
          return { success: false, transactions: [], error: err };
        }),
        SupabaseAuthService.getSystemStats().catch(err => {
          console.error('AdminContext: Failed to load stats:', err);
          return { success: false, stats: null, error: err };
        }),
        SupabaseAuthService.getAuditLogs().catch(err => {
          console.error('AdminContext: Failed to load audit logs:', err);
          return { success: false, logs: [], error: err };
        })
      ]);

      // Load users
      if (usersResult.success && usersResult.users && usersResult.users.length > 0) {
        const convertedUsers: UserManagement[] = usersResult.users.map(user => ({
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          balance: user.balance,
          status: user.status as 'active' | 'suspended' | 'closed',
          isVerified: user.is_verified,
          registrationDate: new Date(user.created_at),
          lastLogin: new Date(user.last_login),
          totalDeposited: user.total_deposited || 0,
          totalWithdrawn: user.total_withdrawn || 0,
          totalWagered: user.total_wagered || 0,
          activeBets: user.active_bets || 0,
          country: user.country || 'Unknown',
          riskLevel: user.risk_level as 'low' | 'medium' | 'high' || 'low'
        }));
        setUsers(convertedUsers);
        console.log('AdminContext: Loaded', convertedUsers.length, 'real users');
      } else {
        console.log('AdminContext: No real users found, using mock data');
        console.log('AdminContext: Users result:', usersResult);
        if (usersResult.error) {
          console.error('AdminContext: Users error details:', usersResult.error);
        }
        // Fallback to mock data if no real users
        const mockUsers: UserManagement[] = [
          {
            id: 'user_1',
            email: 'demo@example.com',
            firstName: 'Demo',
            lastName: 'User',
            balance: 150.00,
            status: 'active',
            isVerified: true,
            registrationDate: new Date('2024-01-15'),
            lastLogin: new Date(),
            totalDeposited: 200.00,
            totalWithdrawn: 50.00,
            totalWagered: 100.00,
            activeBets: 2,
            country: 'United States',
            riskLevel: 'low'
          }
        ];
        setUsers(mockUsers);
      }

      // Load transactions
      let allTransactions: Transaction[] = [];
      
      if (transactionsResult.success && transactionsResult.transactions && transactionsResult.transactions.length > 0) {
        const convertedTransactions: Transaction[] = transactionsResult.transactions.map(tx => ({
          id: tx.id,
          userId: tx.user_id,
          type: tx.type as 'deposit' | 'withdrawal' | 'bet' | 'win' | 'refund' | 'fee',
          amount: tx.amount,
          currency: tx.currency,
          status: tx.status as 'pending' | 'completed' | 'failed' | 'cancelled',
          description: tx.description,
          reference: tx.reference,
          createdAt: new Date(tx.created_at),
          completedAt: tx.completed_at ? new Date(tx.completed_at) : undefined,
          updatedAt: new Date(tx.updated_at),
          metadata: tx.metadata
        }));
        allTransactions = convertedTransactions;
        console.log('AdminContext: Loaded', convertedTransactions.length, 'real transactions from Supabase');
      } else {
        console.log('AdminContext: No real transactions found from Supabase');
      }
      
      // Also load locally stored transactions as fallback
      const localTransactions = getLocalTransactions();
      console.log('AdminContext: Found', localTransactions.length, 'local transactions');
      
      // Merge Supabase and local transactions, avoiding duplicates
      const mergedTransactions = [...allTransactions];
      localTransactions.forEach(localTx => {
        const exists = mergedTransactions.some(tx => tx.id === localTx.id);
        if (!exists) {
          mergedTransactions.push(localTx);
        }
      });
      
      console.log('AdminContext: Total transactions (Supabase + Local):', mergedTransactions.length);
      setTransactions(mergedTransactions);
      
      // Extract pending payments from all transactions
      const pendingPayments: PendingPayment[] = mergedTransactions
        .filter(tx => (tx.type === 'deposit' || tx.type === 'withdrawal') && tx.status === 'pending')
        .map(tx => ({
          id: tx.id,
          userId: tx.userId,
          type: tx.type as 'deposit' | 'withdrawal',
          amount: tx.amount,
          currency: tx.currency,
          method: tx.metadata?.method || 'bank_transfer',
          transactionId: tx.id,
          paymentProofUrl: tx.metadata?.paymentProof || '',
          status: 'pending' as const,
          submittedAt: tx.createdAt,
          reference: tx.reference,
          description: tx.description,
          customerName: tx.metadata?.customerName,
          email: tx.metadata?.email,
          phoneNumber: tx.metadata?.phoneNumber,
          upiId: tx.metadata?.upiId,
          bankTransactionId: tx.metadata?.bankTransactionId,
          bankDetails: tx.metadata?.bankDetails,
          metadata: tx.metadata
        }));
      setPendingPayments(pendingPayments);
      console.log('AdminContext: Total transactions loaded:', mergedTransactions.length, 'Pending payments:', pendingPayments.length);

      // Load system stats
      if (statsResult.success && statsResult.stats) {
        setSystemStats(statsResult.stats);
        console.log('AdminContext: Loaded real system stats');
      } else {
        console.log('AdminContext: Using mock system stats');
        // Fallback to mock stats
        const mockSystemStats: SystemStats = {
          totalUsers: users.length,
          activeUsers: users.filter(u => u.status === 'active').length,
          totalRevenue: transactions.reduce((sum, tx) => sum + (tx.type === 'deposit' ? tx.amount : 0), 0),
          platformRevenue: transactions.reduce((sum, tx) => sum + (tx.type === 'bet' ? tx.amount * 0.05 : 0), 0),
          totalBets: transactions.filter(tx => tx.type === 'bet').reduce((sum, tx) => sum + tx.amount, 0),
          totalPayouts: transactions.filter(tx => tx.type === 'win').reduce((sum, tx) => sum + tx.amount, 0),
          pendingWithdrawals: transactions.filter(tx => tx.type === 'withdrawal' && tx.status === 'pending').reduce((sum, tx) => sum + tx.amount, 0),
          averageBetSize: 25.00,
          houseEdge: 0.05,
          monthlyActiveUsers: users.length,
          conversionRate: 0.85,
          churnRate: 0.05,
          averageSessionDuration: 1800,
          totalSessions: 50,
          bounceRate: 0.15,
          revenuePerUser: 50.00,
          lifetimeValue: 200.00,
          acquisitionCost: 25.00,
          retentionRate: 0.90,
          engagementScore: 0.75
        };
        setSystemStats(mockSystemStats);
      }

      // Load audit logs
      if (auditLogsResult.success && auditLogsResult.logs && auditLogsResult.logs.length > 0) {
        const convertedLogs: AuditLog[] = auditLogsResult.logs.map(log => ({
          id: log.id,
          userId: log.user_id,
          adminId: log.admin_id,
          action: log.action,
          resourceType: log.resource_type,
          resourceId: log.resource_id,
          details: log.details,
          ipAddress: log.ip_address,
          userAgent: log.user_agent,
          createdAt: new Date(log.created_at)
        }));
        setAuditLogs(convertedLogs);
        console.log('AdminContext: Loaded', convertedLogs.length, 'real audit logs');
      } else {
        console.log('AdminContext: Using mock audit logs');
        // Fallback to mock audit logs
        const mockAuditLogs: AuditLog[] = [
          {
            id: 'audit_1',
            userId: 'user_1',
            adminId: 'admin_1',
            action: 'user_login',
            resourceType: 'user',
            resourceId: 'user_1',
            details: { ip: '192.168.1.1' },
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0...',
            createdAt: new Date()
          }
        ];
        setAuditLogs(mockAuditLogs);
      }

      console.log('AdminContext: Data loading completed');
    } catch (error) {
      console.error('AdminContext: Error loading data:', error);
      // If everything fails, use mock data
      console.log('AdminContext: Falling back to mock data due to error');
    }
  };

  const refreshData = async () => {
    await loadAllData();
    toast.success('Data refreshed');
  };

  const forceRefresh = async () => {
    console.log('AdminContext: Force refreshing all data...');
    setIsLoading(true);
    try {
      // Clear current state
      setTransactions([]);
      setPendingPayments([]);
      
      // Reload everything
      await loadAllData();
      
      // Also refresh local transactions
      refreshLocalTransactions();
      
      toast.success('All data refreshed');
    } catch (error) {
      console.error('AdminContext: Force refresh error:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshLocalTransactions = () => {
    console.log('AdminContext: Refreshing local transactions...');
    try {
      const localTransactions = getLocalTransactions();
      console.log('AdminContext: Found', localTransactions.length, 'local transactions on refresh');
      
      // Update transactions state with local transactions
      setTransactions(prev => {
        const existingIds = new Set(prev.map(tx => tx.id));
        const newLocalTransactions = localTransactions.filter(tx => !existingIds.has(tx.id));
        const updatedTransactions = [...prev, ...newLocalTransactions];
        
        console.log('AdminContext: Updated transactions count:', updatedTransactions.length);
        
        // Update pending payments based on updated transactions (only show truly pending ones)
        const pendingPayments: PendingPayment[] = updatedTransactions
          .filter(tx => (tx.type === 'deposit' || tx.type === 'withdrawal') && tx.status === 'pending')
          .map(tx => ({
            id: tx.id,
            userId: tx.userId,
            type: tx.type as 'deposit' | 'withdrawal',
            amount: tx.amount,
            currency: tx.currency,
            method: tx.metadata?.method || 'bank_transfer',
            transactionId: tx.metadata?.transactionId || tx.id,
            paymentProofUrl: tx.metadata?.paymentProof || '',
            status: 'pending' as const,
            submittedAt: tx.createdAt,
            reference: tx.reference,
            description: tx.description,
            metadata: tx.metadata
          }));
        
        console.log('AdminContext: Updated pending payments count:', pendingPayments.length);
        setPendingPayments(pendingPayments);
        
        return updatedTransactions;
      });
      
      console.log('AdminContext: Local transactions refreshed successfully');
      toast.success('Local transactions refreshed');
    } catch (error) {
      console.error('AdminContext: Error refreshing local transactions:', error);
      toast.error('Failed to refresh local transactions');
    }
  };

  const getUserById = (id: string): UserManagement | null => {
    return users.find(user => user.id === id) || null;
  };

  const updateUserStatus = async (userId: string, status: 'active' | 'suspended' | 'closed') => {
    try {
      console.log('AdminContext: Updating user status:', userId, status);
      
      const result = await SupabaseAuthService.updateUser(userId, { status });
      
      if (result.success) {
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, status } : user
        ));
        
        toast.success(`User ${status} successfully`);
        console.log('AdminContext: User status updated successfully');
      } else {
        throw new Error(result.message || 'Failed to update user status');
      }
    } catch (error: any) {
      console.error('AdminContext: Update user status error:', error);
      toast.error('Failed to update user status');
      throw error;
    }
  };

  const updateUserBalance = async (userId: string, balance: number) => {
    try {
      console.log('AdminContext: Updating user balance:', userId, balance);
      
      const result = await SupabaseAuthService.updateUserBalance(userId, balance);
      
      if (result.success) {
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, balance } : user
        ));
        
        toast.success('User balance updated successfully');
        console.log('AdminContext: User balance updated successfully');
      } else {
        throw new Error(result.message || 'Failed to update user balance');
      }
    } catch (error: any) {
      console.error('AdminContext: Update user balance error:', error);
      toast.error('Failed to update user balance');
      throw error;
    }
  };

  const verifyUser = async (userId: string) => {
    try {
      console.log('AdminContext: Verifying user:', userId);
      
      const result = await SupabaseAuthService.updateUser(userId, { 
        is_verified: true,
        kyc_status: 'approved'
      });
      
      if (result.success) {
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, isVerified: true } : user
        ));
        
        toast.success('User verified successfully');
        console.log('AdminContext: User verified successfully');
      } else {
        throw new Error(result.message || 'Failed to verify user');
      }
    } catch (error: any) {
      console.error('AdminContext: Verify user error:', error);
      toast.error('Failed to verify user');
      throw error;
    }
  };

  const approveWithdrawal = async (transactionId: string) => {
    try {
      console.log('AdminContext: Approving withdrawal:', transactionId);
      
      // Update transaction status
      const { data, error } = await supabase
        .from('transactions')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw error;

      // Update pending payments
      setPendingPayments(prev => prev.filter(payment => payment.id !== transactionId));
      
      // Update transactions
      setTransactions(prev => prev.map(tx => 
        tx.id === transactionId 
          ? { ...tx, status: 'completed', completedAt: new Date() }
          : tx
      ));

      toast.success('Withdrawal approved successfully');
      console.log('AdminContext: Withdrawal approved successfully');
    } catch (error: any) {
      console.error('AdminContext: Approve withdrawal error:', error);
      toast.error('Failed to approve withdrawal');
      throw error;
    }
  };

  const rejectWithdrawal = async (transactionId: string, reason: string) => {
    try {
      console.log('AdminContext: Rejecting withdrawal:', transactionId, reason);
      
      // Update transaction status
      const { data, error } = await supabase
        .from('transactions')
        .update({ 
          status: 'failed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: { rejection_reason: reason }
        })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw error;

      // Update pending payments
      setPendingPayments(prev => prev.filter(payment => payment.id !== transactionId));
      
      // Update transactions
      setTransactions(prev => prev.map(tx => 
        tx.id === transactionId 
          ? { ...tx, status: 'failed', completedAt: new Date() }
          : tx
      ));

      toast.success('Withdrawal rejected successfully');
      console.log('AdminContext: Withdrawal rejected successfully');
    } catch (error: any) {
      console.error('AdminContext: Reject withdrawal error:', error);
      toast.error('Failed to reject withdrawal');
      throw error;
    }
  };

  const approveDeposit = async (paymentId: string) => {
    try {
      console.log('AdminContext: Approving deposit:', paymentId);
      
      // Find the pending payment
      const payment = pendingPayments.find(p => p.id === paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Create deposit transaction with unique reference (always unique)
      const approvalReference = `APPROVED_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${paymentId}`;
      const transactionData = {
        user_id: payment.userId,
        type: 'deposit',
        amount: payment.amount,
        currency: payment.currency,
        status: 'completed',
        description: `Deposit via ${payment.method} - Approved by admin`,
        reference: approvalReference,
        metadata: {
          method: payment.method,
          originalTransactionId: payment.transactionId,
          originalReference: payment.reference,
          approvedBy: adminUser?.id,
          approvedAt: new Date().toISOString(),
          originalPaymentId: paymentId
        },
        completed_at: new Date().toISOString()
      };

      const result = await SupabaseAuthService.createTransaction(transactionData);
      if (!result.success) {
        console.log('AdminContext: Supabase failed, updating local transaction only');
        // If Supabase fails, just update local storage
        updateLocalTransactionStatus(paymentId, 'completed', {
          approvedBy: adminUser?.id,
          approvedAt: new Date().toISOString(),
          approvalReference: approvalReference,
          supabaseError: result.message
        });
        
        // Update pending payments
        setPendingPayments(prev => prev.filter(p => p.id !== paymentId));
        toast.success('Deposit approved (stored locally - Supabase unavailable)');
        return;
      }

      // Update user balance
      const balanceResult = await SupabaseAuthService.updateUserBalance(
        payment.userId, 
        payment.amount
      );
      if (!balanceResult.success) {
        throw new Error('Failed to update user balance');
      }

      // Update local storage to mark transaction as approved
      updateLocalTransactionStatus(paymentId, 'completed', {
        approvedBy: adminUser?.id,
        approvedAt: new Date().toISOString(),
        approvalReference: approvalReference
      });

      // Update pending payments
      setPendingPayments(prev => prev.filter(p => p.id !== paymentId));
      
      // Update transactions
      setTransactions(prev => [{
        id: result.transaction!.id,
        userId: result.transaction!.user_id,
        type: result.transaction!.type,
        status: result.transaction!.status,
        amount: result.transaction!.amount,
        currency: result.transaction!.currency,
        fee: 0,
        method: payment.method,
        description: result.transaction!.description,
        reference: result.transaction!.reference,
        createdAt: new Date(result.transaction!.created_at),
        completedAt: new Date(result.transaction!.completed_at!),
        updatedAt: new Date(result.transaction!.updated_at),
        metadata: result.transaction!.metadata
      }, ...prev]);

      // Log audit event
      await SupabaseAuthService.logAuditEvent(
        'deposit_approved',
        'transaction',
        paymentId,
        { status: 'pending' },
        { status: 'completed', approvedBy: adminUser?.id }
      );

      toast.success('Deposit approved successfully!');
    } catch (error) {
      console.error('AdminContext: Failed to approve deposit:', error);
      toast.error('Failed to approve deposit');
      throw error;
    }
  };

  const rejectDeposit = async (paymentId: string, reason: string) => {
    try {
      console.log('AdminContext: Rejecting deposit:', paymentId, reason);
      
      // Find the pending payment
      const payment = pendingPayments.find(p => p.id === paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Create failed transaction record
      const transactionData = {
        user_id: payment.userId,
        type: 'deposit',
        amount: payment.amount,
        currency: payment.currency,
        status: 'failed',
        description: `Deposit via ${payment.method} - Rejected by admin`,
        reference: payment.transactionId,
        metadata: {
          method: payment.method,
          transactionId: payment.transactionId,
          rejectionReason: reason,
          rejectedBy: adminUser?.id,
          rejectedAt: new Date().toISOString()
        },
        completed_at: new Date().toISOString()
      };

      const result = await SupabaseAuthService.createTransaction(transactionData);
      if (!result.success) {
        throw new Error(result.message || 'Failed to create transaction');
      }

      // Update local storage to mark transaction as rejected
      updateLocalTransactionStatus(paymentId, 'failed', {
        rejectedBy: adminUser?.id,
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason
      });

      // Update pending payments
      setPendingPayments(prev => prev.filter(p => p.id !== paymentId));
      
      // Update transactions
      setTransactions(prev => [{
        id: result.transaction!.id,
        userId: result.transaction!.user_id,
        type: result.transaction!.type,
        status: result.transaction!.status,
        amount: result.transaction!.amount,
        currency: result.transaction!.currency,
        fee: 0,
        method: payment.method,
        description: result.transaction!.description,
        reference: result.transaction!.reference,
        createdAt: new Date(result.transaction!.created_at),
        completedAt: new Date(result.transaction!.completed_at!),
        updatedAt: new Date(result.transaction!.updated_at),
        metadata: result.transaction!.metadata
      }, ...prev]);

      // Log audit event
      await SupabaseAuthService.logAuditEvent(
        'deposit_rejected',
        'transaction',
        paymentId,
        { status: 'pending' },
        { status: 'failed', reason, rejectedBy: adminUser?.id }
      );

      toast.success('Deposit rejected');
    } catch (error) {
      console.error('AdminContext: Failed to reject deposit:', error);
      toast.error('Failed to reject deposit');
      throw error;
    }
  };

  return (
    <AdminContext.Provider value={{
      adminUser,
      isLoading,
      error,
      users,
      transactions,
      pendingPayments,
      systemStats,
      games,
      riskAlerts,
      auditLogs,
      financialReports,
      adminLogin,
      adminLogout,
      getUserById,
      updateUserStatus,
      updateUserBalance,
      verifyUser,
      approveWithdrawal,
      rejectWithdrawal,
      approveDeposit,
      rejectDeposit,
      loadAllData,
      refreshData,
      refreshLocalTransactions,
      forceRefresh
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
