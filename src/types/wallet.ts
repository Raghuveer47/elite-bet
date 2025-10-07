export interface WalletAccount {
  id: string;
  userId: string;
  currency: string;
  accountType: 'main' | 'bonus' | 'locked';
  balance: number;
  reservedBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdraw' | 'bet' | 'win' | 'bonus' | 'refund' | 'fee';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  fee: number;
  method: string;
  externalReference?: string;
  provider?: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'bank' | 'ewallet' | 'crypto';
  fee: string;
  processingTime: string;
  minAmount: number;
  maxAmount: number;
  icon: string;
  available: boolean;
  currencies: string[];
}

export interface DepositRequest {
  amount: number;
  currency: string;
  method: string;
  returnUrl?: string;
  transactionId?: string;
  paymentProof?: File;
  base64Image?: string;
}

export interface WithdrawRequest {
  amount: number;
  currency: string;
  method: string;
  destination: string;
}

export interface PendingPayment {
  id: string;
  userId: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  currency: string;
  method: string;
  transactionId: string;
  paymentProofUrl: string;
  bankDetails?: BankDetails;
  status: 'pending' | 'approved' | 'rejected' | 'investigating';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
  adminNotes?: string;
}

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
  reference: string;
}

export interface WalletLimits {
  dailyDepositLimit: number;
  dailyWithdrawLimit: number;
  monthlyDepositLimit: number;
  monthlyWithdrawLimit: number;
  minDeposit: number;
  minWithdraw: number;
  maxDeposit: number;
  maxWithdraw: number;
}

export interface WalletStats {
  totalDeposited: number;
  totalWithdrawn: number;
  totalWagered: number;
  totalWon: number;
  pendingWithdrawals: number;
  activeBets: number;
  todayDeposited: number;
  todayWithdrawn: number;
  monthDeposited: number;
  monthWithdrawn: number;
}