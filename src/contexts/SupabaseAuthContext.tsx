import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthSession, RegisterData } from '../types/auth';
import { SupabaseAuthService } from '../services/supabaseAuthService';
import { BackendAuthService } from '../services/backendAuthService';
import { supabase } from '../lib/supabase';
import { SessionHelper } from '../utils/sessionHelper';
import toast from 'react-hot-toast';

// Get Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  updateBalance: (amount: number) => void;
  updateUser: (updates: Partial<User>) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const useBackend = (import.meta as any).env?.VITE_USE_BACKEND_AUTH === 'true';

  // Initialize session on app start
  useEffect(() => {
    let isMounted = true;
    let loadingTimeout: NodeJS.Timeout;
    
    // Set a maximum loading time to prevent infinite loading
    loadingTimeout = setTimeout(() => {
      console.log('AuthContext: Loading timeout reached, stopping loading state');
      if (isMounted) {
        setIsLoading(false);
      }
    }, 5000); // 5 seconds max loading time

    const initializeSession = async () => {
      try {
        // Backend-auth first: restore from token if enabled
        if ((import.meta as any).env?.VITE_USE_BACKEND_AUTH === 'true') {
          console.log('AuthContext: Initializing backend session...');
          const token = localStorage.getItem('elitebet_backend_token');
          if (token) {
            try {
              const r = await BackendAuthService.me(token);
              const convertedUser: User = {
                id: r.user.userId,
                email: r.user.email,
                firstName: r.user.firstName || r.user.email.split('@')[0] || 'User',
                lastName: r.user.lastName || '',
                balance: r.user.balance,
                currency: 'INR',
                isVerified: true,
                createdAt: new Date(),
                lastLogin: new Date()
              };
              setUser(convertedUser);
              setIsAuthenticated(true);
              setIsLoading(false);
              console.log('AuthContext: Backend session restored for', convertedUser.email);
              return;
            } catch (e) {
              console.log('AuthContext: No valid backend session');
            }
          }
          setIsLoading(false);
          return;
        }

        console.log('AuthContext: Initializing Supabase session...');
        
        // Check if Supabase is properly configured
        if (!supabaseUrl || !supabaseAnonKey) {
          console.debug('AuthContext: Supabase not configured');
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }
        
        // Check if there's a valid session in localStorage first
        const sessionInfo = SessionHelper.getSessionInfo();
        const demoSessionData = localStorage.getItem('elitebet_user_session');
        
        // Check for demo session
        if (demoSessionData) {
          try {
            const demoSession = JSON.parse(demoSessionData);
            if (demoSession.user && demoSession.user.email === 'demo@spinzos.com') {
              console.log('AuthContext: Demo session found, restoring demo user');
              
              // Load saved balance from localStorage
              const savedBalance = localStorage.getItem('demo_user_balance');
              const balanceToUse = savedBalance ? parseFloat(savedBalance) : (demoSession.user.balance || 1000);
              
              console.log('AuthContext: Restoring demo user with balance:', balanceToUse);
              
              const demoUser: User = {
                id: demoSession.user.id,
                email: demoSession.user.email,
                firstName: demoSession.user.firstName,
                lastName: demoSession.user.lastName,
                balance: balanceToUse,
                currency: demoSession.user.currency || 'USD',
                isVerified: demoSession.user.isVerified || true,
                createdAt: new Date(demoSession.user.createdAt),
                lastLogin: new Date(demoSession.user.lastLogin)
              };
              
              setUser(demoUser);
              setIsAuthenticated(true);
              setIsLoading(false);
              console.log('AuthContext: Demo user restored from session with balance:', balanceToUse);
              return;
            }
          } catch (error) {
            console.error('AuthContext: Error parsing demo session:', error);
          }
        }
        
        if (!sessionInfo.hasSession || sessionInfo.isExpired) {
          console.log('AuthContext: No valid session found, clearing any stale data');
          SessionHelper.clearSession();
          setIsLoading(false);
          return;
        }
        
        // Additional check: if localStorage is empty, don't try to restore session
        const localStorageKeys = Object.keys(localStorage);
        const hasAuthData = localStorageKeys.some(key => 
          key.startsWith('sb-') || 
          key.includes('supabase') || 
          key.includes('auth') ||
          key.includes('session') ||
          key.includes('token')
        );
        
        if (!hasAuthData) {
          console.log('AuthContext: No auth data in localStorage, skipping session restoration');
          setIsLoading(false);
          return;
        }
        
        // Always try to get session from Supabase (it handles persistence internally)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthContext: Session error:', error);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          console.log('AuthContext: Valid session found for user:', session.user.email);
          
              // Create user from session data immediately (no database dependency)
              const sessionUser: User = {
                id: session.user.id,
                email: session.user.email || '',
                firstName: session.user.user_metadata?.first_name || 'User',
                lastName: session.user.user_metadata?.last_name || 'Name',
                balance: 0, // No automatic bonus - admin can add referral bonus
                currency: 'INR',
                isVerified: !!session.user.email_confirmed_at,
                createdAt: new Date(session.user.created_at),
                lastLogin: new Date()
              };
          
          setUser(sessionUser);
          setIsAuthenticated(true);
          setIsLoading(false);
          console.log('AuthContext: Session user loaded:', sessionUser.email);
          
          // Try to get user profile from database in background (non-blocking)
          try {
            const userResult = await SupabaseAuthService.getCurrentUser();
            if (userResult) {
              const convertedUser: User = {
                id: userResult.id,
                email: userResult.email,
                firstName: userResult.first_name,
                lastName: userResult.last_name,
                balance: userResult.balance,
                currency: userResult.currency,
                isVerified: userResult.is_verified,
                createdAt: new Date(userResult.created_at),
                lastLogin: new Date(userResult.last_login)
              };
              
              setUser(convertedUser);
              console.log('AuthContext: Database user profile loaded:', convertedUser.email);
            }
          } catch (dbError) {
            console.log('AuthContext: Database lookup failed, using session data:', dbError);
            // Keep using session data, no need to change anything
          }
        } else {
          console.log('AuthContext: No valid session found, clearing any stale data');
          // Clear any stale session data
          SessionHelper.clearSession();
          setIsLoading(false);
        }
      } catch (error) {
        console.error('AuthContext: Failed to initialize session:', error);
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure Supabase is ready
    setTimeout(initializeSession, 100);

    // Listen for auth changes (skip when backend auth is enabled)
    const authListener = !useBackend ? supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        console.log('AuthContext: Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('AuthContext: Processing SIGNED_IN event for:', session.user.email);
          console.log('AuthContext: Current state - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);
          
          // Prevent duplicate processing
          if (isAuthenticated && user?.email === session.user.email) {
            console.log('AuthContext: User already authenticated, skipping duplicate processing');
            return;
          }
          
              // Immediately create user from session data (no database dependency)
              const sessionUser: User = {
                id: session.user.id,
                email: session.user.email || '',
                firstName: session.user.user_metadata?.first_name || 'User',
                lastName: session.user.user_metadata?.last_name || 'Name',
                balance: 0, // No automatic bonus - admin can add referral bonus
                currency: 'INR',
                isVerified: !!session.user.email_confirmed_at,
                createdAt: new Date(session.user.created_at),
                lastLogin: new Date()
              };
          
          // Set user immediately
          setUser(sessionUser);
          setIsAuthenticated(true);
          setIsLoading(false);
          console.log('AuthContext: User set immediately from session data');
          
          // Try to get user profile from database in background (non-blocking)
          try {
            const userResult = await SupabaseAuthService.getCurrentUser();
            if (userResult) {
              const convertedUser: User = {
                id: userResult.id,
                email: userResult.email,
                firstName: userResult.first_name,
                lastName: userResult.last_name,
                balance: userResult.balance,
                currency: userResult.currency,
                isVerified: userResult.is_verified,
                createdAt: new Date(userResult.created_at),
                lastLogin: new Date(userResult.last_login)
              };
              
              setUser(convertedUser);
              console.log('AuthContext: User updated from database');
            }
          } catch (dbError) {
            console.log('AuthContext: Database lookup failed, keeping session data:', dbError);
            // Keep using session data, no need to change anything
          }
          
          // Show success message
          toast.success('Welcome to Elite Bet!');
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
          toast.success('Logged out successfully');
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('AuthContext: Token refreshed for user:', session.user.email);
        } else if (event === 'PASSWORD_RECOVERY') {
          console.log('AuthContext: Password recovery initiated');
        }
      }
    ) : { data: { subscription: { unsubscribe: () => {} } } } as any;

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
      authListener.data.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    // Prevent duplicate login attempts
    if (isLoading) {
      console.log('AuthContext: Login already in progress, skipping duplicate attempt');
      return;
    }
    
    if (isAuthenticated && user?.email === email) {
      console.log('AuthContext: User already authenticated with this email, skipping login');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('AuthContext: Attempting login for:', email);
      
      // Handle demo account
      if (email === 'demo@spinzos.com' && password === 'Demo123!') {
        console.log('AuthContext: Demo account login detected');
        
        // Load balance from localStorage if it exists
        const savedBalance = localStorage.getItem('demo_user_balance');
        const savedBalanceValue = savedBalance ? parseFloat(savedBalance) : 1000;
        
        console.log('AuthContext: Loading demo balance from localStorage:', savedBalanceValue);
        
        const demoUser: User = {
          id: 'demo_user_123',
          email: 'demo@spinzos.com',
          firstName: 'Demo',
          lastName: 'User',
          balance: savedBalanceValue, // Use saved balance or default to $1000
          currency: 'USD',
          isVerified: true,
          createdAt: new Date(),
          lastLogin: new Date()
        };
        
        setUser(demoUser);
        setIsAuthenticated(true);
        
        // Create a session object for compatibility
        const session: AuthSession = {
          user: demoUser,
          token: 'demo_token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          refreshToken: 'demo_refresh'
        };
        
        // Store session in localStorage for compatibility
        localStorage.setItem('elitebet_user_session', JSON.stringify({
          ...session,
          expiresAt: session.expiresAt.toISOString(),
          user: {
            ...session.user,
            createdAt: session.user.createdAt.toISOString(),
            lastLogin: session.user.lastLogin.toISOString()
          }
        }));
        
        console.log('AuthContext: Demo user logged in successfully with balance:', savedBalanceValue);
        return;
      }
      
      // Prefer backend auth when flag enabled
      if ((import.meta as any).env?.VITE_USE_BACKEND_AUTH === 'true') {
          const r = await BackendAuthService.login(email, password);
          // Immediately call /me to pull extended fields (country/referral)
          let extended = r;
          try {
            const token = r.token as any;
            const me = await BackendAuthService.me(token);
            (extended as any).user = { ...(r.user as any), ...(me.user as any) };
          } catch {}
          const convertedUser: User = {
            id: extended.user.userId,
            email: extended.user.email,
            firstName: extended.user.firstName || extended.user.email.split('@')[0] || 'User',
            lastName: extended.user.lastName || '',
            balance: extended.user.balance,
            currency: 'INR',
            isVerified: true,
            createdAt: new Date(),
            lastLogin: new Date(),
            country: (extended as any)?.user?.country || 'India',
            referralCode: (extended as any)?.user?.referralCode || null
          };
        setUser(convertedUser);
        setIsAuthenticated(true);
        localStorage.setItem('elitebet_backend_token', r.token);
        localStorage.setItem('elitebet_user_session', JSON.stringify({ user: convertedUser, token: r.token, expiresAt: new Date(Date.now()+7*864e5).toISOString() }));
        // Sync user email/name into Mongo so Admin shows real email
        try {
          const base = ((import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:3001/api/betting');
          await fetch(`${base}/sync-user`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: convertedUser.id, email: convertedUser.email, firstName: convertedUser.firstName, lastName: convertedUser.lastName })
          });
        } catch {}
        toast.success('Login successful!');
        return;
      }

      const result = await SupabaseAuthService.signIn(email, password);
      
      if (result.success && result.user) {
        // Convert Supabase user to our User type
        const convertedUser: User = {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.first_name,
          lastName: result.user.last_name,
          balance: result.user.balance,
          currency: result.user.currency,
          isVerified: result.user.is_verified,
          createdAt: new Date(result.user.created_at),
          lastLogin: new Date(result.user.last_login)
        };
        
        setUser(convertedUser);
        setIsAuthenticated(true);
        
        // Create a session object for compatibility
        const session: AuthSession = {
          user: convertedUser,
          token: result.session?.access_token || 'supabase_token',
          expiresAt: new Date(result.session?.expires_at || Date.now() + 24 * 60 * 60 * 1000),
          refreshToken: result.session?.refresh_token || 'supabase_refresh'
        };
        
        // Store session in localStorage for compatibility
        localStorage.setItem('elitebet_user_session', JSON.stringify({
          ...session,
          expiresAt: session.expiresAt.toISOString(),
          user: {
            ...session.user,
            createdAt: session.user.createdAt.toISOString(),
            lastLogin: session.user.lastLogin.toISOString()
          }
        }));
        
        toast.success('Login successful!');
        console.log('AuthContext: Login successful for:', email);
      } else {
        throw new Error(result.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('AuthContext: Login error:', error);
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    
    try {
      console.log('AuthContext: Attempting registration for:', data.email);
      
      if ((import.meta as any).env?.VITE_USE_BACKEND_AUTH === 'true') {
        // Pass country (default India) and optional referralCode from querystring if present
        const urlParams = new URLSearchParams(window.location.search);
        const referralCode = urlParams.get('ref') || undefined;
        const country = data.country || 'India';
        await BackendAuthService.register(data.email, data.password, data.firstName, data.lastName, country, referralCode);
        toast.success('Registration successful!');
        return;
      }

      const result = await SupabaseAuthService.signUp(
        data.email,
        data.password,
        data.firstName,
        data.lastName
      );
      
      if (result.success) {
        toast.success(result.message || 'Registration successful!');
        console.log('AuthContext: Registration successful for:', data.email);
        
        // Give automatic welcome bonus
        try {
          const bonusResult = await SupabaseAuthService.giveWelcomeBonus(result.user?.id || '');
          if (bonusResult.success) {
            toast.success('Welcome! You received a $100 welcome bonus!');
          } else {
            console.error('Failed to give welcome bonus:', bonusResult.message);
          }
        } catch (error) {
          console.error('Error giving welcome bonus:', error);
        }
      } else {
        throw new Error(result.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('AuthContext: Registration error:', error);
      toast.error(error.message || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('AuthContext: Logging out user');
      
      // Show logout message first
      toast.success('Logged out successfully');
      
      // Clear React state immediately to prevent further operations
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      
      // Clear ALL localStorage data (complete cleanup)
      localStorage.clear();
      console.log('AuthContext: Cleared all localStorage');
      
      // Clear sessionStorage
      sessionStorage.removeItem('elitebet_user_session');
      
      // Sign out from Supabase (this will handle session cleanup)
      const result = await SupabaseAuthService.signOut();
      if (!result.success) {
        console.warn('AuthContext: Supabase signOut failed, but continuing with local logout');
      }
      
      console.log('AuthContext: User logout completed');
      console.log('AuthContext: Logout successful, redirecting to login');
      
      // Small delay to show toast, then redirect
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
      
    } catch (error: any) {
      console.error('AuthContext: Logout error:', error);
      
      // Even if there's an error, clear all local state
      localStorage.clear();
      sessionStorage.removeItem('elitebet_user_session');
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      
      console.log('AuthContext: Forced logout due to error, redirecting to login');
      
      toast.success('Logged out successfully');
      
      // Small delay to show toast, then redirect
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    }
  };

  const updateBalance = async (newBalance: number) => {
    if (!user) return;
    
    try {
      const oldBalance = user.balance;
      console.log('AuthContext: Updating balance for user:', user.id, 'from:', oldBalance, 'to:', newBalance);
      
      // Handle demo account - no Supabase calls
      if (user.email === 'demo@spinzos.com') {
        console.log('AuthContext: Updating demo account balance to:', newBalance);
        
        // Save balance to localStorage for persistence across refreshes
        localStorage.setItem('demo_user_balance', newBalance.toString());
        console.log('AuthContext: Saved demo balance to localStorage:', newBalance);
        
        const updatedUser = {
          ...user,
          balance: newBalance
        };
        
        setUser(updatedUser);
        
        // Update session
        const sessionData = localStorage.getItem('elitebet_user_session');
        if (sessionData) {
          const session = JSON.parse(sessionData);
          session.user = {
            ...session.user,
            balance: newBalance
          };
          localStorage.setItem('elitebet_user_session', JSON.stringify(session));
        }
        
        console.log('AuthContext: Demo balance updated successfully to:', newBalance);
        return;
      }
      
      // For real users, update in Supabase but don't wait for it
      // We update locally immediately for better UX
      const updatedUser = {
        ...user,
        balance: newBalance
      };
      
      setUser(updatedUser);
      
      // Update session immediately
      const sessionData = localStorage.getItem('elitebet_user_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        session.user = {
          ...session.user,
          balance: newBalance
        };
        localStorage.setItem('elitebet_user_session', JSON.stringify(session));
      }
      
      console.log('AuthContext: Balance updated locally to:', newBalance);
      
      if (!useBackend) {
        // Try to update in Supabase in background (non-blocking)
        try {
          const change = newBalance - oldBalance;
          await SupabaseAuthService.updateUserBalance(user.id, change);
          console.log('AuthContext: Supabase balance update successful');
        } catch (error) {
          console.warn('AuthContext: Supabase update failed, but balance updated locally:', error);
        }
      }
    } catch (error: any) {
      console.error('AuthContext: Update balance error:', error);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      console.log('AuthContext: Updating user:', user.id, updates);
      if (useBackend) {
        const updatedUser: User = { ...user, ...updates } as User;
        setUser(updatedUser);
        const sessionData = localStorage.getItem('elitebet_user_session');
        if (sessionData) {
          const session = JSON.parse(sessionData);
          session.user = { ...session.user, ...updates };
          localStorage.setItem('elitebet_user_session', JSON.stringify(session));
        }
        toast.success('Profile updated');
        return;
      }

      // Convert our User type to Supabase format
      const supabaseUpdates: any = {};
      if (updates.firstName) supabaseUpdates.first_name = updates.firstName;
      if (updates.lastName) supabaseUpdates.last_name = updates.lastName;
      if (updates.email) supabaseUpdates.email = updates.email;
      if (updates.isVerified !== undefined) supabaseUpdates.is_verified = updates.isVerified;
      if (updates.balance !== undefined) supabaseUpdates.balance = updates.balance;
      if (updates.currency) supabaseUpdates.currency = updates.currency;
      
      const result = await SupabaseAuthService.updateUser(user.id, supabaseUpdates);
      
      if (result.success && result.user) {
        const updatedUser: User = {
          ...user,
          firstName: result.user.first_name,
          lastName: result.user.last_name,
          email: result.user.email,
          isVerified: result.user.is_verified,
          balance: result.user.balance,
          currency: result.user.currency,
          lastLogin: new Date(result.user.last_login)
        };
        
        setUser(updatedUser);
        
        // Update session
        const sessionData = localStorage.getItem('elitebet_user_session');
        if (sessionData) {
          const session = JSON.parse(sessionData);
          session.user = {
            ...session.user,
            firstName: result.user.first_name,
            lastName: result.user.last_name,
            email: result.user.email,
            isVerified: result.user.is_verified,
            balance: result.user.balance,
            currency: result.user.currency,
            lastLogin: result.user.last_login
          };
          localStorage.setItem('elitebet_user_session', JSON.stringify(session));
        }
        
        console.log('AuthContext: User updated successfully');
        toast.success('Profile updated successfully');
      } else {
        throw new Error(result.message || 'Failed to update user');
      }
    } catch (error: any) {
      console.error('AuthContext: Update user error:', error);
      toast.error('Failed to update profile');
    }
  };

  const refreshSession = async (): Promise<boolean> => {
    try {
      console.log('AuthContext: Refreshing session...');
      if (useBackend) {
        const token = localStorage.getItem('elitebet_backend_token');
        if (!token) return false;
        try {
          const r = await BackendAuthService.me(token);
          const convertedUser: User = {
            id: r.user.userId,
            email: r.user.email,
            firstName: r.user.firstName || r.user.email.split('@')[0] || 'User',
            lastName: r.user.lastName || '',
            balance: r.user.balance,
            currency: 'INR',
            isVerified: true,
            createdAt: new Date(),
            lastLogin: new Date()
          };
          setUser(convertedUser);
          setIsAuthenticated(true);
          return true;
        } catch {
          return false;
        }
      }
      
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('AuthContext: Session refresh error:', error);
        return false;
      }
      
      if (session?.user) {
        const userResult = await SupabaseAuthService.getCurrentUser();
        if (userResult) {
          const convertedUser: User = {
            id: userResult.id,
            email: userResult.email,
            firstName: userResult.first_name,
            lastName: userResult.last_name,
            balance: userResult.balance,
            currency: userResult.currency,
            isVerified: userResult.is_verified,
            createdAt: new Date(userResult.created_at),
            lastLogin: new Date(userResult.last_login)
          };
          
          setUser(convertedUser);
          setIsAuthenticated(true);
          console.log('AuthContext: Session refreshed successfully');
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('AuthContext: Failed to refresh session:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isAuthenticated,
      updateBalance,
      updateUser,
      login, 
      register, 
      logout,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
