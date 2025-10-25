import React, { useState, useEffect } from 'react';
import { Gift, X, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { Button } from './ui/Button';
import toast from 'react-hot-toast';

export function WelcomeBonusNotification() {
  const { user } = useAuth();
  const [showBonus, setShowBonus] = useState(false);
  const [hasSeenBonus, setHasSeenBonus] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check if user has seen the welcome bonus notification
    const bonusSeen = localStorage.getItem(`welcome_bonus_seen_${user.id}`);
    
    if (!bonusSeen && user.balance >= 100) {
      // Show bonus notification for new users with $100+ balance
      setShowBonus(true);
    }
  }, [user]);

  const handleClaimBonus = () => {
    setShowBonus(false);
    setHasSeenBonus(true);
    
    // Mark as seen
    if (user) {
      localStorage.setItem(`welcome_bonus_seen_${user.id}`, 'true');
    }
    
    toast.success('🎉 Welcome to Elite Bet! Enjoy your $100 welcome bonus!');
  };

  const handleDismiss = () => {
    setShowBonus(false);
    setHasSeenBonus(true);
    
    // Mark as seen
    if (user) {
      localStorage.setItem(`welcome_bonus_seen_${user.id}`, 'true');
    }
  };

  if (!showBonus || hasSeenBonus) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-green-600 to-blue-600 rounded-2xl p-8 max-w-md w-full text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
        
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Gift className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-3xl font-bold mb-4">Welcome Bonus!</h2>
          <p className="text-white/90 mb-6 text-lg">
            🎉 Congratulations! You've received a <span className="font-bold text-yellow-300">$100 welcome bonus</span> to get you started!
          </p>
          
          <div className="bg-white/10 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-300" />
              <span className="font-semibold">Bonus Details:</span>
            </div>
            <ul className="text-sm text-white/80 space-y-1">
              <li>• $100 credited to your account</li>
              <li>• No wagering requirements</li>
              <li>• Use on any games or sports</li>
              <li>• Valid immediately</li>
            </ul>
          </div>

          <Button
            onClick={handleClaimBonus}
            className="w-full bg-white text-green-600 hover:bg-white/90 font-bold py-3 rounded-lg"
          >
            Claim Welcome Bonus
          </Button>
          
          <p className="text-white/70 text-sm mt-4">
            Start playing and enjoy your bonus!
          </p>
        </div>
      </div>
    </div>
  );
}
