import { useState, useEffect } from 'react';
import { ResponsibleGamingService } from '../services/responsibleGamingService';
import { RealityCheck } from '../types/responsibleGaming';
import { useAuth } from '../contexts/SupabaseAuthContext';

export function useRealityCheck() {
  const { user } = useAuth();
  const [sessionStart] = useState(new Date());
  const [showRealityCheck, setShowRealityCheck] = useState(false);
  const [currentCheck, setCurrentCheck] = useState<RealityCheck | null>(null);
  const [sessionStats, setSessionStats] = useState({
    amountWagered: 0,
    amountLost: 0
  });

  useEffect(() => {
    if (!user) return;

    const settings = ResponsibleGamingService.loadRGData().settings;
    const checkInterval = settings.realityCheckInterval * 60 * 1000; // Convert to milliseconds

    const interval = setInterval(async () => {
      const timeSpent = Math.floor((new Date().getTime() - sessionStart.getTime()) / (1000 * 60));
      
      if (timeSpent >= settings.realityCheckInterval) {
        const realityCheck = await ResponsibleGamingService.triggerRealityCheck(
          user.id,
          sessionStart,
          sessionStats.amountWagered,
          sessionStats.amountLost
        );
        
        setCurrentCheck(realityCheck);
        setShowRealityCheck(true);
      }
    }, checkInterval);

    return () => clearInterval(interval);
  }, [user, sessionStart, sessionStats]);

  const updateSessionStats = (wagered: number, lost: number) => {
    setSessionStats(prev => ({
      amountWagered: prev.amountWagered + wagered,
      amountLost: prev.amountLost + lost
    }));
  };

  const acknowledgeRealityCheck = () => {
    setShowRealityCheck(false);
    setCurrentCheck(null);
  };

  const takeBreak = () => {
    setShowRealityCheck(false);
    setCurrentCheck(null);
    // In a real app, this might redirect to a break page or log the user out
    window.location.href = '/dashboard';
  };

  return {
    showRealityCheck,
    currentCheck,
    sessionStats,
    updateSessionStats,
    acknowledgeRealityCheck,
    takeBreak
  };
}