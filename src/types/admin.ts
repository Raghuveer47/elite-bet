export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  permissions: string[];
  lastLogin: Date;
  isActive: boolean;
}

export interface AdminRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  level: number;
}

export interface UserManagement {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  balance: number;
  status: 'active' | 'suspended' | 'closed';
  isVerified: boolean;
  registrationDate: Date;
  lastLogin: Date;
  totalDeposited: number;
  totalWithdrawn: number;
  totalWagered: number;
  activeBets: number;
  country: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalBets: number;
  totalWinnings: number;
  platformRevenue: number;
  pendingWithdrawals: number;
  pendingVerifications: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

export interface GameManagement {
  id: string;
  name: string;
  provider: string;
  category: string;
  rtp: number;
  isActive: boolean;
  totalPlayed: number;
  totalWagered: number;
  totalPayout: number;
  profitMargin: number;
  lastPlayed: Date;
}

export interface FinancialReport {
  period: string;
  totalRevenue: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalBets: number;
  totalWinnings: number;
  netProfit: number;
  activeUsers: number;
  newUsers: number;
  conversionRate: number;
}

export interface RiskAlert {
  id: string;
  userId: string;
  type: 'high_loss' | 'suspicious_activity' | 'large_deposit' | 'rapid_betting' | 'unusual_pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  amount?: number;
  createdAt: Date;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'critical';
}