import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SessionManager } from '../utils/sessionStorage';
import toast from 'react-hot-toast';

export function useSessionMonitor() {
  const { logout: userLogout, isAuthenticated } = useAuth();

  useEffect(() => {
    // Monitor for session expiry
    const checkSessions = () => {
      // Check user session
      if (isAuthenticated && !SessionManager.isUserSessionValid()) {
        userLogout();
        toast.error('Your session has expired. Please login again.');
      }

      // Check admin session (only if we're in admin context)
      try {
        const adminSession = SessionManager.getAdminSession();
        if (adminSession && !SessionManager.isAdminSessionValid()) {
          SessionManager.clearAdminSession();
          toast.error('Admin session has expired. Please login again.');
          if (window.location.pathname.startsWith('/admin')) {
            window.location.href = '/admin/login';
          }
        }
      } catch (error) {
        // Ignore admin context errors if not in admin area
      }
    };

    // Check sessions every minute
    const interval = setInterval(checkSessions, 60 * 1000);

    // Check immediately
    checkSessions();

    return () => clearInterval(interval);
  }, [isAuthenticated, userLogout]);

  // Handle browser tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible, check if sessions are still valid
        setTimeout(() => {
          if (isAuthenticated && !SessionManager.isUserSessionValid()) {
            userLogout();
            toast.error('Your session expired while you were away.');
          }
          
        // Check admin session without requiring AdminContext
        try {
          const adminSession = SessionManager.getAdminSession();
          if (adminSession && !SessionManager.isAdminSessionValid()) {
            SessionManager.clearAdminSession();
            toast.error('Admin session expired while you were away.');
            if (window.location.pathname.startsWith('/admin')) {
              window.location.href = '/admin/login';
            }
          }
        } catch (error) {
          // Ignore admin context errors if not in admin area
        }
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, userLogout]);

  // Handle browser storage events (for multi-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'elitebet_user_session' && e.newValue === null) {
        // User session was cleared in another tab
        if (isAuthenticated) {
          userLogout();
          toast('You were logged out from another tab.');
        }
      }
      
      if (e.key === 'elitebet_admin_session' && e.newValue === null) {
        // Admin session was cleared in another tab
        if (window.location.pathname.startsWith('/admin')) {
          toast('Admin session ended from another tab.');
          window.location.href = '/admin/login';
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isAuthenticated, userLogout]);
}