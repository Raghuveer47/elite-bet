import React, { createContext, useContext, useState, useEffect } from 'react';
import { WalletAccount, Transaction, PaymentMethod, DepositRequest, WithdrawRequest, WalletLimits, WalletStats, PendingPayment } from '../types/wallet';
import { useAuth } from './SupabaseAuthContext';
import { SupabaseAuthService } from '../services/supabaseAuthService';
import toast from 'react-hot-toast';

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
  processBet: (amount: number, gameType: string, description?: string, metadata?: any) => Promise<void>;
  processWin: (amount: number, gameType: string, description?: string, metadata?: any) => Promise<void>;
  validateBalance: (amount: number) => boolean;
  getAvailableBalance: () => number;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user, updateBalance } = useAuth();
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
      currencies: ['USD', 'INR'],
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
      currencies: ['USD'],
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
      currencies: ['USD'],
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
      currencies: ['USD'],
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
      currencies: ['USD'],
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
  const loadUserData = async () => {
    if (!user) {
      console.log('WalletContext: No user, skipping data load');
      return;
    }

    // Prevent multiple simultaneous loads
    if (isLoading) {
      console.log('WalletContext: Already loading, skipping duplicate load');
      return;
    }

    try {
      setIsLoading(true);
      console.log('WalletContext: Loading data for user:', user.id);

      // Load user transactions
      console.log('WalletContext: Fetching transactions for user:', user.id);
      const transactionsResult = await SupabaseAuthService.getUserTransactions(user.id);
      console.log('WalletContext: Transactions result:', transactionsResult);
      
      if (transactionsResult.success && transactionsResult.transactions) {
        console.log('WalletContext: Found', transactionsResult.transactions.length, 'transactions');
        const convertedTransactions: Transaction[] = transactionsResult.transactions.map(tx => ({
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
        setTransactions(convertedTransactions);

        // Extract pending payments
        const pendingPayments: PendingPayment[] = convertedTransactions
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
        console.log('WalletContext: Transactions loaded successfully');
      } else {
        console.log('WalletContext: No transactions found or failed to load:', transactionsResult.message);
        setTransactions([]);
        setPendingPayments([]);
      }

      // Initialize accounts with user's current balance (default $100 for new users, $1000 for demo)
      const userBalance = user.email === 'demo@spinzos.com' ? 1000 : (user.balance || 100);
      console.log('WalletContext: Initializing accounts - user email:', user.email, 'user balance:', user.balance, 'final balance:', userBalance);
      const userAccounts: WalletAccount[] = [
        {
          id: 'main',
          userId: user.id,
          currency: user.currency || 'USD',
          accountType: 'main',
          balance: userBalance,
          reservedBalance: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      setAccounts(userAccounts);
      console.log('WalletContext: Accounts set:', userAccounts);

      console.log('WalletContext: Data loaded successfully');
    } catch (error) {
      console.error('WalletContext: Failed to load data:', error);
      setError('Failed to load wallet data');
    } finally {
      console.log('WalletContext: Setting isLoading to false');
      setIsLoading(false);
    }
  };

  // Initialize accounts when user changes
  useEffect(() => {
    if (user) {
      console.log('WalletContext: User changed, loading data for:', user.id);
      loadUserData();
    } else {
      console.log('WalletContext: No user, clearing data');
      // Clear all data when user logs out
      setAccounts([]);
      setTransactions([]);
      setPendingPayments([]);
      setError(null);
      setIsLoading(false);
    }
  }, [user?.id]);

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
        currency: request.currency || 'USD',
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
        currency: result.transaction.currency || 'USD',
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

      // Create transaction in Supabase
      const transactionData = {
        user_id: user.id,
        type: 'withdrawal' as const,
        amount: request.amount,
        currency: request.currency || 'USD',
        status: 'pending' as const,
        description: `Withdrawal via ${request.method}`,
        reference: `WTH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          method: request.method,
          paymentMethodId: request.paymentMethodId,
          ...request.metadata
        }
      };

      const result = await SupabaseAuthService.createTransaction(transactionData);
      if (!result.success || !result.transaction) {
        throw new Error(result.message || 'Failed to create withdrawal transaction');
      }

      // Convert to our Transaction type
      const transaction: Transaction = {
        id: result.transaction.id || `local_${Date.now()}`,
        userId: result.transaction.user_id || user?.id || '',
        type: result.transaction.type || 'deposit',
        amount: result.transaction.amount || 0,
        currency: result.transaction.currency || 'USD',
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
        user_id: user.id,
        type: 'deposit' as const,
        amount: request.amount,
        currency: request.currency || 'USD',
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
          manual: true,
          requiresAdminApproval: true,
          ...request.metadata
        }
      };

      console.log('WalletContext: Transaction data:', transactionData);

      const result = await SupabaseAuthService.createTransaction(transactionData);
      console.log('WalletContext: Create transaction result:', result);
      
    if (!result.success || !result.transaction) {
      console.error('WalletContext: Failed to create transaction:', result.message);
      console.log('WalletContext: Supabase failed, storing transaction locally as fallback');
      
      // FALLBACK: Store transaction locally when Supabase is not accessible
      const localTransactionId = `LOCAL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const localTransaction = {
        id: localTransactionId,
        user_id: user.id,
        type: 'deposit' as const,
        amount: request.amount,
        currency: request.currency || 'USD',
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
          manual: true,
          requiresAdminApproval: true,
          localFallback: true,
          supabaseError: result.message,
          ...request.metadata
        },
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
        currency: request.currency || 'USD',
        method: request.method || 'manual_deposit',
        transactionId: request.transactionId || '',
        paymentProofUrl: request.base64Image || '',
        bankDetails: request.metadata?.bankDetails,
        status: 'pending',
        submittedAt: new Date(),
        reviewedAt: undefined,
        reference: localTransaction.reference,
        description: localTransaction.description,
        metadata: localTransaction.metadata
      };

      setPendingPayments(prev => [pendingPayment, ...prev]);
      toast.success('Manual deposit submitted for review (stored locally - Supabase unavailable)');
      
      return pendingPayment;
    }

      const pendingPayment: PendingPayment = {
        id: result.transaction.id,
        userId: result.transaction.user_id,
        type: 'deposit',
        amount: result.transaction.amount,
        currency: result.transaction.currency || 'USD',
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
        currency: request.currency || 'USD',
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

      const result = await SupabaseAuthService.createTransaction(transactionData);
      if (!result.success || !result.transaction) {
        throw new Error(result.message || 'Failed to create manual withdrawal');
      }

      const pendingPayment: PendingPayment = {
        id: result.transaction.id,
        userId: result.transaction.user_id,
        type: 'withdrawal',
        amount: result.transaction.amount,
        currency: result.transaction.currency || 'USD',
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
    } catch (error: any) {
      console.error('WalletContext: Manual withdrawal error:', error);
      toast.error(error.message || 'Manual withdrawal failed');
      throw error;
    }
  };

  // Process bet
  const processBet = async (amount: number, gameType: string, description?: string, metadata?: any) => {
    if (!user) return;

    try {
      console.log('WalletContext: Processing bet:', amount, gameType);

      // Handle demo account - skip Supabase calls
      if (user.email === 'demo@spinzos.com') {
        console.log('WalletContext: Demo account bet - updating balance locally');
        
        const account = accounts.find(acc => acc.currency === (user.currency || 'USD'));
        const currentBalance = account?.balance || 1000;
        const newBalance = currentBalance - amount;
        await updateBalance(newBalance);

        // Update local account state
        setAccounts(prev => prev.map(acc => 
          acc.currency === user.currency 
            ? { ...acc, balance: acc.balance - amount }
            : acc
        ));

        console.log('WalletContext: Demo bet processed successfully');
        return;
      }

      const transactionData = {
        user_id: user.id,
        type: 'bet' as const,
        amount: amount,
        currency: user.currency || 'USD',
        status: 'completed' as const,
        description: description || `${gameType} - Bet`,
        reference: `BET_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          gameType,
          ...metadata
        }
      };

      const result = await SupabaseAuthService.createTransaction(transactionData);
      if (result.success && result.transaction) {
        // Update user balance using account balance
        const account = accounts.find(acc => acc.currency === (user.currency || 'USD'));
        const currentBalance = account?.balance || (user.email === 'demo@spinzos.com' ? 1000 : 100);
        const newBalance = currentBalance - amount;
        await updateBalance(newBalance);

        // Update local state
        const transaction: Transaction = {
          id: result.transaction.id,
          userId: result.transaction.user_id,
          type: result.transaction.type,
          amount: result.transaction.amount,
          currency: result.transaction.currency || 'USD',
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

        setTransactions(prev => [transaction, ...prev]);
        setAccounts(prev => prev.map(acc => 
          acc.currency === user.currency 
            ? { ...acc, balance: acc.balance - amount }
            : acc
        ));
      }
    } catch (error) {
      console.error('WalletContext: Process bet error:', error);
    }
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

      const result = await SupabaseAuthService.createTransaction(transactionData);
      if (result.success && result.transaction) {
        // Update user balance using account balance
        const account = accounts.find(acc => acc.currency === (user.currency || 'USD'));
        const currentBalance = account?.balance || (user.email === 'demo@spinzos.com' ? 1000 : 100);
        const newBalance = currentBalance + amount;
        await updateBalance(newBalance);

        // Update local state
        const transaction: Transaction = {
          id: result.transaction.id,
          userId: result.transaction.user_id,
          type: result.transaction.type,
          amount: result.transaction.amount,
          currency: result.transaction.currency || 'USD',
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

        setTransactions(prev => [transaction, ...prev]);
        setAccounts(prev => prev.map(acc => 
          acc.currency === user.currency 
            ? { ...acc, balance: acc.balance + amount }
            : acc
        ));

        toast.success(`Congratulations! You won ${amount} ${user.currency}!`);
      }
    } catch (error) {
      console.error('WalletContext: Process win error:', error);
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
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const getBalance = (currency?: string): number => {
    const account = accounts.find(acc => acc.currency === (currency || user?.currency || 'USD'));
    const balance = account?.balance || (user?.email === 'demo@spinzos.com' ? 1000 : 100);
    console.log('WalletContext: getBalance called - currency:', currency, 'account balance:', account?.balance, 'final balance:', balance);
    return balance;
  };

  const getTransactions = (limit?: number): Transaction[] => {
    return limit ? transactions.slice(0, limit) : transactions;
  };

  const refreshWallet = async () => {
    if (!user) return;
    
    try {
      console.log('WalletContext: Refreshing wallet data...');
      setIsLoading(true);
      
      // Refresh user data to get updated balance
      const userResult = await SupabaseAuthService.getCurrentUser();
      if (userResult.success && userResult.user) {
        console.log('WalletContext: User balance refreshed:', userResult.user.balance);
        // Update the user context with new balance
        // This will trigger a re-render with updated balance
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
    const account = accounts.find(acc => acc.currency === (user?.currency || 'USD'));
    const balance = account?.balance || (user?.email === 'demo@spinzos.com' ? 1000 : 100);
    console.log('WalletContext: getAvailableBalance called - account balance:', account?.balance, 'final balance:', balance, 'user email:', user?.email);
    return balance;
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
