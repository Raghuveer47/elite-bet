/**
 * Comprehensive Data Synchronization Manager
 * Handles real-time sync between user and admin interfaces
 */

export interface SyncEvent {
  id: string;
  type: string;
  userId: string;
  data: any;
  timestamp: Date;
  source: 'user' | 'admin';
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
}

export interface SyncValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class DataSyncManager {
  private static instance: DataSyncManager;
  private eventQueue: SyncEvent[] = [];
  private syncListeners: Map<string, Function[]> = new Map();
  private validationRules: Map<string, (data: any) => SyncValidation> = new Map();
  private auditLog: SyncEvent[] = [];
  private isProcessing = false;

  private constructor() {
    this.initializeValidationRules();
    this.startSyncProcessor();
  }

  static getInstance(): DataSyncManager {
    if (!DataSyncManager.instance) {
      DataSyncManager.instance = new DataSyncManager();
    }
    return DataSyncManager.instance;
  }

  // Initialize validation rules for different data types
  private initializeValidationRules() {
    // Transaction validation
    this.validationRules.set('transaction', (data) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!data.userId) errors.push('User ID is required');
      if (!data.type) errors.push('Transaction type is required');
      if (typeof data.amount !== 'number') errors.push('Amount must be a number');
      if (data.amount === 0) warnings.push('Zero amount transaction');
      if (!data.currency) errors.push('Currency is required');
      if (!data.status) errors.push('Status is required');

      return { isValid: errors.length === 0, errors, warnings };
    });

    // User balance validation
    this.validationRules.set('balance_update', (data) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!data.userId) errors.push('User ID is required');
      if (typeof data.newBalance !== 'number') errors.push('New balance must be a number');
      if (data.newBalance < 0) errors.push('Balance cannot be negative');
      if (typeof data.amount !== 'number') errors.push('Amount must be a number');

      return { isValid: errors.length === 0, errors, warnings };
    });

    // Game session validation
    this.validationRules.set('game_session', (data) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!data.userId) errors.push('User ID is required');
      if (!data.gameId) errors.push('Game ID is required');
      if (typeof data.betAmount !== 'number') errors.push('Bet amount must be a number');
      if (data.betAmount <= 0) errors.push('Bet amount must be positive');

      return { isValid: errors.length === 0, errors, warnings };
    });

    // User registration validation
    this.validationRules.set('user_registration', (data) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!data.id) errors.push('User ID is required');
      if (!data.email) errors.push('Email is required');
      if (!data.firstName) errors.push('First name is required');
      if (!data.lastName) errors.push('Last name is required');
      if (!data.country) errors.push('Country is required');

      return { isValid: errors.length === 0, errors, warnings };
    });

    // Pending payment validation
    this.validationRules.set('pending_payment', (data) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!data.userId) errors.push('User ID is required');
      if (!data.type) errors.push('Payment type is required');
      if (typeof data.amount !== 'number') errors.push('Amount must be a number');
      if (data.amount <= 0) errors.push('Amount must be positive');
      if (!data.transactionId) errors.push('Transaction ID is required');

      return { isValid: errors.length === 0, errors, warnings };
    });
  }

  // Add event to sync queue with validation
  addSyncEvent(type: string, userId: string, data: any, source: 'user' | 'admin' = 'user'): boolean {
    try {
      // Validate and sanitize data
      let validation: SyncValidation;
      let sanitizedData = DataValidator.sanitizeData(data);
      
      switch (type) {
        case 'transaction':
          validation = DataValidator.validateTransaction(sanitizedData);
          if (validation.sanitizedData) sanitizedData = validation.sanitizedData;
          break;
        case 'user_registration':
        case 'balance_update':
          validation = DataValidator.validateUser(sanitizedData);
          if (validation.sanitizedData) sanitizedData = validation.sanitizedData;
          break;
        case 'pending_payment':
          validation = DataValidator.validatePendingPayment(sanitizedData);
          if (validation.sanitizedData) sanitizedData = validation.sanitizedData;
          break;
        case 'game_activity':
        case 'casino_win':
        case 'sports_betting':
          validation = DataValidator.validateGameActivity(sanitizedData);
          if (validation.sanitizedData) sanitizedData = validation.sanitizedData;
          break;
        default:
          validation = this.validateData(type, sanitizedData);
      }
      
      if (!validation.isValid) {
        console.error(`Sync validation failed for ${type}:`, validation.errors);
        return false;
      }

      if (validation.warnings.length > 0) {
        console.warn(`Sync warnings for ${type}:`, validation.warnings);
      }

      const event: SyncEvent = {
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        userId,
        data: { ...sanitizedData, syncTimestamp: new Date() },
        timestamp: new Date(),
        source,
        status: 'pending',
        retryCount: 0
      };

      this.eventQueue.push(event);
      this.auditLog.push(event);

      // Trigger immediate processing
      setTimeout(() => this.processSyncQueue(), 0);

      return true;
    } catch (error) {
      console.error('Failed to add sync event:', error);
      return false;
    }
  }

  // Validate data according to rules
  private validateData(type: string, data: any): SyncValidation {
    const validator = this.validationRules.get(type);
    if (!validator) {
      return { isValid: true, errors: [], warnings: ['No validation rules defined for ' + type] };
    }
    return validator(data);
  }

  // Process sync queue
  private async processSyncQueue() {
    if (this.isProcessing || this.eventQueue.length === 0) return;

    this.isProcessing = true;

    try {
      const pendingEvents = this.eventQueue.filter(e => e.status === 'pending');
      
      for (const event of pendingEvents) {
        try {
          await this.processEvent(event);
          event.status = 'synced';
        } catch (error) {
          console.error(`Failed to process sync event ${event.id}:`, error);
          event.status = 'failed';
          event.retryCount++;

          // Retry logic
          if (event.retryCount < 3) {
            event.status = 'pending';
            setTimeout(() => this.processSyncQueue(), 1000 * event.retryCount);
          }
        }
      }

      // Remove successfully synced events older than 1 hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      this.eventQueue = this.eventQueue.filter(e => 
        e.status !== 'synced' || e.timestamp > oneHourAgo
      );

    } finally {
      this.isProcessing = false;
    }
  }

  // Process individual sync event
  private async processEvent(event: SyncEvent) {
    const listeners = this.syncListeners.get(event.type) || [];
    
    if (listeners.length > 0) {
      for (const listener of listeners) {
        try {
          await listener(event);
        } catch (error) {
          console.error(`Sync listener failed for ${event.type}:`, error);
          throw error;
        }
      }
    } else {
      // Fallback to window events for backward compatibility
      window.dispatchEvent(new CustomEvent(event.type, {
        detail: event.data
      }));
    }

    // Broadcast to window for cross-context communication
    window.dispatchEvent(new CustomEvent(`sync_${event.type}`, {
      detail: { ...event, processed: true }
    }));
  }

  // Register sync listener
  addSyncListener(type: string, listener: (event: SyncEvent) => void | Promise<void>) {
    if (!this.syncListeners.has(type)) {
      this.syncListeners.set(type, []);
    }
    this.syncListeners.get(type)!.push(listener);
  }

  // Remove sync listener
  removeSyncListener(type: string, listener: Function) {
    const listeners = this.syncListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Get sync statistics
  getSyncStats() {
    const total = this.auditLog.length;
    const synced = this.auditLog.filter(e => e.status === 'synced').length;
    const failed = this.auditLog.filter(e => e.status === 'failed').length;
    const pending = this.auditLog.filter(e => e.status === 'pending').length;

    return {
      total,
      synced,
      failed,
      pending,
      successRate: total > 0 ? (synced / total) * 100 : 100
    };
  }

  // Get failed events for debugging
  getFailedEvents(): SyncEvent[] {
    return this.auditLog.filter(e => e.status === 'failed');
  }

  // Retry failed events
  retryFailedEvents() {
    const failedEvents = this.eventQueue.filter(e => e.status === 'failed');
    failedEvents.forEach(event => {
      event.status = 'pending';
      event.retryCount = 0;
    });
    this.processSyncQueue();
  }

  // Start background sync processor
  private startSyncProcessor() {
    setInterval(() => {
      this.processSyncQueue();
    }, 5000); // Process every 5 seconds
  }

  // Clear old audit logs
  clearOldLogs() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.auditLog = this.auditLog.filter(e => e.timestamp > oneDayAgo);
  }

  // Force sync all pending events
  forceSyncAll() {
    const pendingEvents = this.eventQueue.filter(e => e.status === 'pending');
    pendingEvents.forEach(event => {
      event.retryCount = 0;
    });
    this.processSyncQueue();
  }

  // Get event queue status
  getQueueStatus() {
    return {
      total: this.eventQueue.length,
      pending: this.eventQueue.filter(e => e.status === 'pending').length,
      processing: this.isProcessing,
      lastProcessed: this.eventQueue.length > 0 ? 
        Math.max(...this.eventQueue.map(e => e.timestamp.getTime())) : null
    };
  }
}

// Export singleton instance
import { DataValidator } from '../utils/dataValidator';
export const syncManager = DataSyncManager.getInstance();