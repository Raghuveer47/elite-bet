import React, { createContext, useContext, useState, useEffect } from 'react';
import { WalletAccount, Transaction, PaymentMethod, DepositRequest, WithdrawRequest, WalletLimits, WalletStats, PendingPayment } from '../types/wallet';
import { useAuth } from './SupabaseAuthContext';
import { SupabaseAuthService } from '../services/supabaseAuthService';
import { supabase } from '../lib/supabase';
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
      id: 'bank_transfer',
      name: 'Bank Transfer',
      type: 'bank',
      fee: 'Free',
      processingTime: '1-3 business days',
      minAmount: 50,
      maxAmount: 50000,
      icon: '🏦',
      available: true,
      currencies: ['USD', 'EUR', 'GBP']
    },
    {
      id: 'credit_card',
      name: 'Credit/Debit Card',
      type: 'card',
      fee: '2.9%',
      processingTime: 'Instant',
      minAmount: 10,
      maxAmount: 5000,
      icon: '💳',
      available: true,
      currencies: ['USD', 'EUR', 'GBP']
    },
    {
      id: 'paypal',
      name: 'PayPal',
      type: 'ewallet',
      fee: '3.5%',
      processingTime: 'Instant',
      minAmount: 20,
      maxAmount: 10000,
      icon: '🅿️',
      available: true,
      currencies: ['USD', 'EUR', 'GBP']
    },
    {
      id: 'bitcoin',
      name: 'Bitcoin',
      type: 'crypto',
      fee: 'Network fee',
      processingTime: '10-60 minutes',
      minAmount: 25,
      maxAmount: 100000,
      icon: '₿',
      available: true,
      currencies: ['BTC']
    }
  ];

  // Enhanced limits based on verification status
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

  // Load data when user changes or component mounts
  useEffect(() => {
    if (user) {
      console.log('WalletContext: Loading data for user:', user.id);
      loadUserData();
      initializeAccounts();
    }
  }, [user?.id]);

  // Set up event bus listeners for real-time sync
  useEffect(() => {
    if (!user) return;

    console.log('WalletContext: Setting up event bus listeners for user:', user.id);

    // Listen for game activity
    const unsubscribeGameActivity = eventBus.on('gameActivity', (data) => {
      if (data.userId === user.id) {
        console.log('WalletContext: Game activity received:', data);
        
        if (data.action === 'bet_placed') {
          processBet(data.amount, data.gameId, `${data.gameId} - Bet placed`, {
            gameId: data.gameId,
            sessionId: data.sessionId,
            action: data.action
          });
        } else if (data.action === 'win_awarded') {
          processWin(data.amount, data.gameId, `${data.gameId} - Win awarded`, {
            gameId: data.gameId,
            sessionId: data.sessionId,
            action: data.action
          });
        }
      }
    });

    // Listen for casino wins
    const unsubscribeCasinoWin = eventBus.on('casinoWin', (data) => {
      if (data.userId === user.id && data.winAmount > 0) {
        console.log('WalletContext: Casino win received:', data);
        processWin(data.winAmount, data.gameName, 
          `${data.gameName} - Win (${data.multiplier?.toFixed(1) || '1.0'}x)`, {
            gameId: data.gameId,
            gameName: data.gameName,
            betAmount: data.betAmount,
            winAmount: data.winAmount,
            multiplier: data.multiplier
          });
      }
    });

    // Listen for lottery wins
    const unsubscribeLotteryWin = eventBus.on('lotteryWin', (data) => {
      if (data.userId === user.id) {
        console.log('WalletContext: Lottery win received:', data);
        processWin(data.prize.value, data.gameName, 
          `${data.gameName} - Won ${data.prize.name}!`, {
            gameId: data.gameId,
            gameName: data.gameName,
            prize: data.prize,
            stakeAmount: data.stakeAmount
          });
      }
    });

    return () => {
      unsubscribeGameActivity();
      unsubscribeCasinoWin();
      unsubscribeLotteryWin();
    };
  }, [user?.id]);

  // Listen for storage events for cross-context sync
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!user) return;
      
      console.log('WalletContext: Storage event received:', e.key);
      
      // Handle transaction additions from admin
      if (e.key === 'elitebet_transaction_added' && e.newValue) {
        try {
          const transaction = JSON.parse(e.newValue);
          if (transaction.userId === user.id) {
            console.log('WalletContext: Adding transaction from admin:', transaction.id);
            setTransactions(prev => {
              const exists = prev.some(t => t.id === transaction.id);
              if (!exists) {
                return [transaction, ...prev];
              }
              return prev;
            });
          }
        } catch (error) {
          console.error('WalletContext: Failed to parse transaction event:', error);
        }
      }
      
      // Handle transaction updates from admin
      if (e.key === 'elitebet_transaction_updated' && e.newValue) {
        try {
          const updatedTransaction = JSON.parse(e.newValue);
          if (updatedTransaction.userId === user.id) {
            console.log('WalletContext: Updating transaction from admin:', updatedTransaction.id);
            
            // Update in localStorage first
            const storedData = DataStorage.loadData();
            storedData.transactions = storedData.transactions.map(t => 
              t.id === updatedTransaction.id ? updatedTransaction : t
            );
            localStorage.setItem('elitebet_app_data', JSON.stringify({
              ...storedData,
              lastUpdated: new Date().toISOString(),
              version: '1.0'
            }));
            
            // Update local state
            setTransactions(prev => prev.map(t => 
              t.id === updatedTransaction.id ? updatedTransaction : t
            ));
            
            // Show notification for status changes
            if (updatedTransaction.status === 'completed') {
              if (updatedTransaction.type === 'deposit') {
                toast.success(`✅ Deposit of ${formatCurrency(updatedTransaction.amount)} approved!`);
              } else if (updatedTransaction.type === 'withdraw') {
                toast.success(`✅ Withdrawal of ${formatCurrency(Math.abs(updatedTransaction.amount))} approved!`);
              }
            } else if (updatedTransaction.status === 'failed') {
              if (updatedTransaction.type === 'withdraw') {
                toast.error(`❌ Withdrawal rejected: ${updatedTransaction.metadata?.rejectionReason || 'Unknown reason'}`);
              }
            }
          }
        } catch (error) {
          console.error('WalletContext: Failed to parse transaction update event:', error);
        }
      }
      
      // Handle bet winnings from sports betting
      if (e.key === 'elitebet_bet_won' && e.newValue) {
        try {
          const betResult = JSON.parse(e.newValue);
          if (betResult.userId === user.id) {
            console.log('WalletContext: Processing sports bet win:', betResult);
            
            // Update balance through auth context
            updateBalance(betResult.winAmount);
            
            // Create win transaction
            const winTransaction: Transaction = {
              id: `txn_win_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              userId: user.id,
              type: 'win',
              status: 'completed',
              amount: betResult.winAmount,
              currency: 'INR',
              fee: 0,
              method: 'Sports Betting',
              description: `Sports Bet Win - ${formatCurrency(betResult.winAmount)} (${betResult.odds}x)`,
              metadata: {
                betId: betResult.betId,
                originalStake: betResult.originalStake,
                odds: betResult.odds,
                profit: betResult.winAmount - betResult.originalStake,
                selectionId: betResult.selectionId
              },
              createdAt: new Date(),
              updatedAt: new Date(),
              completedAt: new Date()
            };
            
            addTransaction(winTransaction);
            toast.success(`🎉 Sports bet won! +${formatCurrency(betResult.winAmount)}`);
          }
        } catch (error) {
          console.error('WalletContext: Failed to parse bet win event:', error);
        }
      }
      
      // Handle bet losses (for notification purposes)
      if (e.key === 'elitebet_bet_lost' && e.newValue) {
        try {
          const betResult = JSON.parse(e.newValue);
          if (betResult.userId === user.id) {
            console.log('WalletContext: Processing sports bet loss:', betResult);
            // No balance change needed as bet amount was already deducted
            toast.error(`😔 Sports bet lost - ${formatCurrency(betResult.lostAmount)}`);
          }
        } catch (error) {
          console.error('WalletContext: Failed to parse bet loss event:', error);
        }
      }
      
      if (e.key === 'elitebet_data_sync' && e.newValue) {
        try {
          const update = JSON.parse(e.newValue);
          console.log('WalletContext: Processing data sync event:', update.type);
          
          if (update.type === 'transaction_added' && update.data.userId === user.id) {
            setTransactions(prev => {
              const exists = prev.some(t => t.id === update.data.id);
              if (!exists) {
                console.log('WalletContext: Adding transaction from sync:', update.data.id);
                const newTransactions = [update.data, ...prev];
                // Force re-render
                setTimeout(() => setTransactions([...newTransactions]), 50);
                return newTransactions;
              }
              return prev;
            });
          }
          
          if (update.type === 'pending_payment_added' && update.data.userId === user.id) {
            setPendingPayments(prev => {
              const exists = prev.some(p => p.id === update.data.id);
              if (!exists) {
                console.log('WalletContext: Adding pending payment from sync:', update.data.id);
                const newPayments = [update.data, ...prev];
                // Force re-render
                setTimeout(() => setPendingPayments([...newPayments]), 50);
                return newPayments;
              }
              return prev;
            });
          }
          
          if (update.type === 'pending_payment_updated' && update.data.userId === user.id) {
            setPendingPayments(prev => {
              const updated = prev.map(p => p.id === update.data.id ? { ...p, ...update.data } : p);
              console.log('WalletContext: Updated pending payment from sync:', update.data.id);
              return updated;
            });
          }
        } catch (error) {
          console.error('WalletContext: Failed to parse storage sync event:', error);
        }
      }
      
      // Handle balance updates from admin
      if (e.key === 'elitebet_balance_update' && e.newValue) {
        try {
          const balanceUpdate = JSON.parse(e.newValue);
          if (balanceUpdate.userId === user.id) {
            console.log('WalletContext: Balance update received from admin:', balanceUpdate);
            
            // Create transaction for admin balance adjustments
            if (balanceUpdate.reason && !balanceUpdate.reason.includes('Bet') && !balanceUpdate.reason.includes('Win')) {
              const adjustmentTransaction: Transaction = {
                id: `txn_admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId: user.id,
                type: balanceUpdate.amount > 0 ? 'bonus' : 'fee',
                status: 'completed',
                amount: balanceUpdate.amount,
                currency: 'INR',
                fee: 0,
                method: 'Admin Adjustment',
                description: balanceUpdate.reason,
                metadata: {
                  adminAdjustment: true,
                  previousBalance: user.balance,
                  newBalance: balanceUpdate.newBalance
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                completedAt: new Date()
              };
              
              addTransaction(adjustmentTransaction);
            }
          }
        } catch (error) {
          console.error('WalletContext: Failed to parse balance update:', error);
        }
      }
    };

    // Handle custom events for immediate updates
    const handleCustomEvents = (e: CustomEvent) => {
      if (!user) return;
      
      if (e.type === 'wallet_transaction_added' && e.detail.userId === user.id) {
        console.log('WalletContext: Custom transaction event received:', e.detail.id);
        setTransactions(prev => {
          const exists = prev.some(t => t.id === e.detail.id);
          if (!exists) {
            return [e.detail, ...prev];
          }
          return prev;
        });
      }
      
      if (e.type === 'wallet_pending_payment_added' && e.detail.userId === user.id) {
        console.log('WalletContext: Custom pending payment event received:', e.detail.id);
        setPendingPayments(prev => {
          const exists = prev.some(p => p.id === e.detail.id);
          if (!exists) {
            return [e.detail, ...prev];
          }
          return prev;
        });
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('wallet_transaction_added', handleCustomEvents as EventListener);
    window.addEventListener('wallet_pending_payment_added', handleCustomEvents as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('wallet_transaction_added', handleCustomEvents as EventListener);
      window.removeEventListener('wallet_pending_payment_added', handleCustomEvents as EventListener);
    };
  }, [user?.id]);

  // Load user-specific data from storage
  const loadUserData = () => {
    if (!user) return;
    
    try {
      // Load data directly from localStorage for immediate access
      const stored = localStorage.getItem('elitebet_app_data');
      let storedData;
      
      if (stored) {
        storedData = JSON.parse(stored);
        
        // Convert date strings back to Date objects
        const convertDates = (obj: any): any => {
          if (obj === null || obj === undefined) return obj;
          
          if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
            return new Date(obj);
          }
          
          if (Array.isArray(obj)) {
            return obj.map(convertDates);
          }
          
          if (typeof obj === 'object') {
            const converted: any = {};
            for (const [key, value] of Object.entries(obj)) {
              if (key.includes('Date') || key.includes('At') || key === 'lastLogin' || key === 'timestamp' || key === 'submittedAt' || key === 'reviewedAt' || key === 'createdAt' || key === 'updatedAt' || key === 'completedAt') {
                converted[key] = value ? new Date(value as string) : value;
              } else {
                converted[key] = convertDates(value);
              }
            }
            return converted;
          }
          
          return obj;
        };
        
        storedData = {
          transactions: convertDates(storedData.transactions || []),
          pendingPayments: convertDates(storedData.pendingPayments || [])
        };
      } else {
        storedData = { transactions: [], pendingPayments: [] };
      }
      
      const userTransactions = storedData.transactions
        .filter(t => t.userId === user.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const userPendingPayments = storedData.pendingPayments
        .filter(p => p.userId === user.id)
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      
      console.log('WalletContext: Loaded user data:', {
        userId: user.id,
        transactions: userTransactions.length,
        pendingPayments: userPendingPayments.length,
        balance: user.balance
      });
      
      setTransactions(userTransactions);
      setPendingPayments(userPendingPayments);
      
      // Force re-render to ensure UI updates
      setTimeout(() => {
        setTransactions(prev => [...prev]);
        setPendingPayments(prev => [...prev]);
      }, 100);
    } catch (error) {
      console.error('WalletContext: Failed to load user data:', error);
    }
  };

  // Initialize wallet accounts
  const initializeAccounts = () => {
    if (!user) return;

    const mockAccounts: WalletAccount[] = [
      {
        id: `acc_${user.id}_usd_main`,
        userId: user.id,
        currency: 'INR',
        accountType: 'main',
        balance: user.balance,
        reservedBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: `acc_${user.id}_usd_bonus`,
        userId: user.id,
        currency: 'INR',
        accountType: 'bonus',
        balance: 0,
        reservedBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: `acc_${user.id}_eur_main`,
        userId: user.id,
        currency: 'EUR',
        accountType: 'main',
        balance: 0,
        reservedBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: `acc_${user.id}_btc_main`,
        userId: user.id,
        currency: 'BTC',
        accountType: 'main',
        balance: 0,
        reservedBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    setAccounts(mockAccounts);
    console.log('WalletContext: Initialized accounts for user:', user.id);
  };

  // Sync accounts with user balance
  useEffect(() => {
    if (user && accounts.length > 0) {
      setAccounts(prev => prev.map(acc => 
        acc.currency === 'USD' && acc.accountType === 'main' 
          ? { ...acc, balance: user.balance, updatedAt: new Date() }
          : acc
      ));
    }
  }, [user?.balance]);

  const getBalance = (currency: string = 'INR') => {
    const account = accounts.find(acc => acc.currency === currency && acc.accountType === 'main');
    return account?.balance || user?.balance || 0;
  };

  const getAvailableBalance = () => {
    const currentBalance = getBalance();
    const reservedAmount = stats.activeBets;
    return Math.max(0, currentBalance - reservedAmount);
  };

  const validateBalance = (amount: number): boolean => {
    const availableBalance = getAvailableBalance();
    return amount > 0 && amount <= availableBalance;
  };

  const getTransactions = (limit?: number) => {
    const sorted = [...transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return limit ? sorted.slice(0, limit) : sorted;
  };

  const addTransaction = (transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const transaction: Transaction = {
      ...transactionData,
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: transactionData.status === 'completed' ? new Date() : undefined
    };

    console.log('WalletContext: Creating transaction:', {
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      userId: transaction.userId
    });

    // Add to local state immediately
    setTransactions(prev => [transaction, ...prev]);
    
    // Persist to storage
    DataStorage.addTransaction(transaction);
    
    // Sync to admin context
    syncManager.addSyncEvent('transaction', user!.id, transaction, 'user');
  };

  const processBet = async (amount: number, gameType: string, description?: string, metadata?: any): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!validateBalance(amount)) {
      throw new Error('Insufficient balance');
    }

    console.log('WalletContext: Processing bet:', { amount, gameType, userId: user.id });

    try {
      // Update balance through auth context
      updateBalance(-amount);

      // Create bet transaction
      const betTransaction: Transaction = {
        id: `txn_bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        type: 'bet',
        status: 'completed',
        amount: -amount,
        currency: 'INR',
        fee: 0,
        method: gameType,
        description: description || `${gameType} - Bet placed`,
        metadata: {
          gameType,
          betAmount: amount,
          ...metadata
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date()
      };

      addTransaction(betTransaction);
      console.log('WalletContext: Bet processed successfully:', betTransaction.id);
    } catch (error) {
      console.error('WalletContext: Failed to process bet:', error);
      throw error;
    }
  };

  const processWin = async (amount: number, gameType: string, description?: string, metadata?: any): Promise<void> => {
    if (!user || amount <= 0) return;

    console.log('WalletContext: Processing win:', { amount, gameType, userId: user.id });

    try {
      // Update balance through auth context
      updateBalance(amount);

      // Create win transaction
      const winTransaction: Transaction = {
        id: `txn_win_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        type: 'win',
        status: 'completed',
        amount: amount,
        currency: 'INR',
        fee: 0,
        method: gameType,
        description: description || `${gameType} - Win awarded`,
        metadata: {
          gameType,
          winAmount: amount,
          ...metadata
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date()
      };

      addTransaction(winTransaction);
      console.log('WalletContext: Win processed successfully:', winTransaction.id);
    } catch (error) {
      console.error('WalletContext: Failed to process win:', error);
      throw error;
    }
  };

  const submitManualDeposit = async (request: DepositRequest): Promise<PendingPayment> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('WalletContext: Submitting manual deposit:', request);

      // Enhanced validation
      if (request.amount < limits.minDeposit) {
        throw new Error(`Minimum deposit is ${formatCurrency(limits.minDeposit)}`);
      }
      if (request.amount > limits.maxDeposit) {
        throw new Error(`Maximum deposit is ${formatCurrency(limits.maxDeposit)}`);
      }
      if (!request.transactionId?.trim()) {
        throw new Error('Transaction ID is required');
      }
      if (!request.paymentProof) {
        throw new Error('Payment proof is required');
      }

      // Check daily limits
      const todayDeposits = transactions
        .filter(t => t.type === 'deposit' && 
                    t.status === 'completed' && 
                    new Date(t.createdAt).toDateString() === new Date().toDateString())
        .reduce((sum, t) => sum + t.amount, 0);

      if (todayDeposits + request.amount > limits.dailyDepositLimit) {
        throw new Error(`Daily deposit limit of ${formatCurrency(limits.dailyDepositLimit)} would be exceeded`);
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Create transaction ID
      const transactionId = `txn_deposit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create pending transaction (shows in user history as pending)
      const pendingPayment: PendingPayment = {
        id: `pending_deposit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user!.id,
        type: 'deposit',
        amount: request.amount,
        currency: request.currency,
        method: request.method,
        transactionId: transactionId,
        paymentProofUrl: request.base64Image || '',
        status: 'pending',
        submittedAt: new Date(),
        bankDetails: {
          bankName: 'Elite Bet Financial Services',
          accountName: 'Elite Bet Holdings Ltd',
          accountNumber: '1234567890',
          routingNumber: '021000021',
          swiftCode: 'EBTFUS33',
          iban: 'US64EBTF0210000021234567890',
          reference: request.transactionId || ''
        }
      };

      console.log('WalletContext: Deposit submission created:', {
        transactionId: transactionId,
        amount: request.amount,
        userId: user!.id
      });

      // CRITICAL: Save to storage FIRST, then update state
      // Use DataStorage to handle quota limits and cleanup
      DataStorage.addPendingPayment(pendingPayment);
      
      // Update local state
      setPendingPayments(prev => [pendingPayment, ...prev]);

      // Trigger sync events for admin
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'elitebet_pending_payment_added',
        newValue: JSON.stringify(pendingPayment)
      }));
      
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'elitebet_data_sync',
        newValue: JSON.stringify({
          type: 'pending_payment_added',
          data: pendingPayment,
          timestamp: new Date().toISOString()
        })
      }));
      
      return pendingPayment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Deposit submission failed';
      setError(errorMessage);
      console.error('WalletContext: Deposit submission failed:', errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const submitManualWithdraw = async (request: WithdrawRequest): Promise<PendingPayment> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('WalletContext: Submitting manual withdrawal:', request);

      // Enhanced validation
      if (request.amount < limits.minWithdraw) {
        throw new Error(`Minimum withdrawal is ${formatCurrency(limits.minWithdraw)}`);
      }

      const availableBalance = getAvailableBalance();
      if (request.amount > availableBalance) {
        throw new Error(`Insufficient balance. Available: ${formatCurrency(availableBalance)}`);
      }

      if (!request.destination?.trim()) {
        throw new Error('Bank account details are required');
      }

      // Check daily limits
      const todayWithdrawals = transactions
        .filter(t => t.type === 'withdraw' && 
                    t.status === 'completed' && 
                    new Date(t.createdAt).toDateString() === new Date().toDateString())
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      if (todayWithdrawals + request.amount > limits.dailyWithdrawLimit) {
        throw new Error(`Daily withdrawal limit of ${formatCurrency(limits.dailyWithdrawLimit)} would be exceeded`);
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Create transaction ID
      const transactionId = `txn_withdraw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Deduct amount from balance immediately (held until approval)
      updateBalance(-request.amount);

      // Create withdrawal transaction
      const withdrawalTransaction: Transaction = {
        id: transactionId,
        userId: user!.id,
        type: 'withdraw',
        status: 'pending',
        amount: -request.amount,
        currency: request.currency,
        fee: 0,
        method: request.method,
        description: `Withdrawal request - ${request.destination}`,
        metadata: {
          destination: request.destination,
          pendingApproval: true,
          originalBalance: user!.balance,
          submissionTime: new Date().toISOString()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create pending payment
      const pendingPayment: PendingPayment = {
        id: `pending_withdraw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user!.id,
        type: 'withdraw',
        amount: request.amount,
        currency: request.currency,
        method: request.method,
        transactionId: transactionId,
        paymentProofUrl: '',
        status: 'pending',
        submittedAt: new Date(),
        bankDetails: {
          bankName: 'User Bank',
          accountName: `${user!.firstName} ${user!.lastName}`,
          accountNumber: request.destination,
          routingNumber: '',
          swiftCode: '',
          iban: '',
          reference: `WD_${Date.now()}`
        }
      };

      console.log('WalletContext: Withdrawal submission created:', {
        transactionId: transactionId,
        pendingPaymentId: pendingPayment.id,
        amount: request.amount,
        userId: user!.id
      });

      // CRITICAL: Save to storage FIRST
      // Use DataStorage to handle quota limits and cleanup
      DataStorage.addTransaction(withdrawalTransaction);
      DataStorage.addPendingPayment(pendingPayment);
      
      // Update local state
      setTransactions(prev => [withdrawalTransaction, ...prev]);
      setPendingPayments(prev => [pendingPayment, ...prev]);

      // Trigger sync events for admin
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'elitebet_pending_payment_added',
        newValue: JSON.stringify(pendingPayment)
      }));
      
      console.log('WalletContext: Withdrawal submitted successfully');
      return pendingPayment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Withdrawal submission failed';
      setError(errorMessage);
      console.error('WalletContext: Withdrawal submission failed:', errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const transferFunds = async (fromCurrency: string, toCurrency: string, amount: number): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('WalletContext: Processing currency transfer:', { fromCurrency, toCurrency, amount });

      const fromBalance = getBalance(fromCurrency);
      if (amount > fromBalance) {
        throw new Error('Insufficient balance for transfer');
      }

      // Realistic exchange rates
      const exchangeRates: Record<string, Record<string, number>> = {
        USD: { EUR: 0.92, GBP: 0.79, BTC: 0.000023 },
        EUR: { USD: 1.09, GBP: 0.86, BTC: 0.000025 },
        GBP: { USD: 1.27, EUR: 1.16, BTC: 0.000029 },
        BTC: { USD: 43500, EUR: 39900, GBP: 34500 }
      };

      const conversionRate = exchangeRates[fromCurrency]?.[toCurrency] || 1;
      const convertedAmount = amount * conversionRate;
      const fee = amount * 0.01; // 1% conversion fee

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update accounts
      setAccounts(prev => prev.map(acc => {
        if (acc.currency === fromCurrency && acc.accountType === 'main') {
          return { ...acc, balance: acc.balance - amount, updatedAt: new Date() };
        }
        if (acc.currency === toCurrency && acc.accountType === 'main') {
          return { ...acc, balance: acc.balance + convertedAmount, updatedAt: new Date() };
        }
        return acc;
      }));

      // Update main balance if USD is involved
      if (fromCurrency === 'USD') {
        updateBalance(-amount);
      } else if (toCurrency === 'USD') {
        updateBalance(convertedAmount);
      }

      // Add transfer transactions
      const transferOut: Transaction = {
        id: `txn_transfer_out_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        type: 'withdraw',
        status: 'completed',
        amount: -amount,
        currency: fromCurrency,
        fee: fee,
        method: 'Currency Transfer',
        description: `Convert ${fromCurrency} to ${toCurrency}`,
        metadata: {
          transferType: 'currency_conversion',
          targetCurrency: toCurrency,
          exchangeRate: conversionRate,
          convertedAmount
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date()
      };

      const transferIn: Transaction = {
        id: `txn_transfer_in_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        type: 'deposit',
        status: 'completed',
        amount: convertedAmount,
        currency: toCurrency,
        fee: 0,
        method: 'Currency Transfer',
        description: `Converted from ${fromCurrency}`,
        metadata: {
          transferType: 'currency_conversion',
          sourceCurrency: fromCurrency,
          exchangeRate: conversionRate,
          originalAmount: amount
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date()
      };

      // Add to local state
      setTransactions(prev => [transferIn, transferOut, ...prev]);
      
      // Persist to storage
      DataStorage.addTransaction(transferOut);
      DataStorage.addTransaction(transferIn);

      // Sync to admin context
      syncManager.addSyncEvent('transaction', user.id, transferOut, 'user');
      syncManager.addSyncEvent('transaction', user.id, transferIn, 'user');

      console.log('WalletContext: Currency transfer completed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transfer failed';
      setError(errorMessage);
      console.error('WalletContext: Transfer failed:', errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWallet = async (): Promise<void> => {
    setIsLoading(true);
    try {
      console.log('WalletContext: Refreshing wallet data...');
      
      // Force reload from storage
      const storedData = DataStorage.loadData();
      const userTransactions = storedData.transactions
        .filter(t => t.userId === user!.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const userPendingPayments = storedData.pendingPayments
        .filter(p => p.userId === user!.id)
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      
      setTransactions(userTransactions);
      setPendingPayments(userPendingPayments);
      
      loadUserData();
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('WalletContext: Wallet refreshed successfully');
      toast.success('Wallet data refreshed');
    } catch (error) {
      console.error('WalletContext: Failed to refresh wallet:', error);
      toast.error('Failed to refresh wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  const deposit = async (request: DepositRequest): Promise<Transaction> => {
    throw new Error('Not implemented - use submitManualDeposit');
  };

  const withdraw = async (request: WithdrawRequest): Promise<Transaction> => {
    throw new Error('Not implemented - use submitManualWithdraw');
  };

  // Calculate comprehensive stats
  const stats: WalletStats = {
    totalDeposited: transactions
      .filter(t => t.type === 'deposit' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0),
    totalWithdrawn: transactions
      .filter(t => t.type === 'withdraw' && t.status === 'completed')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    totalWagered: transactions
      .filter(t => t.type === 'bet' && t.status === 'completed')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    totalWon: transactions
      .filter(t => t.type === 'win' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0),
    pendingWithdrawals: transactions
      .filter(t => t.type === 'withdraw' && t.status === 'pending')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    activeBets: transactions
      .filter(t => t.type === 'bet' && t.status === 'pending')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    todayDeposited: transactions
      .filter(t => t.type === 'deposit' && 
                  t.status === 'completed' && 
                  new Date(t.createdAt).toDateString() === new Date().toDateString())
      .reduce((sum, t) => sum + t.amount, 0),
    todayWithdrawn: transactions
      .filter(t => t.type === 'withdraw' && 
                  t.status === 'completed' && 
                  new Date(t.createdAt).toDateString() === new Date().toDateString())
      .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    monthDeposited: transactions
      .filter(t => t.type === 'deposit' && 
                  t.status === 'completed' && 
                  new Date(t.createdAt).getMonth() === new Date().getMonth() &&
                  new Date(t.createdAt).getFullYear() === new Date().getFullYear())
      .reduce((sum, t) => sum + t.amount, 0),
    monthWithdrawn: transactions
      .filter(t => t.type === 'withdraw' && 
                  t.status === 'completed' && 
                  new Date(t.createdAt).getMonth() === new Date().getMonth() &&
                  new Date(t.createdAt).getFullYear() === new Date().getFullYear())
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}