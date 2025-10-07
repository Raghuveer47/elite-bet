/**
 * Data Validation Utilities for Sync Operations
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedData?: any;
}

export class DataValidator {
  // Validate transaction data
  static validateTransaction(transaction: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitizedData = { ...transaction };

    // Required fields
    if (!transaction.id) errors.push('Transaction ID is required');
    if (!transaction.userId) errors.push('User ID is required');
    if (!transaction.type) errors.push('Transaction type is required');
    if (!transaction.status) errors.push('Transaction status is required');
    if (!transaction.currency) errors.push('Currency is required');

    // Type validation
    if (typeof transaction.amount !== 'number') {
      errors.push('Amount must be a number');
    } else {
      // Sanitize amount
      sanitizedData.amount = Math.round(transaction.amount * 100) / 100;
      if (transaction.amount === 0) warnings.push('Zero amount transaction');
    }

    if (typeof transaction.fee !== 'number') {
      errors.push('Fee must be a number');
    } else {
      sanitizedData.fee = Math.round(transaction.fee * 100) / 100;
    }

    // Enum validation
    const validTypes = ['deposit', 'withdraw', 'bet', 'win', 'bonus', 'refund', 'fee'];
    if (!validTypes.includes(transaction.type)) {
      errors.push(`Invalid transaction type: ${transaction.type}`);
    }

    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(transaction.status)) {
      errors.push(`Invalid transaction status: ${transaction.status}`);
    }

    // Date validation
    if (transaction.createdAt && !(transaction.createdAt instanceof Date)) {
      try {
        sanitizedData.createdAt = new Date(transaction.createdAt);
      } catch {
        errors.push('Invalid createdAt date');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData
    };
  }

  // Validate user data
  static validateUser(user: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitizedData = { ...user };

    // Required fields
    if (!user.id) errors.push('User ID is required');
    if (!user.email) errors.push('Email is required');
    if (!user.firstName) errors.push('First name is required');
    if (!user.lastName) errors.push('Last name is required');

    // Email validation
    if (user.email && !/\S+@\S+\.\S+/.test(user.email)) {
      errors.push('Invalid email format');
    }

    // Balance validation
    if (typeof user.balance !== 'number') {
      errors.push('Balance must be a number');
    } else {
      sanitizedData.balance = Math.round(user.balance * 100) / 100;
      if (user.balance < 0) errors.push('Balance cannot be negative');
    }

    // Status validation
    const validStatuses = ['active', 'suspended', 'closed'];
    if (user.status && !validStatuses.includes(user.status)) {
      errors.push(`Invalid user status: ${user.status}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData
    };
  }

  // Validate pending payment
  static validatePendingPayment(payment: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitizedData = { ...payment };

    // Required fields
    if (!payment.id) errors.push('Payment ID is required');
    if (!payment.userId) errors.push('User ID is required');
    if (!payment.type) errors.push('Payment type is required');
    if (!payment.transactionId) errors.push('Transaction ID is required');

    // Type validation
    if (typeof payment.amount !== 'number') {
      errors.push('Amount must be a number');
    } else {
      sanitizedData.amount = Math.round(payment.amount * 100) / 100;
      if (payment.amount <= 0) errors.push('Amount must be positive');
    }

    // Enum validation
    const validTypes = ['deposit', 'withdraw'];
    if (!validTypes.includes(payment.type)) {
      errors.push(`Invalid payment type: ${payment.type}`);
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'investigating'];
    if (payment.status && !validStatuses.includes(payment.status)) {
      errors.push(`Invalid payment status: ${payment.status}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData
    };
  }

  // Validate game activity
  static validateGameActivity(activity: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitizedData = { ...activity };

    // Required fields
    if (!activity.gameId) errors.push('Game ID is required');
    if (!activity.userId) errors.push('User ID is required');
    if (!activity.action) errors.push('Action is required');

    // Amount validation (if present)
    if (activity.amount !== undefined) {
      if (typeof activity.amount !== 'number') {
        errors.push('Amount must be a number');
      } else {
        sanitizedData.amount = Math.round(activity.amount * 100) / 100;
      }
    }

    // Action validation
    const validActions = ['bet_placed', 'win_awarded', 'session_start', 'session_end', 'session_reset'];
    if (!validActions.includes(activity.action)) {
      errors.push(`Invalid game action: ${activity.action}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData
    };
  }

  // Generic data sanitizer
  static sanitizeData(data: any): any {
    if (data === null || data === undefined) return data;
    
    if (typeof data === 'object' && data instanceof Date) {
      return data;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }
    
    if (typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        // Remove potentially dangerous properties
        if (key.startsWith('__') || key === 'constructor' || key === 'prototype') {
          continue;
        }
        sanitized[key] = this.sanitizeData(value);
      }
      return sanitized;
    }
    
    return data;
  }
}