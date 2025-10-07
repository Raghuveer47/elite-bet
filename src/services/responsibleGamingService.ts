import { ResponsibleGamingLimits, SelfExclusion, RealityCheck, ResponsibleGamingSettings } from '../types/responsibleGaming';

export class ResponsibleGamingService {
  private static readonly RG_STORAGE_KEY = 'elitebet_responsible_gaming';

  static saveRGData(data: any): void {
    try {
      localStorage.setItem(this.RG_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save responsible gaming data:', error);
    }
  }

  static loadRGData(): any {
    try {
      const stored = localStorage.getItem(this.RG_STORAGE_KEY);
      return stored ? JSON.parse(stored) : { 
        limits: [], 
        exclusions: [], 
        realityChecks: [], 
        settings: this.getDefaultSettings() 
      };
    } catch (error) {
      console.error('Failed to load responsible gaming data:', error);
      return { 
        limits: [], 
        exclusions: [], 
        realityChecks: [], 
        settings: this.getDefaultSettings() 
      };
    }
  }

  static getDefaultSettings(): ResponsibleGamingSettings {
    return {
      realityCheckInterval: 60, // 1 hour
      sessionTimeWarning: 120, // 2 hours
      lossWarningThreshold: 500,
      enablePopupReminders: true,
      enableTimeDisplays: true,
      enableSpendingDisplays: true
    };
  }

  static async setLimit(userId: string, limit: Omit<ResponsibleGamingLimits, 'id' | 'createdAt'>): Promise<ResponsibleGamingLimits> {
    const newLimit: ResponsibleGamingLimits = {
      ...limit,
      id: `limit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    const rgData = this.loadRGData();
    
    // Remove existing limit of same type
    rgData.limits = (rgData.limits || []).filter((l: ResponsibleGamingLimits) => 
      !(l.userId === userId && l.limitType === limit.limitType)
    );
    
    rgData.limits = [newLimit, ...rgData.limits];
    this.saveRGData(rgData);

    return newLimit;
  }

  static getUserLimits(userId: string): ResponsibleGamingLimits[] {
    const rgData = this.loadRGData();
    return (rgData.limits || []).filter((l: ResponsibleGamingLimits) => 
      l.userId === userId && l.active
    );
  }

  static async checkLimitViolation(userId: string, limitType: ResponsibleGamingLimits['limitType'], amount: number): Promise<boolean> {
    const limits = this.getUserLimits(userId);
    const relevantLimit = limits.find(l => l.limitType === limitType);
    
    if (!relevantLimit) return false;

    // Calculate current usage based on limit type
    const now = new Date();
    let currentUsage = 0;

    // This would typically query transaction history
    // For demo, we'll simulate
    if (limitType.includes('daily')) {
      // Check today's usage
      currentUsage = amount; // Simplified
    } else if (limitType.includes('weekly')) {
      // Check this week's usage
      currentUsage = amount; // Simplified
    } else if (limitType.includes('monthly')) {
      // Check this month's usage
      currentUsage = amount; // Simplified
    }

    return currentUsage + amount > (relevantLimit.limitAmount || 0);
  }

  static async createSelfExclusion(userId: string, type: SelfExclusion['type'], reason: string, endDate?: Date): Promise<SelfExclusion> {
    const exclusion: SelfExclusion = {
      id: `exclusion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      reason,
      startDate: new Date(),
      endDate,
      status: 'active',
      createdAt: new Date()
    };

    const rgData = this.loadRGData();
    rgData.exclusions = [exclusion, ...(rgData.exclusions || [])];
    this.saveRGData(rgData);

    // Trigger storage event for admin notification
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'elitebet_self_exclusion',
      newValue: JSON.stringify(exclusion)
    }));

    return exclusion;
  }

  static isUserExcluded(userId: string): boolean {
    const rgData = this.loadRGData();
    const exclusions = (rgData.exclusions || []).filter((e: SelfExclusion) => 
      e.userId === userId && e.status === 'active'
    );

    return exclusions.some((e: SelfExclusion) => {
      if (e.type === 'permanent') return true;
      if (e.endDate && new Date() < new Date(e.endDate)) return true;
      return false;
    });
  }

  static async triggerRealityCheck(userId: string, sessionStart: Date, amountWagered: number, amountLost: number): Promise<RealityCheck> {
    const timeSpent = Math.floor((new Date().getTime() - sessionStart.getTime()) / (1000 * 60));
    
    const realityCheck: RealityCheck = {
      id: `reality_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      sessionStart,
      timeSpent,
      amountWagered,
      amountLost,
      acknowledged: false
    };

    const rgData = this.loadRGData();
    rgData.realityChecks = [realityCheck, ...(rgData.realityChecks || [])];
    this.saveRGData(rgData);

    return realityCheck;
  }

  static acknowledgeRealityCheck(checkId: string): void {
    const rgData = this.loadRGData();
    const check = rgData.realityChecks?.find((c: RealityCheck) => c.id === checkId);
    
    if (check) {
      check.acknowledged = true;
      check.acknowledgedAt = new Date();
      this.saveRGData(rgData);
    }
  }
}