import { useEffect } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import toast from 'react-hot-toast';

/**
 * UserStatusMonitor - Monitors user account status in real-time
 * Auto-logs out user if admin suspends/closes their account while they're active
 */
export function UserStatusMonitor() {
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!user || !isAuthenticated) return;

    let hasShownSuspendedToast = false;
    let hasShownClosedToast = false;

    const checkUserStatus = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/betting/balance/${user.id}`);
        
        if (!response.ok) {
          console.log('Status check failed (non-critical)');
          return;
        }

        const data = await response.json();
        
        if (data.success && data.userStatus) {
          const currentStatus = data.userStatus;

          // Account suspended while user is active
          if (currentStatus === 'suspended' && !hasShownSuspendedToast) {
            hasShownSuspendedToast = true;
            
            // Show prominent popup
            toast.error(
              (t) => (
                <div className="text-center">
                  <div className="text-2xl mb-2">⚠️</div>
                  <div className="font-bold text-lg mb-2">Account Suspended</div>
                  <div className="text-sm mb-3">
                    Your account has been suspended by admin.
                    <br />
                    You will be logged out in 5 seconds.
                  </div>
                  <div className="text-xs text-slate-400">
                    Contact: admin@spinzos.com
                  </div>
                </div>
              ),
              {
                duration: 5000,
                style: {
                  background: '#1e293b',
                  color: '#fff',
                  minWidth: '400px',
                  padding: '24px',
                  border: '2px solid #f59e0b'
                }
              }
            );

            console.log('🚨 User account suspended - logging out in 5 seconds');

            // Auto-logout after 5 seconds
            setTimeout(() => {
              logout();
              window.location.href = '/login';
            }, 5000);
          }

          // Account closed while user is active
          if (currentStatus === 'closed' && !hasShownClosedToast) {
            hasShownClosedToast = true;
            
            // Show prominent popup
            toast.error(
              (t) => (
                <div className="text-center">
                  <div className="text-2xl mb-2">🔒</div>
                  <div className="font-bold text-lg mb-2">Account Closed</div>
                  <div className="text-sm mb-3">
                    Your account has been permanently closed.
                    <br />
                    You will be logged out now.
                  </div>
                  <div className="text-xs text-slate-400">
                    For more information: admin@spinzos.com
                  </div>
                </div>
              ),
              {
                duration: 4000,
                style: {
                  background: '#1e293b',
                  color: '#fff',
                  minWidth: '400px',
                  padding: '24px',
                  border: '2px solid #ef4444'
                }
              }
            );

            console.log('🚨 User account closed - logging out immediately');

            // Auto-logout after 3 seconds
            setTimeout(() => {
              logout();
              window.location.href = '/login';
            }, 3000);
          }
        }
      } catch (error) {
        // Silent fail - don't disrupt user experience
        console.log('Status check error (non-critical):', error);
      }
    };

    // Check immediately on mount
    checkUserStatus();

    // Then check every 30 seconds
    const statusCheckInterval = setInterval(checkUserStatus, 30000);

    console.log('✅ UserStatusMonitor: Started monitoring for user:', user.email);

    return () => {
      clearInterval(statusCheckInterval);
      console.log('UserStatusMonitor: Stopped monitoring');
    };
  }, [user, isAuthenticated, logout]);

  return null; // This component doesn't render anything
}

