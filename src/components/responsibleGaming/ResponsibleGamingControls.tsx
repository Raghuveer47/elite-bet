import React, { useState, useEffect } from 'react';
import { Shield, Clock, DollarSign, AlertTriangle, Ban } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ResponsibleGamingService } from '../../services/responsibleGamingService';
import { ResponsibleGamingLimits, SelfExclusion } from '../../types/responsibleGaming';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';

export function ResponsibleGamingControls() {
  const { user } = useAuth();
  const [limits, setLimits] = useState<ResponsibleGamingLimits[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSelfExclusion, setShowSelfExclusion] = useState(false);
  const [exclusionData, setExclusionData] = useState({
    type: 'temporary' as const,
    reason: '',
    duration: 7 // days
  });

  const [limitValues, setLimitValues] = useState({
    deposit_daily: '',
    deposit_weekly: '',
    deposit_monthly: '',
    loss_daily: '',
    loss_weekly: '',
    loss_monthly: '',
    session_time: '',
    bet_amount: ''
  });

  useEffect(() => {
    if (user) {
      const userLimits = ResponsibleGamingService.getUserLimits(user.id);
      setLimits(userLimits);
      
      // Populate current limit values
      const values: any = {};
      userLimits.forEach(limit => {
        if (limit.limitType === 'session_time') {
          values[limit.limitType] = limit.limitDuration?.toString() || '';
        } else {
          values[limit.limitType] = limit.limitAmount?.toString() || '';
        }
      });
      setLimitValues(prev => ({ ...prev, ...values }));
    }
  }, [user]);

  const handleSetLimit = async (limitType: ResponsibleGamingLimits['limitType']) => {
    if (!user) return;

    const value = limitValues[limitType];
    if (!value || parseFloat(value) <= 0) {
      toast.error('Please enter a valid limit amount');
      return;
    }

    setIsLoading(true);
    try {
      const limitData: Omit<ResponsibleGamingLimits, 'id' | 'createdAt'> = {
        userId: user.id,
        limitType,
        active: true,
        effectiveFrom: new Date()
      };

      if (limitType === 'session_time') {
        limitData.limitDuration = parseInt(value);
      } else {
        limitData.limitAmount = parseFloat(value);
        limitData.currency = 'USD';
      }

      const newLimit = await ResponsibleGamingService.setLimit(user.id, limitData);
      setLimits(prev => [...prev.filter(l => l.limitType !== limitType), newLimit]);
      toast.success(`${limitType.replace('_', ' ')} limit set successfully`);
    } catch (error) {
      toast.error('Failed to set limit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelfExclusion = async () => {
    if (!user || !exclusionData.reason.trim()) {
      toast.error('Please provide a reason for self-exclusion');
      return;
    }

    setIsLoading(true);
    try {
      const endDate = exclusionData.type === 'temporary' 
        ? new Date(Date.now() + exclusionData.duration * 24 * 60 * 60 * 1000)
        : undefined;

      await ResponsibleGamingService.createSelfExclusion(
        user.id, 
        exclusionData.type, 
        exclusionData.reason, 
        endDate
      );

      toast.success('Self-exclusion request submitted');
      setShowSelfExclusion(false);
      
      // In a real app, this would log the user out immediately
    } catch (error) {
      toast.error('Failed to submit self-exclusion');
    } finally {
      setIsLoading(false);
    }
  };

  const limitTypes = [
    { key: 'deposit_daily', name: 'Daily Deposit Limit', icon: DollarSign, unit: 'USD' },
    { key: 'deposit_weekly', name: 'Weekly Deposit Limit', icon: DollarSign, unit: 'USD' },
    { key: 'deposit_monthly', name: 'Monthly Deposit Limit', icon: DollarSign, unit: 'USD' },
    { key: 'loss_daily', name: 'Daily Loss Limit', icon: DollarSign, unit: 'USD' },
    { key: 'loss_weekly', name: 'Weekly Loss Limit', icon: DollarSign, unit: 'USD' },
    { key: 'loss_monthly', name: 'Monthly Loss Limit', icon: DollarSign, unit: 'USD' },
    { key: 'session_time', name: 'Session Time Limit', icon: Clock, unit: 'minutes' },
    { key: 'bet_amount', name: 'Maximum Bet Amount', icon: DollarSign, unit: 'USD' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="w-6 h-6 text-green-400" />
          <h3 className="text-xl font-semibold">Responsible Gaming</h3>
        </div>
        <p className="text-slate-400">
          Set limits to help you stay in control of your gambling. These limits help ensure 
          you gamble responsibly and within your means.
        </p>
      </div>

      {/* Spending Limits */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h4 className="text-lg font-semibold mb-4">Spending & Time Limits</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {limitTypes.map(limitType => {
            const currentLimit = limits.find(l => l.limitType === limitType.key as any);
            const Icon = limitType.icon;
            
            return (
              <div key={limitType.key} className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Icon className="w-5 h-5 text-blue-400" />
                  <h5 className="font-medium">{limitType.name}</h5>
                </div>
                
                {currentLimit ? (
                  <div className="space-y-2">
                    <p className="text-sm text-green-400">
                      Current limit: {limitType.unit === 'USD' 
                        ? formatCurrency(currentLimit.limitAmount || 0)
                        : `${currentLimit.limitDuration} ${limitType.unit}`
                      }
                    </p>
                    <p className="text-xs text-slate-400">
                      Set on: {currentLimit.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        placeholder={`Enter ${limitType.unit === 'USD' ? 'amount' : 'minutes'}`}
                        value={limitValues[limitType.key as keyof typeof limitValues]}
                        onChange={(e) => setLimitValues(prev => ({
                          ...prev,
                          [limitType.key]: e.target.value
                        }))}
                        className="flex-1"
                        min="1"
                        step={limitType.unit === 'USD' ? '0.01' : '1'}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetLimit(limitType.key as ResponsibleGamingLimits['limitType'])}
                        disabled={isLoading}
                      >
                        Set
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Self-Exclusion */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center space-x-2 mb-4">
          <Ban className="w-6 h-6 text-red-400" />
          <h4 className="text-lg font-semibold">Self-Exclusion</h4>
        </div>
        
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <h5 className="font-medium text-red-400 mb-1">Important Notice</h5>
              <p className="text-sm text-slate-300">
                Self-exclusion will prevent you from accessing your account for the specified period. 
                This action cannot be undone and requires manual review to lift.
              </p>
            </div>
          </div>
        </div>

        {!showSelfExclusion ? (
          <Button
            variant="danger"
            onClick={() => setShowSelfExclusion(true)}
          >
            Request Self-Exclusion
          </Button>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Exclusion Type</label>
              <select
                value={exclusionData.type}
                onChange={(e) => setExclusionData(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              >
                <option value="temporary">Temporary (Specific Duration)</option>
                <option value="permanent">Permanent (Indefinite)</option>
              </select>
            </div>

            {exclusionData.type === 'temporary' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Duration (Days)</label>
                <select
                  value={exclusionData.duration}
                  onChange={(e) => setExclusionData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                >
                  <option value={1}>1 Day</option>
                  <option value={7}>1 Week</option>
                  <option value={30}>1 Month</option>
                  <option value={90}>3 Months</option>
                  <option value={180}>6 Months</option>
                  <option value={365}>1 Year</option>
                </select>
              </div>
            )}

            <Input
              label="Reason for Self-Exclusion"
              value={exclusionData.reason}
              onChange={(e) => setExclusionData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Please explain why you want to self-exclude"
              required
            />

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowSelfExclusion(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleSelfExclusion}
                disabled={isLoading || !exclusionData.reason.trim()}
              >
                {isLoading ? 'Submitting...' : 'Confirm Self-Exclusion'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Help Resources */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h4 className="text-lg font-semibold mb-4">Need Help?</h4>
        <div className="space-y-3">
          <a 
            href="https://www.gamblersanonymous.org" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
          >
            <h5 className="font-medium text-blue-400">Gamblers Anonymous</h5>
            <p className="text-sm text-slate-400">Support for problem gambling</p>
          </a>
          
          <a 
            href="https://www.ncpgambling.org" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
          >
            <h5 className="font-medium text-blue-400">National Council on Problem Gambling</h5>
            <p className="text-sm text-slate-400">Resources and helpline</p>
          </a>
          
          <div className="p-3 bg-slate-700 rounded-lg">
            <h5 className="font-medium text-green-400">24/7 Support Helpline</h5>
            <p className="text-sm text-slate-400">1-800-522-4700</p>
          </div>
        </div>
      </div>
    </div>
  );
}