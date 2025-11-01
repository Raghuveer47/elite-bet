import { useState, useEffect } from 'react';
import { Shield, Gift, X, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/SupabaseAuthContext';

export function KYCVerificationBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [kycStatus, setKycStatus] = useState<string>('not_submitted');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check if user has dismissed the banner
    const dismissedKey = `kyc_banner_dismissed_${user.id}`;
    if (localStorage.getItem(dismissedKey)) {
      return;
    }

    // Load KYC status
    loadKYCStatus();
  }, [user]);

  const loadKYCStatus = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/kyc/status/${user!.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setKycStatus(data.kycStatus);
        
        // Show banner only if not verified
        if (data.kycStatus === 'not_submitted') {
          setIsVisible(true);
        }
      }
    } catch (error) {
      console.error('Failed to load KYC status:', error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
    // Remember dismissal for 24 hours
    const dismissedKey = `kyc_banner_dismissed_${user!.id}`;
    localStorage.setItem(dismissedKey, Date.now().toString());
    
    // Auto-remove after 24 hours
    setTimeout(() => {
      localStorage.removeItem(dismissedKey);
    }, 24 * 60 * 60 * 1000);
  };

  const handleVerifyNow = () => {
    navigate('/kyc-verification');
  };

  if (!isVisible || dismissed || kycStatus !== 'not_submitted') {
    return null;
  }

  return (
    <>
      {/* Floating Banner */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-3xl px-4 animate-slideDown">
        <div className="bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 rounded-xl shadow-2xl border-2 border-white/20 overflow-hidden">
          <div className="relative p-6">
            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-pulse">
                  <Gift className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1 flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Complete KYC & Get ₹100 FREE!</span>
                </h3>
                <p className="text-white/90 text-sm">
                  Verify your identity in just 2 minutes and receive instant ₹100 bonus to your account
                </p>
              </div>

              {/* CTA Button */}
              <div className="flex-shrink-0">
                <Button
                  onClick={handleVerifyNow}
                  className="bg-white text-red-600 hover:bg-gray-100 font-semibold px-6 py-3 flex items-center space-x-2 shadow-lg"
                >
                  <span>Verify Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Benefits */}
            <div className="mt-4 flex items-center space-x-6 text-xs text-white/80">
              <span className="flex items-center space-x-1">
                <Shield className="w-3 h-3" />
                <span>Secure</span>
              </span>
              <span className="flex items-center space-x-1">
                <Gift className="w-3 h-3" />
                <span>Instant Bonus</span>
              </span>
              <span className="flex items-center space-x-1">
                <ArrowRight className="w-3 h-3" />
                <span>2 Mins Process</span>
              </span>
            </div>
          </div>

          {/* Animated border effect */}
          <div className="h-1 bg-gradient-to-r from-white/0 via-white/50 to-white/0 animate-shimmer"></div>
        </div>
      </div>

      {/* Modal Popup (appears after 5 seconds) */}
      <KYCVerificationModal 
        isOpen={isVisible} 
        onClose={handleDismiss}
        onVerify={handleVerifyNow}
      />
    </>
  );
}

// Modal popup
function KYCVerificationModal({ isOpen, onClose, onVerify }: { 
  isOpen: boolean; 
  onClose: () => void;
  onVerify: () => void;
}) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Show modal after 5 seconds
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl max-w-md w-full border-2 border-red-500 shadow-2xl animate-scaleIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 rounded-t-2xl relative">
          <button
            onClick={() => {
              setShowModal(false);
              onClose();
            }}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
              <Gift className="w-10 h-10 text-white animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold text-white">Get ₹100 FREE!</h2>
            <p className="text-white/90 mt-2">Complete KYC Verification Now</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-700 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-3">Quick & Easy Process:</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start space-x-2">
                <span className="text-green-400 font-bold">1.</span>
                <span>Enter phone number & upload Aadhaar/PAN</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-400 font-bold">2.</span>
                <span>Verify email with OTP</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-400 font-bold">3.</span>
                <span>Get instant ₹100 in your wallet!</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-lg p-4 border border-red-500/30">
            <p className="text-center text-white text-sm">
              <Gift className="w-4 h-4 inline mr-1" />
              Limited time offer! <span className="font-bold">Get ₹100 bonus</span> when you verify today
            </p>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={() => {
                setShowModal(false);
                onClose();
              }}
              variant="outline"
              className="flex-1"
            >
              Maybe Later
            </Button>
            <Button
              onClick={() => {
                setShowModal(false);
                onVerify();
              }}
              className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            >
              Verify Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add CSS animations to index.css
const styles = `
@keyframes slideDown {
  from {
    transform: translate(-50%, -100%);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-slideDown {
  animation: slideDown 0.5s ease-out;
}

.animate-scaleIn {
  animation: scaleIn 0.3s ease-out;
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
`;

