import { useEffect } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { supabase } from '../lib/supabase';
import { BackendAuthService } from '../services/backendAuthService';
import toast from 'react-hot-toast';

export function useSessionMonitor() {
  const { logout: userLogout, isAuthenticated } = useAuth();

  useEffect(() => {
    // Monitor for session expiry
    const checkSessions = async () => {
      const useBackend = (import.meta as any).env?.VITE_USE_BACKEND_AUTH === 'true';
      // Check user session
      if (isAuthenticated) {
        if (useBackend) {
          try {
            const token = localStorage.getItem('elitebet_backend_token');
            if (!token) {
              userLogout();
              toast.error('Your session has expired. Please login again.');
              return;
            }
            await BackendAuthService.me(token);
          } catch (error) {
            userLogout();
            toast.error('Your session has expired. Please login again.');
            return;
          }
        } else {
          try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error || !session) {
              userLogout();
              toast.error('Your session has expired. Please login again.');
              return;
            }
            if (session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
              userLogout();
              toast.error('Your session has expired. Please login again.');
              return;
            }
          } catch (error) {
            console.error('Session check error:', error);
            userLogout();
            toast.error('Session validation failed. Please login again.');
          }
        }
      }

      // Check admin session (only if we're in admin context)
      try {
        const adminSession = localStorage.getItem('elitebet_admin_session');
        if (adminSession) {
          const session = JSON.parse(adminSession);
          if (new Date(session.expiresAt) < new Date()) {
            localStorage.removeItem('elitebet_admin_session');
            toast.error('Admin session has expired. Please login again.');
            if (window.location.pathname.startsWith('/admin')) {
              window.location.href = '/admin/login';
            }
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
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        // Tab became visible, check if sessions are still valid
        setTimeout(async () => {
          if (isAuthenticated) {
            const useBackend = (import.meta as any).env?.VITE_USE_BACKEND_AUTH === 'true';
            if (useBackend) {
              try {
                const token = localStorage.getItem('elitebet_backend_token');
                if (!token) {
                  userLogout();
                  toast.error('Your session expired while you were away.');
                  return;
                }
                await BackendAuthService.me(token);
              } catch {
                userLogout();
                toast.error('Your session expired while you were away.');
                return;
              }
            } else {
              try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error || !session) {
                  userLogout();
                  toast.error('Your session expired while you were away.');
                  return;
                }
                if (session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
                  userLogout();
                  toast.error('Your session expired while you were away.');
                  return;
                }
              } catch (error) {
                console.error('Session check error:', error);
                userLogout();
                toast.error('Session validation failed.');
              }
            }
          }
          
          // Check admin session without requiring AdminContext
          try {
            const adminSession = localStorage.getItem('elitebet_admin_session');
            if (adminSession) {
              const session = JSON.parse(adminSession);
              if (new Date(session.expiresAt) < new Date()) {
                localStorage.removeItem('elitebet_admin_session');
                toast.error('Admin session expired while you were away.');
                if (window.location.pathname.startsWith('/admin')) {
                  window.location.href = '/admin/login';
                }
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