import React from 'react';
import { Clock, DollarSign, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { RealityCheck } from '../../types/responsibleGaming';
import { ResponsibleGamingService } from '../../services/responsibleGamingService';
import { formatCurrency } from '../../lib/utils';

interface RealityCheckModalProps {
  realityCheck: RealityCheck;
  onAcknowledge: () => void;
  onTakeBreak: () => void;
}

export function RealityCheckModal({ realityCheck, onAcknowledge, onTakeBreak }: RealityCheckModalProps) {
  const handleAcknowledge = () => {
    ResponsibleGamingService.acknowledgeRealityCheck(realityCheck.id);
    onAcknowledge();
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Reality Check</h2>
          <p className="text-slate-400">Time for a quick review of your session</p>
        </div>

        {/* Session Stats */}
        <div className="space-y-4 mb-6">
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="text-slate-300">Time Played</span>
              </div>
              <span className="text-lg font-bold text-blue-400">
                {formatTime(realityCheck.timeSpent)}
              </span>
            </div>
          </div>

          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-purple-400" />
                <span className="text-slate-300">Amount Wagered</span>
              </div>
              <span className="text-lg font-bold text-purple-400">
                {formatCurrency(realityCheck.amountWagered)}
              </span>
            </div>
          </div>

          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-red-400" />
                <span className="text-slate-300">Net Loss</span>
              </div>
              <span className="text-lg font-bold text-red-400">
                {formatCurrency(realityCheck.amountLost)}
              </span>
            </div>
          </div>
        </div>

        {/* Warning if losses are high */}
        {realityCheck.amountLost > 200 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-400 mb-1">High Loss Alert</h4>
                <p className="text-sm text-slate-300">
                  You've lost a significant amount this session. Consider taking a break.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={onTakeBreak}
            className="w-full"
          >
            Take a Break
          </Button>
          
          <Button
            onClick={handleAcknowledge}
            className="w-full"
          >
            Continue Playing
          </Button>
        </div>

        {/* Help Resources */}
        <div className="mt-6 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-400 text-center mb-2">
            Need help with gambling? Contact:
          </p>
          <p className="text-xs text-blue-400 text-center">
            National Problem Gambling Helpline: 1-800-522-4700
          </p>
        </div>
      </div>
    </div>
  );
}