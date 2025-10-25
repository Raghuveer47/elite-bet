// Session persistence helper
export const SessionHelper = {
  // Check if user has a valid session
  hasValidSession: () => {
    try {
      const sessionData = localStorage.getItem('sb-auth-token');
      return !!sessionData;
    } catch {
      return false;
    }
  },

  // Clear all session data
  clearSession: () => {
    try {
      console.log('SessionHelper: Clearing all session data');
      
      // Get all localStorage keys first
      const allKeys = Object.keys(localStorage);
      console.log('SessionHelper: Current localStorage keys:', allKeys);
      
      // Clear Supabase auth token
      localStorage.removeItem('sb-auth-token');
      localStorage.removeItem('supabase.auth.token');
      
      // Clear all Supabase-related keys (but preserve user sessions)
      allKeys.forEach(key => {
        if (key.startsWith('sb-') || 
            key.includes('supabase') || 
            key.includes('auth') ||
            (key.includes('session') && !key.includes('admin')) ||
            key.includes('token') ||
            (key.includes('user') && !key.includes('admin'))) {
          console.log('SessionHelper: Removing key:', key);
          localStorage.removeItem(key);
        }
      });
      
      // Clear app-specific session data (but preserve admin session)
      localStorage.removeItem('elitebet_user_session');
      // Don't remove 'elitebet_admin_session' - preserve admin login
      
      // Clear session storage but preserve admin session
      const adminSession = sessionStorage.getItem('elitebet_admin_session');
      sessionStorage.clear();
      if (adminSession) {
        sessionStorage.setItem('elitebet_admin_session', adminSession);
      }
      
      // Log remaining keys after cleanup
      const remainingKeys = Object.keys(localStorage);
      console.log('SessionHelper: Remaining localStorage keys after cleanup:', remainingKeys);
      console.log('SessionHelper: All session data cleared');
    } catch (error) {
      console.error('SessionHelper: Error clearing session:', error);
    }
  },

  // Nuclear option - clear ALL localStorage (use with caution)
  clearAllStorage: () => {
    try {
      console.log('SessionHelper: NUCLEAR OPTION - Clearing ALL localStorage');
      localStorage.clear();
      sessionStorage.clear();
      console.log('SessionHelper: ALL storage cleared');
    } catch (error) {
      console.error('SessionHelper: Error clearing all storage:', error);
    }
  },

  // Get session info
  getSessionInfo: () => {
    try {
      const sessionData = localStorage.getItem('sb-auth-token');
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        return {
          hasSession: true,
          expiresAt: parsed.expires_at,
          isExpired: new Date(parsed.expires_at * 1000) < new Date()
        };
      }
      return { hasSession: false };
    } catch {
      return { hasSession: false };
    }
  }
};
