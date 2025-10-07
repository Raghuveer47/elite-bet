export interface ResponsibleGamingLimits {
  id: string;
  userId: string;
  limitType: 'deposit_daily' | 'deposit_weekly' | 'deposit_monthly' | 
            'loss_daily' | 'loss_weekly' | 'loss_monthly' | 
            'session_time' | 'bet_amount';
  limitAmount?: number;
  limitDuration?: number; // minutes for session limits
  currency?: string;
  active: boolean;
  createdAt: Date;
  effectiveFrom: Date;
  expiresAt?: Date;
}

export interface SelfExclusion {
  id: string;
  userId: string;
  type: 'temporary' | 'permanent';
  reason: string;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'expired' | 'revoked';
  createdAt: Date;
}

export interface RealityCheck {
  id: string;
  userId: string;
  sessionStart: Date;
  timeSpent: number; // minutes
  amountWagered: number;
  amountLost: number;
  acknowledged: boolean;
  acknowledgedAt?: Date;
}

export interface ResponsibleGamingSettings {
  realityCheckInterval: number; // minutes
  sessionTimeWarning: number; // minutes
  lossWarningThreshold: number; // amount
  enablePopupReminders: boolean;
  enableTimeDisplays: boolean;
  enableSpendingDisplays: boolean;
}