import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WalletAccount, Transaction, PaymentMethod, DepositRequest, WithdrawRequest, WalletLimits, WalletStats, PendingPayment } from '../types/wallet';
import { useAuth } from './SupabaseAuthContext';
import { SupabaseAuthService } from '../services/supabaseAuthService';
import toast from 'react-hot-toast';
import { logger } from '../utils/logger';

interface WalletContextType {
  accounts: WalletAccount[];
  transactions: Transaction[];
  pendingPayments: PendingPayment[];
  paymentMethods: PaymentMethod[];
  limits: WalletLimits;
  stats: WalletStats;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  deposit: (request: DepositRequest) => Promise<Transaction>;
  withdraw: (request: WithdrawRequest) => Promise<Transaction>;
  submitManualDeposit: (request: DepositRequest) => Promise<PendingPayment>;
  submitManualWithdraw: (request: WithdrawRequest) => Promise<PendingPayment>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  getBalance: (currency?: string) => number;
  getTransactions: (limit?: number) => Transaction[];
  refreshWallet: () => Promise<void>;
  transferFunds: (fromCurrency: string, toCurrency: string, amount: number) => Promise<void>;
  processBet: (amount: number, gameType: string, description?: string, metadata?: any) => Promise<{ betId?: string } | void>;
  processWin: (amount: number, gameType: string, description?: string, metadata?: any) => Promise<void>;
  processLoss: (betId: string, gameType: string, metadata?: any) => Promise<void>;
  validateBalance: (amount: number) => boolean;
  getAvailableBalance: () => number;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user, updateBalance } = useAuth();
  const useBackend = (import.meta as any).env?.VITE_USE_BACKEND_AUTH === 'true';
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enhanced payment methods with realistic options
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'union_bank_india',
      name: 'Union Bank of India',
      type: 'bank',
      icon: '🏦',
      processingTime: '1-2 business days',
      fee: 'Free',
      minAmount: 100,
      maxAmount: 50000,
      available: true,
      currencies: ['INR', 'USD'],
      description: 'Union Bank of India - Manual verification',
      bankDetails: {
        bankName: 'Union Bank of India',
        accountName: 'Elite Bet Holdings Ltd',
        accountNumber: '034312010001727',
        ifscCode: 'UBIN0803430',
        phoneNumber: '8712243286',
        branchName: 'Main Branch'
      }
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      type: 'bank',
      icon: '🏦',
      processingTime: '1-3 business days',
      fee: 'Free',
      minAmount: 50,
      maxAmount: 10000,
      available: true,
      currencies: ['INR', 'USD'],
      description: 'Direct bank transfer'
    },
    {
      id: 'credit_card',
      name: 'Credit Card',
      type: 'card',
      icon: '💳',
      processingTime: 'Instant',
      fee: '2.9%',
      minAmount: 10,
      maxAmount: 5000,
      available: true,
      currencies: ['INR', 'USD'],
      description: 'Visa, Mastercard, American Express'
    },
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      type: 'crypto',
      icon: '₿',
      processingTime: '10-30 minutes',
      fee: '1%',
      minAmount: 20,
      maxAmount: 50000,
      available: true,
      currencies: ['INR', 'USD'],
      description: 'Bitcoin, Ethereum, USDT'
    },
    {
      id: 'ewallet',
      name: 'E-Wallet',
      type: 'ewallet',
      icon: '📱',
      processingTime: 'Instant',
      fee: '1.5%',
      minAmount: 5,
      maxAmount: 2500,
      available: true,
      currencies: ['INR', 'USD'],
      description: 'PayPal, Skrill, Neteller'
    }
  ];

  // Get wallet limits based on user verification status
  const getLimits = (): WalletLimits => {
    const isVerified = user?.isVerified || false;
    return {
      dailyDepositLimit: isVerified ? 50000 : 5000,
      dailyWithdrawLimit: isVerified ? 25000 : 2500,
      monthlyDepositLimit: isVerified ? 500000 : 50000,
      monthlyWithdrawLimit: isVerified ? 250000 : 25000,
      minDeposit: 10,
      minWithdraw: 20,
      maxDeposit: isVerified ? 50000 : 5000,
      maxWithdraw: isVerified ? 25000 : 2500
    };
  };

  const limits = getLimits();

  // Load user data from Supabase
  const loadUserData = useCallback(async () => {
    if (!user) {
      console.log('WalletContext: No user, skipping data load');
      return;
    }

    try {
      setIsLoading(true);
      console.log('WalletContext: Loading data for user:', user.id);

      // Load transactions from localStorage first (for persistence)
      const localStorageKey = `demo_user_transactions_${user.id}`;
      const savedTransactions = localStorage.getItem(localStorageKey);
      let allTransactions: Transaction[] = [];
      
      if (savedTransactions) {
        try {
          const parsed = JSON.parse(savedTransactions);
          allTransactions = parsed.map((tx: any) => ({
            ...tx,
            createdAt: new Date(tx.createdAt),
            updatedAt: new Date(tx.updatedAt),
            completedAt: tx.completedAt ? new Date(tx.completedAt) : undefined
          }));
          console.log('WalletContext: Loaded', allTransactions.length, 'transactions from localStorage');
        } catch (error) {
          console.error('WalletContext: Error parsing saved transactions:', error);
        }
      }
      
      // Try to fetch from MongoDB backend FIRST
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api/betting';
        const backendResponse = await fetch(`${backendUrl}/transactions/${user.id}`);
        
        if (backendResponse.ok) {
          const backendData = await backendResponse.json();
          if (backendData.success && backendData.transactions) {
            
            const backendTransactions: Transaction[] = backendData.transactions.map((tx: any) => ({
              id: tx._id || tx.id,
              userId: tx.userId,
              type: tx.type as 'deposit' | 'withdrawal' | 'bet' | 'win' | 'refund' | 'fee',
              amount: tx.amount,
              currency: tx.currency || 'INR',
              status: tx.status as 'pending' | 'completed' | 'failed' | 'cancelled',
              fee: 0,
              method: tx.metadata?.method || 'unknown',
              description: tx.description,
              reference: tx.reference,
              createdAt: new Date(tx.createdAt || tx.created_at),
              completedAt: tx.completedAt ? new Date(tx.completedAt) : undefined,
              updatedAt: new Date(tx.updatedAt || tx.updated_at),
              metadata: tx.metadata || {}
            }));
            
            // Merge backend transactions with local storage (current user only)
            allTransactions = [
              ...allTransactions,
              ...backendTransactions.filter(t => t.userId === user.id)
            ];
          }
        } else if (backendResponse.status === 429) {
          console.log('WalletContext: Rate limited, skipping transaction fetch');
        }

        // Also fetch live balance from backend and sync main INR account
        try {
          const balResp = await fetch(`${backendUrl}/balance/${user.id}`, { headers: { 'Cache-Control': 'no-cache' }});
          if (balResp.ok) {
            const balData = await balResp.json();
            if (balData && typeof balData.balance === 'number') {
              setAccounts(prev => {
                // ensure a main INR account exists
                const hasMainInr = prev.some(acc => acc.currency === 'INR' && acc.accountType === 'main');
                const updated: WalletAccount[] = hasMainInr ? prev.map(acc =>
                  acc.currency === 'INR' && acc.accountType === 'main'
                    ? { ...acc, balance: balData.balance, updatedAt: new Date() }
                    : acc
                ) : [
                  ...prev,
                  {
                    id: `acc_${user.id}_inr_main`,
                    userId: user.id,
                    currency: 'INR',
                    accountType: 'main',
                    balance: balData.balance,
                    reservedBalance: 0,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                  }
                ];
                return updated;
              });
            }
          }
        } catch (e) {
          console.log('WalletContext: Could not fetch backend balance (non-fatal)');
        }
      } catch (backendError) {
        console.log('WalletContext: MongoDB backend not available, trying Supabase:', backendError);
      }
      
      // Skip Supabase fetch when backend auth is enabled
      if (!useBackend) {
        try {
          const supabasePromise = SupabaseAuthService.getUserTransactions(user.id);
          const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 2000));
          const transactionsRaceResult = await Promise.race([supabasePromise, timeoutPromise]);
          const transactionsResult: any = transactionsRaceResult as any;
          if (transactionsResult && typeof transactionsResult === 'object' && 'success' in transactionsResult) {
            if (transactionsResult.success && Array.isArray(transactionsResult.transactions)) {
              const convertedTransactions: Transaction[] = (transactionsResult.transactions as any[]).map((tx: any) => ({
                id: tx.id,
                userId: tx.user_id,
                type: tx.type as 'deposit' | 'withdrawal' | 'bet' | 'win' | 'refund' | 'fee',
                amount: tx.amount,
                currency: tx.currency,
                status: tx.status as 'pending' | 'completed' | 'failed' | 'cancelled',
                fee: 0,
                method: tx.metadata?.method || 'unknown',
                description: tx.description,
                reference: tx.reference,
                createdAt: new Date(tx.created_at),
                completedAt: tx.completed_at ? new Date(tx.completed_at) : undefined,
                updatedAt: new Date(tx.updated_at),
                metadata: tx.metadata
              }));
              allTransactions = [...allTransactions, ...convertedTransactions];
            }
          }
        } catch {
          // ignore
        }
      }
      
      // Normalize: keep only this user's transactions and remove duplicates
      const normalizedForUser = allTransactions.filter(tx => tx && tx.userId === user.id);

      // Robust de-duplication: prefer id, then reference, else a fallback composite key
      const seen = new Set<string>();
      const uniqueTransactions: Transaction[] = [];
      for (const tx of normalizedForUser) {
        const key = (tx.id && String(tx.id))
          || (tx.reference && `ref:${tx.reference}`)
          || `${tx.type}:${tx.amount}:${new Date(tx.createdAt).getTime()}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueTransactions.push(tx);
        }
      }

      // Sort newest first
      uniqueTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTransactions(uniqueTransactions);

      // Also refresh balance immediately to sync with backend
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api/betting';
      try {
        const balResp = await fetch(`${backendUrl}/balance/${user.id}`, { headers: { 'Cache-Control': 'no-cache' } });
        if (balResp.ok) {
          const balData = await balResp.json();
          if (balData.success && typeof balData.balance === 'number') {
            setAccounts(prev => prev.map(acc =>
              acc.currency === 'INR' && acc.accountType === 'main'
                ? { ...acc, balance: balData.balance, updatedAt: new Date() }
                : acc
            ));
            if (updateBalance) await updateBalance(balData.balance);
          }
        }
      } catch {}

      // Extract pending payments from all transactions
      const pendingPayments: PendingPayment[] = allTransactions
        .filter(tx => (tx.type === 'deposit' || tx.type === 'withdrawal') && tx.status === 'pending')
        .map(tx => ({
          id: tx.id,
          userId: tx.userId,
          type: tx.type as 'deposit' | 'withdrawal',
          amount: tx.amount,
          currency: tx.currency,
          method: tx.method,
          transactionId: tx.metadata?.transactionId || '',
          paymentProofUrl: tx.metadata?.paymentProof || '',
          bankDetails: tx.metadata?.bankDetails,
          status: 'pending' as const,
          submittedAt: tx.createdAt,
          reviewedAt: undefined,
          reference: tx.reference,
          description: tx.description,
          metadata: tx.metadata
        }));
      setPendingPayments(pendingPayments);
      // Suppressed: console.log('WalletContext: Transactions loaded successfully. Total:', allTransactions.length);

      // ALWAYS fetch balance from MongoDB backend FIRST
      // Suppressed: console.log('WalletContext: Fetching balance for user:', user.id);
      let userBalance = 0; // Start with 0 to force backend fetch
      
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api/betting';
        // Suppressed logs to reduce console spam
        // logger.log('WalletContext: Fetching from:', `${backendUrl}/balance/${user.id}`);
        
        const balanceResponse = await fetch(`${backendUrl}/balance/${user.id}`, { headers: { 'Cache-Control': 'no-cache' } });
        
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          console.log('[DEBUG] GET /balance response:', balanceData);
          
          if (balanceData.success && balanceData.balance !== undefined) {
            userBalance = balanceData.balance;
            logger.log('✅ Got balance from backend:', userBalance);
            
            // ALWAYS update auth context with backend balance
            if (updateBalance) {
              await updateBalance(userBalance);
            }
          }
        }
      } catch (backendError) {
        // Only log errors
        logger.error('WalletContext: Could not fetch balance:', backendError);
        // Fallback to user.balance only if backend completely fails
        userBalance = user.balance || 0;
      }
      
      // logger.log('WalletContext: Final balance for accounts:', userBalance);
      const userAccounts: WalletAccount[] = [
        {
          id: 'main',
          userId: user.id,
          currency: user.currency || 'INR',
          accountType: 'main',
          balance: userBalance,
          reservedBalance: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      setAccounts(userAccounts);
      // Suppressed logs
      // logger.log('WalletContext: Accounts set with balance:', userBalance);

      logger.log('WalletContext: Data loaded successfully');
    } catch (error) {
      logger.error('WalletContext: Failed to load data:', error);
      setError('Failed to load wallet data');
    } finally {
      logger.log('WalletContext: Setting isLoading to false');
      setIsLoading(false);
    }
  }, [user?.id]); // Only depend on user ID to prevent infinite loops

  // Initialize accounts when user changes
  useEffect(() => {
    if (user) {
      logger.log('WalletContext: User changed, loading data for:', user.id);
      loadUserData();
    } else {
      logger.log('WalletContext: No user, clearing data');
      // Clear all data when user logs out
      setAccounts([]);
      setTransactions([]);
      setPendingPayments([]);
      setError(null);
      setIsLoading(false);
    }
  }, [user?.id, loadUserData]);

  // Auto-refresh wallet data every 30 seconds (reduced frequency to prevent crashes)
  useEffect(() => {
    if (!user) return;
    
    let interval: NodeJS.Timeout;
    let isActive = true;
    
    const fetchBalance = async () => {
      if (!isActive) return;
      
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api/betting';
        
        // Fetch BOTH balance AND transactions
        const [balanceResponse, transactionsResponse] = await Promise.all([
          fetch(`${backendUrl}/balance/${user.id}`),
          fetch(`${backendUrl}/transactions/${user.id}`)
        ]);
        
        if (!isActive) return;
        
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          if (balanceData.success && balanceData.balance !== undefined) {
            // Update account balance directly
            setAccounts(prev => prev.map(acc => 
              acc.accountType === 'main' 
                ? { ...acc, balance: balanceData.balance, updatedAt: new Date() }
                : acc
            ));
            
            // Update auth context
            if (updateBalance) {
              await updateBalance(balanceData.balance);
            }
          }
        }
        
        // Update transactions if available
        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json();
          if (transactionsData.success && transactionsData.transactions) {
            const backendTransactions: Transaction[] = transactionsData.transactions.map((tx: any) => ({
              id: tx._id || tx.id,
              userId: tx.userId,
              type: tx.type as 'deposit' | 'withdrawal' | 'bet' | 'win' | 'refund' | 'fee',
              amount: tx.amount,
              currency: tx.currency || 'INR',
              status: tx.status as 'pending' | 'completed' | 'failed' | 'cancelled',
              fee: 0,
              method: tx.metadata?.method || 'unknown',
              description: tx.description,
              reference: tx.reference,
              createdAt: new Date(tx.createdAt || tx.created_at),
              completedAt: tx.completedAt ? new Date(tx.completedAt) : undefined,
              updatedAt: new Date(tx.updatedAt || tx.updated_at),
              metadata: tx.metadata || {}
            }));
            
            // Update transactions - REPLACE ALL to avoid memory leak
            setTransactions(backendTransactions);
          }
        }
      } catch (error) {
        // Silent fail to prevent console spam
      }
    };
    
    // Fetch immediately on mount
    fetchBalance();
    
    // Then fetch every 60 seconds (reduced frequency to prevent crashes)
    interval = setInterval(fetchBalance, 60000);
    
    return () => {
      isActive = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only depend on user ID to prevent infinite loops
  
  // Sync from auth user's balance ONLY for demo account to avoid overwriting backend value
  useEffect(() => {
    if (user?.email === 'demo@spinzos.com' && accounts.length > 0) {
      console.log('WalletContext: Syncing (demo) account balance with user balance:', user.balance);
      setAccounts(prev => prev.map(acc => 
        acc.accountType === 'main' 
          ? { ...acc, balance: user.balance, updatedAt: new Date() }
          : acc
      ));
    }
  }, [user?.balance, user?.email, accounts.length]);

  // Safety timeout to prevent stuck loading state
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.log('WalletContext: Safety timeout - forcing isLoading to false');
        setIsLoading(false);
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  // Get wallet stats
  const getStats = (): WalletStats => {
    const totalDeposited = transactions
      .filter(t => t.type === 'deposit' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalWithdrawn = transactions
      .filter(t => t.type === 'withdrawal' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalWagered = transactions
      .filter(t => t.type === 'bet' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalWon = transactions
      .filter(t => t.type === 'win' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalDeposited,
      totalWithdrawn,
      totalWagered,
      totalWon,
      pendingWithdrawals: pendingPayments.filter(p => p.type === 'withdrawal').length,
      activeBets: transactions.filter(t => t.type === 'bet' && t.status === 'pending').length,
      todayDeposited: transactions
        .filter(t => t.type === 'deposit' && t.status === 'completed' && 
          new Date(t.createdAt).toDateString() === new Date().toDateString())
        .reduce((sum, t) => sum + t.amount, 0),
      todayWithdrawn: transactions
        .filter(t => t.type === 'withdrawal' && t.status === 'completed' && 
          new Date(t.createdAt).toDateString() === new Date().toDateString())
        .reduce((sum, t) => sum + t.amount, 0),
      monthDeposited: transactions
        .filter(t => t.type === 'deposit' && t.status === 'completed' && 
          new Date(t.createdAt).getMonth() === new Date().getMonth())
        .reduce((sum, t) => sum + t.amount, 0),
      monthWithdrawn: transactions
        .filter(t => t.type === 'withdrawal' && t.status === 'completed' && 
          new Date(t.createdAt).getMonth() === new Date().getMonth())
        .reduce((sum, t) => sum + t.amount, 0),
      totalDeposits: transactions.filter(t => t.type === 'deposit').length
    };
  };

  const stats = getStats();

  // Deposit function
  const deposit = async (request: DepositRequest): Promise<Transaction> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      console.log('WalletContext: Processing deposit:', request);

      // Create transaction in Supabase
      const transactionData = {
        user_id: user.id,
        type: 'deposit' as const,
        amount: request.amount,
        currency: request.currency || 'INR',
        status: 'completed' as const,
        description: `Deposit via ${request.method}`,
        reference: `DEP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          method: request.method,
          paymentMethodId: request.paymentMethodId,
          ...request.metadata
        }
      };

      const result = await SupabaseAuthService.createTransaction(transactionData);
      if (!result.success || !result.transaction) {
        throw new Error(result.message || 'Failed to create deposit transaction');
      }

      // Update user balance
      const newBalance = (user.balance || 0) + request.amount;
      await updateBalance(newBalance);

      // Convert to our Transaction type
      const transaction: Transaction = {
        id: result.transaction.id || `local_${Date.now()}`,
        userId: result.transaction.user_id || user?.id || '',
        type: result.transaction.type || 'deposit',
        amount: result.transaction.amount || 0,
        currency: result.transaction.currency || 'INR',
        status: result.transaction.status || 'pending',
        fee: 0,
        method: result.transaction.metadata?.method || 'unknown',
        description: result.transaction.description || 'Manual transaction',
        reference: result.transaction.reference || `TXN_${Date.now()}`,
        createdAt: new Date(result.transaction.created_at || new Date().toISOString()),
        completedAt: result.transaction.completed_at ? new Date(result.transaction.completed_at) : undefined,
        updatedAt: new Date(result.transaction.updated_at || new Date().toISOString()),
        metadata: result.transaction.metadata
      };

      // Update local state
      setTransactions(prev => [transaction, ...prev]);
      setAccounts(prev => prev.map(acc => 
        acc.currency === request.currency 
          ? { ...acc, balance: acc.balance + request.amount }
          : acc
      ));

      toast.success(`Deposit of ${request.amount} ${request.currency} successful!`);
      console.log('WalletContext: Deposit processed successfully');
      
      return transaction;
    } catch (error: any) {
      console.error('WalletContext: Deposit error:', error);
      toast.error(error.message || 'Deposit failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Withdraw function
  const withdraw = async (request: WithdrawRequest): Promise<Transaction> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      console.log('WalletContext: Processing withdrawal:', request);

      // Validate balance
      if ((user.balance || 0) < request.amount) {
        throw new Error('Insufficient balance');
      }

      // Create pending withdrawal via backend (admin approval required)
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api/betting';
      const response = await fetch(`${backendUrl}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: 'withdrawal',
          amount: request.amount,
          description: `Withdrawal via ${request.method}`,
          metadata: {
            method: request.method,
            paymentMethodId: request.paymentMethodId,
            requiresAdminApproval: true,
            ...request.metadata
          }
        })
      });
      if (!response.ok) {
        throw new Error('Failed to create withdrawal request');
      }
      const backend = await response.json();
      const transaction: Transaction = {
        id: backend.transaction?.id || `wth_${Date.now()}`,
        userId: user.id,
        type: 'withdrawal',
        amount: request.amount,
        currency: request.currency || 'INR',
        status: 'pending',
        fee: 0,
        method: request.method,
        description: `Withdrawal via ${request.method}`,
        reference: backend.transaction?.reference || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: backend.transaction?.metadata || {}
      };

      // Update local state
      setTransactions(prev => [transaction, ...prev]);
      setPendingPayments(prev => [{
        id: transaction.id,
        userId: transaction.userId,
        type: 'withdrawal',
        amount: transaction.amount,
        currency: transaction.currency,
        method: transaction.method,
        transactionId: '',
        paymentProofUrl: '',
        bankDetails: undefined,
        status: 'pending',
        submittedAt: transaction.createdAt,
        reviewedAt: undefined,
        reference: transaction.reference,
        description: transaction.description,
        metadata: transaction.metadata
      }, ...prev]);

      toast.success(`Withdrawal request of ${request.amount} ${request.currency} submitted!`);
      console.log('WalletContext: Withdrawal processed successfully');
      
      return transaction;
    } catch (error: any) {
      console.error('WalletContext: Withdrawal error:', error);
      toast.error(error.message || 'Withdrawal failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Submit manual deposit (for admin processing)
  const submitManualDeposit = async (request: DepositRequest): Promise<PendingPayment> => {
    if (!user) throw new Error('User not authenticated');

    try {
      console.log('WalletContext: Submitting manual deposit:', request);
      console.log('WalletContext: User ID:', user.id);

      const transactionData = {
        userId: user.id,
        type: 'deposit' as const,
        amount: request.amount,
        currency: request.currency || 'INR',
        status: 'pending' as const,
        description: `Manual deposit request - ${request.customerName || 'Customer'}`,
        reference: request.transactionId || `MAN_DEP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          method: request.method || 'manual_deposit',
          customerName: request.customerName,
          phoneNumber: request.phoneNumber,
          email: request.email,
          upiId: request.upiId,
          bankTransactionId: request.bankTransactionId,
          paymentProofUrl: request.base64Image,
          manual: true,
          requiresAdminApproval: true,
          ...request.metadata
        }
      };

      // Try MongoDB backend first (FAST!)
      try {
        console.log('WalletContext: Attempting MongoDB backend...');
        
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api/betting';
        const response = await fetch(`${backendUrl}/transaction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: transactionData.userId,
            type: transactionData.type,
            amount: transactionData.amount,
            description: transactionData.description,
            metadata: transactionData.metadata
          })
        });

        if (response.ok) {
          const backendResult = await response.json();
          console.log('WalletContext: MongoDB backend success:', backendResult);
          
          const pendingPayment: PendingPayment = {
            id: backendResult.transaction?.id || transactionData.reference,
            userId: user.id,
            type: 'deposit',
            amount: request.amount,
            currency: request.currency || 'INR',
            method: request.method || 'manual_deposit',
            transactionId: request.transactionId || '',
            paymentProofUrl: request.base64Image || '',
            bankDetails: request.metadata?.bankDetails,
            status: 'pending',
            submittedAt: new Date(),
            reviewedAt: undefined,
            reference: transactionData.reference,
            description: transactionData.description,
            metadata: transactionData.metadata
          };

          setPendingPayments(prev => [pendingPayment, ...prev]);
          toast.success('Deposit submitted for admin review');
          
          return pendingPayment;
        }
      } catch (backendError) {
        console.warn('WalletContext: Backend failed, trying Supabase:', backendError);
      }
      
      // Fallback to Supabase
      if (!useBackend) {
        const result = await SupabaseAuthService.createTransaction({
        user_id: user.id,
        type: 'deposit',
        amount: request.amount,
        currency: request.currency || 'INR',
        status: 'pending',
        description: transactionData.description,
        reference: transactionData.reference,
        metadata: transactionData.metadata
        });
        if (!result.success || !result.transaction) {
          // fall through to local storage
        } else {
          const pendingPayment: PendingPayment = {
            id: result.transaction.id,
            userId: result.transaction.user_id,
            type: 'deposit',
            amount: result.transaction.amount,
            currency: result.transaction.currency || 'INR',
            method: result.transaction.metadata?.method || 'unknown',
            transactionId: request.transactionId || '',
            paymentProofUrl: request.base64Image || '',
            bankDetails: request.metadata?.bankDetails,
            status: 'pending',
            submittedAt: new Date(result.transaction.created_at),
            reviewedAt: undefined,
            reference: result.transaction.reference || `TXN_${Date.now()}`,
            description: result.transaction.description || 'Manual transaction',
            metadata: result.transaction.metadata
          };
          setPendingPayments(prev => [pendingPayment, ...prev]);
          toast.success('Manual deposit submitted for review');
          return pendingPayment;
        }
      }
      
    if (useBackend) {
      console.error('WalletContext: All systems failed, using localStorage fallback');
      
      // Final fallback: localStorage
      const localTransactionId = `LOCAL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const localTransaction = {
        id: localTransactionId,
        user_id: user.id,
        type: 'deposit' as const,
        amount: request.amount,
        currency: request.currency || 'INR',
        status: 'pending' as const,
        description: transactionData.description,
        reference: transactionData.reference,
        metadata: transactionData.metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store in localStorage
      const existingTransactions = JSON.parse(localStorage.getItem('localTransactions') || '[]');
      existingTransactions.push(localTransaction);
      localStorage.setItem('localTransactions', JSON.stringify(existingTransactions));

      const pendingPayment: PendingPayment = {
        id: localTransactionId,
        userId: user.id,
        type: 'deposit',
        amount: request.amount,
        currency: request.currency || 'INR',
        method: request.method || 'manual_deposit',
        transactionId: request.transactionId || '',
        paymentProofUrl: request.base64Image || '',
        bankDetails: request.metadata?.bankDetails,
        status: 'pending',
        submittedAt: new Date(),
        reviewedAt: undefined,
        reference: transactionData.reference,
        description: transactionData.description,
        metadata: transactionData.metadata
      };

      setPendingPayments(prev => [pendingPayment, ...prev]);
      toast.success('Deposit submitted (using local storage)');
      
      return pendingPayment;
    }

      // Should not reach here
      throw new Error('Deposit flow fell through');
    } catch (error: any) {
      console.error('WalletContext: Manual deposit error:', error);
      toast.error(error.message || 'Manual deposit failed');
      throw error;
    }
  };

  // Submit manual withdrawal (for admin processing)
  const submitManualWithdraw = async (request: WithdrawRequest): Promise<PendingPayment> => {
    if (!user) throw new Error('User not authenticated');

    try {
      console.log('WalletContext: Submitting manual withdrawal:', request);

      const transactionData = {
        user_id: user.id,
        type: 'withdrawal' as const,
        amount: request.amount,
        currency: request.currency || 'INR',
        status: 'pending' as const,
        description: `Manual withdrawal via ${request.method}`,
        reference: `MAN_WTH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          method: request.method,
          paymentMethodId: request.paymentMethodId,
          manual: true,
          ...request.metadata
        }
      };

      if (!useBackend) {
        const result = await SupabaseAuthService.createTransaction(transactionData);
        if (!result.success || !result.transaction) {
          throw new Error(result.message || 'Failed to create manual withdrawal');
        }

        const pendingPayment: PendingPayment = {
          id: result.transaction.id,
          userId: result.transaction.user_id,
          type: 'withdrawal',
          amount: result.transaction.amount,
          currency: result.transaction.currency || 'INR',
          method: result.transaction.metadata?.method || 'unknown',
          transactionId: '',
          paymentProofUrl: '',
          bankDetails: undefined,
          status: 'pending',
          submittedAt: new Date(result.transaction.created_at),
          reviewedAt: undefined,
          reference: result.transaction.reference || `TXN_${Date.now()}`,
          description: result.transaction.description || 'Manual transaction',
          metadata: result.transaction.metadata
        };
        setPendingPayments(prev => [pendingPayment, ...prev]);
        toast.success('Manual withdrawal submitted for review');
        return pendingPayment;
      }

      // Backend-only path fallback to local placeholder
      const localPending: PendingPayment = {
        id: `LOCAL_WTH_${Date.now()}`,
        userId: user.id,
        type: 'withdrawal',
        amount: request.amount,
        currency: request.currency || 'INR',
        method: request.method || 'manual_withdrawal',
        transactionId: '',
        paymentProofUrl: '',
        bankDetails: undefined,
        status: 'pending',
        submittedAt: new Date(),
        reviewedAt: undefined,
        reference: `TXN_${Date.now()}`,
        description: transactionData.description,
        metadata: transactionData.metadata
      };
      setPendingPayments(prev => [localPending, ...prev]);
      toast.success('Manual withdrawal submitted for review');
      return localPending;
    } catch (error: any) {
      console.error('WalletContext: Manual withdrawal error:', error);
      toast.error(error.message || 'Manual withdrawal failed');
      throw error;
    }
  };

  // Process bet
  const processBet = async (amount: number, gameType: string, description?: string, metadata?: any) => {
    if (!user) {
      console.error('WalletContext: No user found');
      return { betId: undefined };
    }

    console.log('🎰 WalletContext: Processing bet for user:', user.email, 'Amount:', amount);
    
    // Get current balance
    const currency = user.currency || 'USD';
    const currentBalance = getBalance(currency);
    console.log('💰 Current balance:', currentBalance, 'Currency:', currency);
    
    // Check if sufficient balance
    if (currentBalance < amount) {
      console.error('❌ Insufficient balance!');
      return { betId: undefined };
    }
    
    // Calculate new balance
    const newBalance = currentBalance - amount;
    console.log('📉 New balance after bet:', newBalance);
    
    // Create transaction ref
    const transactionRef = `BET_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Update balance immediately (LOCAL) - instant UX
    try {
      await updateBalance(newBalance);
      console.log('✅ Balance updated locally');
    } catch (error) {
      console.error('❌ Failed to update balance:', error);
    }
    
    // Update accounts state
    setAccounts(prev => prev.map(acc =>
      acc.currency === currency
        ? { ...acc, balance: newBalance }
        : acc
    ));
    
    // Create transaction
    const localTransaction: Transaction = {
      id: transactionRef,
      userId: user.id,
      type: 'bet',
      amount: amount,
      currency: currency,
      status: 'completed',
      fee: 0,
      method: 'game_bet',
      description: description || `${gameType} - Bet`,
      reference: transactionRef,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: new Date(),
      metadata: {
        gameType,
        ...metadata
      }
    };
    
    // Add to transactions
    setTransactions(prev => {
      const updated = [localTransaction, ...prev];
      saveTransactionsToLocalStorage(updated);
      return updated;
    });
    
    console.log('🎰 Bet placed successfully! Bet ID:', transactionRef);
    
    // SYNC TO DATABASE IN BACKGROUND (non-blocking)
    (async () => {
      try {
        console.log('💾 Syncing bet to database...');
        
        // Try MongoDB backend first
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api/betting';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for slower connections
        
        const normalizedGameType = (metadata?.gameName || gameType || '').toString().toLowerCase() || (metadata?.gameId?.toString().includes('slot') ? 'slots' : 'casino');
        const betPayload = {
          userId: user.id,
          amount: Number(amount),
          currency,
          gameId: metadata?.gameId || null,
          gameType: normalizedGameType,
          description: description || `${normalizedGameType} - Bet placed`,
          details: {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
          },
          metadata
        } as any;
        console.log('[FRONT] POST /casino/bet payload', betPayload);
        const response = await fetch(`${backendUrl}/casino/bet`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify(betPayload)
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[FRONT] /casino/bet response', data);
          console.log('✅ Synced to MongoDB successfully');
          
          // Update balance from backend response if provided
          if (data.balance !== undefined) {
            await updateBalance(data.balance);
            setAccounts(prev => prev.map(acc =>
              acc.currency === currency
                ? { ...acc, balance: data.balance }
                : acc
            ));
          }
          // Attach betId for later settle
          if (data?.bet?.id) {
            try { (localStorage as any).setItem('last_bet_id', data.bet.id); } catch {}
          }
        } else {
          let errText = '';
          try { errText = await response.text(); } catch {}
          console.warn('⚠️ MongoDB sync failed', response.status, errText);
          throw new Error('MongoDB failed');
        }
      } catch (error) {
        console.warn('⚠️ Backend sync failed, trying Supabase...', error);
        
        // Try Supabase as fallback
        try {
          const transactionData = {
            user_id: user.id,
            type: 'bet' as const,
            amount: amount,
            currency: currency,
            status: 'completed' as const,
            description: description || `${gameType} - Bet`,
            reference: transactionRef,
            metadata: {
              gameType,
              ...metadata
            }
          };
          
          await SupabaseAuthService.createTransaction(transactionData);
          console.log('✅ Synced to Supabase successfully');
        } catch (supabaseError) {
          console.warn('⚠️ Database sync failed (non-critical):', supabaseError);
        }
      }
    })(); // Fire and forget - don't wait
    
    // Return immediately - don't wait for database sync
    return { betId: transactionRef };
  };

  // Process win
  const processWin = async (amount: number, gameType: string, description?: string, metadata?: any) => {
    if (!user) return;

    try {
      console.log('WalletContext: Processing win:', amount, gameType);

      // Handle demo account - skip Supabase calls
      if (user.email === 'demo@spinzos.com') {
        console.log('WalletContext: Demo account win - updating balance locally');
        
        const account = accounts.find(acc => acc.currency === (user.currency || 'USD'));
        const currentBalance = account?.balance || 1000;
        const newBalance = currentBalance + amount;
        await updateBalance(newBalance);

        // Update local account state
        setAccounts(prev => prev.map(acc => 
          acc.currency === user.currency 
            ? { ...acc, balance: acc.balance + amount }
            : acc
        ));

        console.log('WalletContext: Demo win processed successfully');
        return;
      }

      const transactionData = {
        user_id: user.id,
        type: 'win' as const,
        amount: amount,
        currency: user.currency || 'USD',
        status: 'completed' as const,
        description: description || `${gameType} - Win`,
        reference: `WIN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          gameType,
          ...metadata
        }
      };

      // Update balance immediately for better UX, even if backend fails
      const currentBalance = getBalance(user.currency || 'USD');
      const newBalance = currentBalance + amount;
      
      // Update balance immediately
      await updateBalance(newBalance);
      setAccounts(prev => prev.map(acc =>
        acc.currency === (user.currency || 'USD')
          ? { ...acc, balance: newBalance }
          : acc
      ));

      // First try MongoDB backend
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api/betting';
        const backendResp = await fetch(`${backendUrl}/casino/win`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            amount: Number(amount), // payout only (no stake)
            currency: user.currency || 'INR',
            gameId: metadata?.gameId,
            gameType: (metadata?.gameName || gameType || '').toString().toLowerCase() || (metadata?.gameId?.toString().includes('slot') ? 'slots' : 'casino'),
            description,
            betId: metadata?.betId,
            details: {
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName
            },
            metadata
          })
        });
        if (backendResp.ok) {
          const data = await backendResp.json();
          console.log('[DEBUG] POST /casino/win response:', data);
          if (data.success && data.transaction) {
            const tx: Transaction = {
              id: data.transaction._id,
              userId: data.transaction.userId,
              type: 'win',
              amount: data.transaction.amount,
              currency: data.transaction.currency || 'INR',
              status: 'completed',
              fee: 0,
              method: 'game_win',
              description: data.transaction.description,
              reference: data.transaction.reference,
              createdAt: new Date(data.transaction.createdAt),
              updatedAt: new Date(data.transaction.updatedAt),
              completedAt: data.transaction.completedAt ? new Date(data.transaction.completedAt) : undefined,
              metadata: data.transaction.metadata || {}
            };
            setTransactions(prev => {
              const updated = [tx, ...prev];
              saveTransactionsToLocalStorage(updated);
              return updated;
            });

            // Update INR account balance/stats from backend response
            if (typeof data.balance === 'number') {
              setAccounts(prev => prev.map(acc =>
                acc.currency === 'INR' && acc.accountType === 'main'
                  ? { ...acc, balance: data.balance, updatedAt: new Date() }
                  : acc
              ));
              // sync auth balance too (dashboard header)
              try { await updateBalance(data.balance); } catch {}
            }

            // Notify listeners (Wallet page) to refresh
            try { window.dispatchEvent(new CustomEvent('wallet_updated')); } catch {}
          }
        }
      } catch (e) {
        console.warn('WalletContext: Backend win save failed, will try Supabase:', e);
      }

      if (!useBackend) {
        const result = await SupabaseAuthService.createTransaction(transactionData);
        if (result.success && result.transaction) {
        // Update local state with transaction
        const transaction: Transaction = {
          id: result.transaction.id,
          userId: result.transaction.user_id,
          type: result.transaction.type,
          amount: result.transaction.amount,
          currency: result.transaction.currency || 'INR',
          status: result.transaction.status,
          fee: 0,
          method: result.transaction.metadata?.method || 'unknown',
          description: result.transaction.description || 'Manual transaction',
          reference: result.transaction.reference || `TXN_${Date.now()}`,
          createdAt: new Date(result.transaction.created_at || new Date().toISOString()),
          completedAt: result.transaction.completed_at ? new Date(result.transaction.completed_at) : undefined,
          updatedAt: new Date(result.transaction.updated_at || new Date().toISOString()),
          metadata: result.transaction.metadata
        };

        setTransactions(prev => {
          const updated = [transaction, ...prev];
          saveTransactionsToLocalStorage(updated);
          return updated;
        });
        toast.success(`Congratulations! You won ${amount} ${user.currency}!`);
        } else {
        // If Supabase fails, create local transaction
        console.log('WalletContext: Supabase insert failed, creating local transaction for win');
        const localTransaction: Transaction = {
          id: transactionData.reference,
          userId: user.id,
          type: 'win',
          amount: transactionData.amount,
          currency: transactionData.currency || 'INR',
          status: 'completed',
          fee: 0,
          method: 'game_win',
          description: transactionData.description,
          reference: transactionData.reference,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: { ...transactionData.metadata, localFallback: true }
        };
        setTransactions(prev => {
          const updated = [localTransaction, ...prev];
          saveTransactionsToLocalStorage(updated);
          return updated;
        });
        toast.success(`Congratulations! You won ${amount} ${user.currency}! (Stored locally - database unavailable)`);
        }
      }
    } catch (error) {
      console.error('WalletContext: Process win error:', error);
    }
  };

  // Process loss (no balance change; just mark bet lost)
  const processLoss = async (betId: string, gameType: string, metadata?: any) => {
    if (!user) return;
    // If we don't have a betId (e.g., bet call timed out), skip backend loss call
    if (!betId) return;
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api/betting';
      const backendResp = await fetch(`${backendUrl}/casino/loss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          betId,
          gameId: metadata?.gameId,
          gameType: metadata?.gameName || gameType,
          metadata
        })
      });
      if (backendResp.ok) {
        try { window.dispatchEvent(new CustomEvent('wallet_updated')); } catch {}
      }
    } catch (e) {
      console.warn('WalletContext: Backend loss save failed:', e);
    }
  };

  // Save transactions to localStorage
  const saveTransactionsToLocalStorage = (txs: Transaction[]) => {
    if (user) {
      const localStorageKey = `demo_user_transactions_${user.id}`;
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(txs));
        console.log('WalletContext: Saved', txs.length, 'transactions to localStorage');
      } catch (error) {
        console.error('WalletContext: Failed to save transactions to localStorage:', error);
      }
    }
  };

  // Utility functions
  const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      fee: transaction.fee || 0,
      method: transaction.method || 'unknown'
    };
    setTransactions(prev => {
      const updated = [newTransaction, ...prev];
      saveTransactionsToLocalStorage(updated);
      return updated;
    });
  };

  const getBalance = (currency?: string): number => {
    // Prefer INR by default to match backend/main account
    const preferredCurrency = currency || 'INR' || user?.currency;
    // First try to get from accounts
    const account = accounts.find(acc => acc.currency === preferredCurrency);
    if (account?.balance !== undefined && account?.balance !== null) {
      return account.balance;
    }
    
    // Fallback to user.balance if available
    if (user?.balance !== undefined && user?.balance !== null) {
      return user.balance;
    }
    
    // Default fallback
    const defaultBalance = user?.email === 'demo@spinzos.com' ? 1000 : 0;
    return defaultBalance;
  };

  const getTransactions = (limit?: number): Transaction[] => {
    return limit ? transactions.slice(0, limit) : transactions;
  };

  const refreshWallet = async () => {
    if (!user) return;
    
    try {
      console.log('WalletContext: Refreshing wallet data...');
      setIsLoading(true);
      
      // Skip Supabase refresh when backend auth is enabled
      if (!((import.meta as any).env?.VITE_USE_BACKEND_AUTH === 'true')) {
        const userResult = await SupabaseAuthService.getCurrentUser();
        if (userResult && (userResult as any).success && (userResult as any).user) {
          console.log('WalletContext: User balance refreshed:', (userResult as any).user.balance);
        }
      }
      
      // Reload all wallet data
      await loadUserData();
      
      console.log('WalletContext: Wallet refresh completed');
    } catch (error) {
      console.error('WalletContext: Failed to refresh wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const transferFunds = async (fromCurrency: string, toCurrency: string, amount: number) => {
    // Implementation for currency conversion
    console.log('WalletContext: Transfer funds:', fromCurrency, toCurrency, amount);
    toast.success('Currency conversion feature coming soon!');
  };

  const validateBalance = (amount: number): boolean => {
    const account = accounts.find(acc => acc.currency === (user?.currency || 'USD'));
    const balance = account?.balance || (user?.email === 'demo@spinzos.com' ? 1000 : 100);
    return balance >= amount;
  };

  const getAvailableBalance = (): number => {
    // Use the same source as getBalance, prefer INR main account
    const balance = getBalance('INR');
    const reservedAmount = stats.activeBets || 0;
    return Math.max(0, balance - reservedAmount);
  };

  return (
    <WalletContext.Provider value={{
      accounts,
      transactions,
      pendingPayments,
      paymentMethods,
      limits,
      stats,
      isLoading,
      error,
      deposit,
      withdraw,
      submitManualDeposit,
      submitManualWithdraw,
      addTransaction,
      getBalance,
      getTransactions,
      refreshWallet,
      transferFunds,
      processBet,
      processWin,
      processLoss,
      validateBalance,
      getAvailableBalance
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
