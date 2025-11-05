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

  // Periodic refresh
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('AdminContext: Periodic refresh of admin data');
      loadAllData();
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
      localStorage.removeItem('elitebet_admin_session');
      
      setAdminUser(null);
      setUsers([]);
      setTransactions([]);
      setPendingPayments([]);
      setAuditLogs([]);
      
      toast.success('Admin logged out');
      console.log('AdminContext: Admin logout successful');
      
      // Redirect to admin login page
      window.location.href = '/admin/login';
    } catch (error) {
      console.error('AdminContext: Logout error:', error);
      // Still redirect even if there's an error
      window.location.href = '/admin/login';
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
      console.log('AdminContext: Loading admin data from backend...');

      const useBackend = (import.meta as any).env.VITE_USE_BACKEND_AUTH === 'true';
      let backendDeposits: any[] = [];
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const backendResponse = await fetch(`${backendUrl}/api/betting/admin/pending-deposits`);
        if (backendResponse.ok) {
          const backendData = await backendResponse.json();
          if (backendData.success && backendData.deposits) {
            backendDeposits = backendData.deposits;
            console.log('AdminContext: Loaded', backendDeposits.length, 'pending deposits from MongoDB backend');
          }
        }
      } catch (backendError) {
        console.log('AdminContext: MongoDB backend not available:', backendError);
      }

      // Load users from MongoDB backend directly
      let loadedUsers: UserManagement[] = [];
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      
      try {
        // Fetch all users from MongoDB backend
        const usersResponse = await fetch(`${backendUrl}/api/betting/admin/users`);
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          if (usersData.success && usersData.users && usersData.users.length > 0) {
            loadedUsers = usersData.users.map((user: any) => ({
              id: user.id,
              email: user.email || '',
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              balance: user.balance || 0,
              status: (user.status || 'active') as 'active' | 'suspended' | 'closed',
              isVerified: user.isVerified || true,
              registrationDate: new Date(user.createdAt),
              lastLogin: new Date(user.lastLogin || user.createdAt),
              totalDeposited: user.totalDeposited || 0,
              totalWithdrawn: user.totalWithdrawn || 0,
              totalWagered: user.totalWagered || 0,
              activeBets: 0,
              country: user.country || 'Unknown',
              riskLevel: (user.riskLevel || 'low') as 'low' | 'medium' | 'high'
            }));
            
            setUsers(loadedUsers);
            console.log('AdminContext: Loaded', loadedUsers.length, 'users from MongoDB with balances');
            console.log('Total platform balance:', loadedUsers.reduce((sum, u) => sum + u.balance, 0));
          }
        }
      } catch (err) {
        console.error('AdminContext: Error fetching users from MongoDB:', err);
      }
      
      if (loadedUsers.length === 0) {
        console.log('AdminContext: No users loaded from MongoDB, using fallback');
        // Fallback to mock data if no real users
        loadedUsers = [
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
        setUsers(loadedUsers);
      }

      // Load transactions from MongoDB backend
      let allTransactions: Transaction[] = [];
      
      try {
        // Fetch all transactions from MongoDB backend
        const transactionsResponse = await fetch(`${backendUrl}/api/betting/admin/transactions`);
        if (transactionsResponse.ok) {
          const txData = await transactionsResponse.json();
          if (txData.success && txData.transactions && txData.transactions.length > 0) {
            allTransactions = txData.transactions.map((tx: any) => ({
              id: tx.id,
              userId: tx.userId,
              type: tx.type as 'deposit' | 'withdrawal' | 'bet' | 'win' | 'refund' | 'fee',
              amount: tx.amount,
              currency: tx.currency || 'INR',
              status: tx.status as 'pending' | 'completed' | 'failed' | 'cancelled',
              description: tx.description || '',
              reference: tx.reference || '',
              createdAt: new Date(tx.createdAt),
              completedAt: tx.completedAt ? new Date(tx.completedAt) : undefined,
              updatedAt: new Date(tx.updatedAt),
              metadata: tx.metadata || {}
            }));
            console.log('AdminContext: Loaded', allTransactions.length, 'transactions from MongoDB backend');
          }
        }
      } catch (err) {
        console.error('AdminContext: Error fetching transactions from MongoDB:', err);
      }
      
      // Do not fallback to Supabase when backend auth is enabled
      
      // Use MongoDB transactions directly
      console.log('AdminContext: Total transactions from MongoDB:', allTransactions.length);
      setTransactions(allTransactions);
      
      // Extract pending payments from all transactions
      const pendingPayments: PendingPayment[] = allTransactions
        .filter(tx => (tx.type === 'deposit' || tx.type === 'withdrawal') && tx.status === 'pending')
        .map(tx => ({
          id: tx.id,
          userId: tx.userId,
          type: tx.type as 'deposit' | 'withdrawal',
          amount: tx.amount,
          currency: tx.currency,
          method: tx.metadata?.method || 'bank_transfer',
          transactionId: tx.id,
          paymentProofUrl: tx.metadata?.paymentProofUrl || tx.metadata?.paymentProof || '',
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
      console.log('AdminContext: Total transactions loaded:', allTransactions.length, 'Pending payments:', pendingPayments.length);

      // Calculate REAL system stats from allTransactions (MongoDB + Supabase)
      console.log('AdminContext: Calculating REAL system stats from', allTransactions.length, 'transactions');
      
      // Calculate today's amounts
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayDeposits = allTransactions.filter(tx => 
        tx.type === 'deposit' && 
        tx.status === 'completed' && 
        new Date(tx.createdAt) >= today
      ).reduce((sum, tx) => sum + tx.amount, 0);
      
      const todayWithdrawals = allTransactions.filter(tx => 
        tx.type === 'withdrawal' && 
        tx.status === 'completed' && 
        new Date(tx.createdAt) >= today
      ).reduce((sum, tx) => sum + tx.amount, 0);
      
      // Calculate totals
      const totalDeposits = allTransactions
        .filter(tx => tx.type === 'deposit' && tx.status === 'completed')
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      const totalWithdrawals = allTransactions
        .filter(tx => tx.type === 'withdrawal' && tx.status === 'completed')
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      const totalBets = allTransactions
        .filter(tx => tx.type === 'bet' && tx.status === 'completed')
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      
      const totalWinnings = allTransactions
        .filter(tx => tx.type === 'win' && tx.status === 'completed')
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      // Platform revenue = sum of all user wallet balances (total money held by platform)
      // Use loadedUsers array which has the MongoDB balances
      const platformRevenue = loadedUsers.reduce((sum, u) => sum + (u.balance || 0), 0);
      
      console.log('AdminContext: Platform revenue calculated from', loadedUsers.length, 'users: ₹' + platformRevenue);
      
      const pendingDepositsCount = allTransactions.filter(tx => 
        tx.type === 'deposit' && tx.status === 'pending'
      ).length;
      
      const pendingWithdrawalsCount = allTransactions.filter(tx => 
        tx.type === 'withdrawal' && tx.status === 'pending'
      ).length;
      
      const realSystemStats: SystemStats = {
        totalUsers: loadedUsers.length,
        activeUsers: loadedUsers.filter(u => u.status === 'active').length,
        totalDeposits,
        totalWithdrawals,
        totalBets,
        totalWinnings,
        platformRevenue, // Now calculated from user wallet balances
        pendingWithdrawals: pendingWithdrawalsCount,
        pendingVerifications: 0,
        systemHealth: 'healthy' as const
      };
      
      setSystemStats(realSystemStats);
      console.log('AdminContext: Calculated REAL stats:', realSystemStats);
      console.log("Today's deposits:", todayDeposits);
      console.log("Today's withdrawals:", todayWithdrawals);

      // Audit logs not yet implemented in backend; keep empty for now
      setAuditLogs([]);

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
      
      // Update in MongoDB backend (persists the change)
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const backendResponse = await fetch(`${backendUrl}/api/betting/admin/update-user-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status })
      });

      const backendData = await backendResponse.json();
      
      if (!backendData.success) {
        throw new Error(backendData.message || 'Failed to update user status');
      }

      console.log('✅ AdminContext: User status updated in MongoDB:', backendData);

      // Also update in Supabase (if using dual storage)
      try {
        await SupabaseAuthService.updateUser(userId, { status });
      } catch (supabaseError) {
        console.warn('Supabase update failed (non-critical):', supabaseError);
      }
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status } : user
      ));
      
      toast.success(`User ${status} successfully - persisted to database`);
      console.log('AdminContext: User status updated successfully');
    } catch (error: any) {
      console.error('AdminContext: Update user status error:', error);
      toast.error('Failed to update user status: ' + error.message);
      throw error;
    }
  };

  const updateUserBalance = async (userId: string, balance: number) => {
    try {
      console.log('AdminContext: Updating user balance:', userId, balance);
      // Backend balance adjustment uses delta amount
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const current = users.find(u => u.id === userId)?.balance || 0;
      const delta = balance - current;
      const resp = await fetch(`${backendUrl}/api/betting/balance/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount: delta, reason: 'Admin balance update' })
      });
      if (!resp.ok) throw new Error('Backend balance update failed');

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, balance } : user
      ));
      toast.success('User balance updated successfully');
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
      console.log('AdminContext: Approving withdrawal (backend):', transactionId);

      const tx = transactions.find(t => t.id === transactionId);
      if (!tx) throw new Error('Transaction not found');

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const resp = await fetch(`${backendUrl}/api/betting/admin/approve-withdrawal/${transactionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.abs(tx.amount), userId: tx.userId })
      });
      if (!resp.ok) throw new Error('Backend approval failed');

      // Update local state
      setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, status: 'completed', completedAt: new Date() } : t));
      setPendingPayments(prev => prev.filter(p => p.id !== transactionId));
      toast.success('Withdrawal approved');
    } catch (error: any) {
      console.error('AdminContext: Approve withdrawal error:', error);
      toast.error('Failed to approve withdrawal');
      throw error;
    }
  };

  const rejectWithdrawal = async (transactionId: string, reason: string) => {
    try {
      console.log('AdminContext: Rejecting withdrawal (backend):', transactionId, reason);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const resp = await fetch(`${backendUrl}/api/betting/admin/reject-withdrawal/${transactionId}`, { method: 'POST' });
      if (!resp.ok) throw new Error('Backend rejection failed');
      setPendingPayments(prev => prev.filter(payment => payment.id !== transactionId));
      setTransactions(prev => prev.map(tx => tx.id === transactionId ? { ...tx, status: 'failed', completedAt: new Date() } : tx));
      toast.success('Withdrawal rejected');
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

      // Try MongoDB backend first
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      try {
        const backendResponse = await fetch(`${backendUrl}/api/betting/admin/approve-deposit/${paymentId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: payment.amount,
            userId: payment.userId
          })
        });
        
        if (backendResponse.ok) {
          const backendResult = await backendResponse.json();
          console.log('AdminContext: Backend approved successfully:', backendResult);
          
          // Update pending payments
          setPendingPayments(prev => prev.filter(p => p.id !== paymentId));
          toast('Deposit approved', { 
            icon: '✅',
            position: 'bottom-right',
            duration: 2000
          });
          await loadAllData(); // Refresh data
          return;
        }
      } catch (backendError) {
        console.log('AdminContext: Backend approval failed, trying Supabase:', backendError);
      }

      // Fallback to Supabase
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
        toast('Deposit approved', { 
          icon: '✅',
          position: 'bottom-right',
          duration: 2000
        });
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

      toast('Deposit approved', { 
        icon: '✅',
        position: 'bottom-right',
        duration: 2000
      });
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
      // Backend: mark deposit as failed
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const resp = await fetch(`${backendUrl}/api/betting/admin/reject-deposit/${paymentId}`, { method: 'POST' });
      if (!resp.ok) throw new Error('Backend rejection failed');

      setPendingPayments(prev => prev.filter(p => p.id !== paymentId));
      setTransactions(prev => prev.map(t => t.id === paymentId ? { ...t, status: 'failed', completedAt: new Date() } : t));
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
