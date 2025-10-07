/**
 * Persistent Data Storage Manager
 * Handles localStorage persistence for transactions, pending payments, and user data
 */

export interface StoredData {
  transactions: any[];
  pendingPayments: any[];
  users: any[];
  lastUpdated: string;
  version: string;
}

export class DataStorage {
  private static readonly STORAGE_KEY = 'elitebet_app_data';
  private static readonly VERSION = '1.0';

  // Save data to localStorage with proper error handling
  static saveData(data: Partial<StoredData>): void {
    let updated: StoredData;
    let serialized: string;
    
    try {
      const existing = this.loadData();
      updated = {
        ...existing,
        ...data,
        lastUpdated: new Date().toISOString(),
        version: this.VERSION
      };
      
      serialized = JSON.stringify(updated);
      localStorage.setItem(this.STORAGE_KEY, serialized);
      
      console.log('DataStorage: Data saved successfully', {
        transactions: updated.transactions?.length || 0,
        pendingPayments: updated.pendingPayments?.length || 0,
        users: updated.users?.length || 0,
        size: serialized.length
      });
      
      // Force storage event for immediate sync
      setTimeout(() => {
        window.dispatchEvent(new StorageEvent('storage', {
          key: this.STORAGE_KEY,
          newValue: serialized,
          oldValue: null
        }));
      }, 10);
      
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.clearOldData();
        try {
          localStorage.setItem(this.STORAGE_KEY, serialized);
        } catch (retryError) {
          console.error('Failed to save data even after cleanup:', retryError);
        }
      }
    }
  }

  // Load data from localStorage with proper date conversion
  static loadData(): StoredData {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        console.log('DataStorage: No stored data found, returning defaults');
        return this.getDefaultData();
      }

      const parsed = JSON.parse(stored);
      
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

      const result = {
        transactions: convertDates(parsed.transactions || []),
        pendingPayments: convertDates(parsed.pendingPayments || []),
        users: convertDates(parsed.users || []),
        lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        version: parsed.version || this.VERSION
      };

      console.log('DataStorage: Data loaded successfully', {
        transactions: result.transactions.length,
        pendingPayments: result.pendingPayments.length,
        users: result.users.length
      });

      return result;
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
      return this.getDefaultData();
    }
  }

  // Get default data structure
  static getDefaultData(): StoredData {
    return {
      transactions: [],
      pendingPayments: [],
      users: [],
      lastUpdated: new Date().toISOString(),
      version: this.VERSION
    };
  }

  // Add transaction with immediate persistence and sync
  static addTransaction(transaction: any): void {
    console.log('DataStorage: Adding transaction:', transaction.id, transaction.type, transaction.amount);
    
    const data = this.loadData();
    
    // Ensure transaction has proper date objects
    const transactionWithDates = {
      ...transaction,
      createdAt: transaction.createdAt instanceof Date ? transaction.createdAt : new Date(transaction.createdAt),
      updatedAt: transaction.updatedAt instanceof Date ? transaction.updatedAt : new Date(transaction.updatedAt),
      completedAt: transaction.completedAt ? (transaction.completedAt instanceof Date ? transaction.completedAt : new Date(transaction.completedAt)) : undefined
    };
    
    // Check for duplicates
    const exists = data.transactions.some(t => t.id === transactionWithDates.id);
    if (!exists) {
      data.transactions = [transactionWithDates, ...data.transactions];
      this.saveData(data);
      console.log('DataStorage: Transaction persisted successfully:', transactionWithDates.id);
      
      // Multiple sync mechanisms for reliability
      DataStorage.triggerSyncEvents('transaction_added', transactionWithDates);
    } else {
      console.log('DataStorage: Duplicate transaction prevented:', transactionWithDates.id);
    }
  }

  // Add pending payment with immediate persistence and sync
  static addPendingPayment(payment: any): void {
    console.log('DataStorage: Adding pending payment:', payment.id, payment.type, payment.amount);
    
    const data = this.loadData();
    
    // Ensure payment has proper date objects
    const paymentWithDates = {
      ...payment,
      submittedAt: payment.submittedAt instanceof Date ? payment.submittedAt : new Date(payment.submittedAt),
      reviewedAt: payment.reviewedAt ? (payment.reviewedAt instanceof Date ? payment.reviewedAt : new Date(payment.reviewedAt)) : undefined
    };
    
    // Check for duplicates
    const exists = data.pendingPayments.some(p => p.id === paymentWithDates.id);
    if (!exists) {
      data.pendingPayments = [paymentWithDates, ...data.pendingPayments];
      this.saveData(data);
      console.log('DataStorage: Pending payment persisted successfully:', paymentWithDates.id);
      
      // Multiple sync mechanisms for reliability
      DataStorage.triggerSyncEvents('pending_payment_added', paymentWithDates);
    } else {
      console.log('DataStorage: Duplicate pending payment prevented:', paymentWithDates.id);
    }
  }

  // Update pending payment with immediate persistence and sync
  static updatePendingPayment(paymentId: string, updates: any): void {
    console.log('DataStorage: Updating pending payment:', paymentId, updates);
    
    const data = this.loadData();
    
    // Ensure updates have proper date objects
    const updatesWithDates = {
      ...updates,
      reviewedAt: updates.reviewedAt ? (updates.reviewedAt instanceof Date ? updates.reviewedAt : new Date(updates.reviewedAt)) : undefined
    };
    
    const paymentIndex = data.pendingPayments.findIndex(p => p.id === paymentId);
    if (paymentIndex >= 0) {
      data.pendingPayments[paymentIndex] = { ...data.pendingPayments[paymentIndex], ...updatesWithDates };
      this.saveData(data);
      console.log('DataStorage: Pending payment updated successfully:', paymentId);
      
      // Multiple sync mechanisms for reliability
      DataStorage.triggerSyncEvents('pending_payment_updated', { id: paymentId, ...updatesWithDates });
    }
  }

  // Add or update user with immediate persistence and sync
  static addOrUpdateUser(user: any): void {
    console.log('DataStorage: Adding/updating user:', user.id, user.email);
    
    const data = this.loadData();
    
    // Ensure user has proper date objects
    const userWithDates = {
      ...user,
      registrationDate: user.registrationDate instanceof Date ? user.registrationDate : new Date(user.registrationDate || user.createdAt),
      lastLogin: user.lastLogin instanceof Date ? user.lastLogin : new Date(user.lastLogin),
      createdAt: user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt || user.registrationDate),
      updatedAt: new Date()
    };
    
    const existingIndex = data.users.findIndex(u => u.id === userWithDates.id);
    
    if (existingIndex >= 0) {
      data.users[existingIndex] = { ...data.users[existingIndex], ...userWithDates };
      console.log('DataStorage: User updated successfully:', userWithDates.id);
    } else {
      data.users = [userWithDates, ...data.users];
      console.log('DataStorage: User added successfully:', userWithDates.id);
    }
    
    this.saveData(data);
    
    // Multiple sync mechanisms for reliability
    DataStorage.triggerSyncEvents('user_updated', userWithDates);
  }

  // Trigger immediate sync events for maximum reliability
  static triggerSyncEvents(type: string, data: any): void {
    // Storage event
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'elitebet_data_sync',
      newValue: JSON.stringify({ type, data, timestamp: new Date().toISOString() })
    }));
    
    // Custom event
    window.dispatchEvent(new CustomEvent(`wallet_${type}`, {
      detail: data
    }));
    
    // Additional storage event with specific key
    window.dispatchEvent(new StorageEvent('storage', {
      key: `elitebet_${type}`,
      newValue: JSON.stringify(data)
    }));
  }

  // Get all transactions with proper sorting
  static getAllTransactions(): any[] {
    const data = this.loadData();
    return (data.transactions || []).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Get all pending payments with proper sorting
  static getAllPendingPayments(): any[] {
    const data = this.loadData();
    return (data.pendingPayments || []).sort((a, b) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }

  // Get all users
  static getAllUsers(): any[] {
    const data = this.loadData();
    return data.users || [];
  }

  // Clear old data to free up space
  static clearOldData(): void {
    try {
      const data = this.loadData();
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Keep only recent transactions
      data.transactions = data.transactions.filter(t => 
        new Date(t.createdAt) > oneWeekAgo || t.status === 'pending'
      );
      
      // Keep all pending payments
      // Keep all users
      
      this.saveData(data);
      console.log('DataStorage: Old data cleared to free up space');
    } catch (error) {
      console.error('Failed to clear old data:', error);
    }
  }

  // Clear all data
  static clearData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('DataStorage: All data cleared');
    } catch (error) {
      console.error('Failed to clear data from localStorage:', error);
    }
  }

  // Force reload all data
  static forceReload(): StoredData {
    console.log('DataStorage: Force reloading all data...');
    const data = this.loadData();
    
    // Trigger refresh events
    setTimeout(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'elitebet_force_refresh',
        newValue: JSON.stringify({ timestamp: new Date().toISOString() })
      }));
    }, 10);
    
    return data;
  }
}