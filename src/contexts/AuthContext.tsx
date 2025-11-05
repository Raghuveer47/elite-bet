import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthSession, LoginCredentials, RegisterData } from '../types/auth';
import { SessionManager } from '../utils/sessionStorage';
import { DataStorage } from '../utils/dataStorage';
import { syncManager } from '../utils/syncManager';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  updateBalance: (amount: number) => void;
  updateUser: (updates: Partial<User>) => void;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize session on app start
  useEffect(() => {
    const initializeSession = async () => {
      try {
        console.log('AuthContext: Initializing session...');
        const session = await SessionManager.getUserSession();
        if (session) {
          console.log('AuthContext: Valid session found for user:', session.user.id, 'Balance:', session.user.balance);
          setUser(session.user);
          setIsAuthenticated(true);
          
          // Sync user data with storage
          const storedData = DataStorage.loadData();
          const storedUser = storedData.users.find((u: any) => u.id === session.user.id);
          if (storedUser) {
            const updatedUser = {
              ...session.user,
              balance: storedUser.balance || session.user.balance,
              isVerified: storedUser.isVerified || session.user.isVerified
            };
            setUser(updatedUser);
            
            // Update session with latest data
            const updatedSession = { ...session, user: updatedUser };
            SessionManager.saveUserSession(updatedSession, localStorage.getItem('elitebet_user_session') !== null);
          }
          
          // Auto-refresh token if close to expiry
          const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
          if (session.expiresAt < oneHourFromNow) {
            await SessionManager.refreshUserToken();
          }
        } else {
          console.log('AuthContext: No valid session found');
        }
      } catch (error) {
        console.error('AuthContext: Failed to initialize session:', error);
        SessionManager.clearUserSession();
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, []);

  // Listen for storage events and sync updates
  useEffect(() => {
    const handleStorageChange = async (e: StorageEvent) => {
      if (!user) return;
      
      console.log('AuthContext: Storage event received:', e.key);
      
      // Handle KYC verification updates
      if (e.key === 'elitebet_user_verified' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.userId === user.id) {
            console.log('AuthContext: User verification completed:', data);
            const updatedUser = { 
              ...user, 
              isVerified: true
            };
            setUser(updatedUser);
            
            // Update session
            const session = await SessionManager.getUserSession();
            if (session) {
              session.user = updatedUser;
              SessionManager.saveUserSession(session, localStorage.getItem('elitebet_user_session') !== null);
            }
            
            // Update in storage
            const storedData = DataStorage.loadData();
            const existingUser = storedData.users.find((u: any) => u.id === user.id);
            if (existingUser) {
              const updatedStoredUser = {
                ...existingUser,
                isVerified: true,
                verifiedAt: new Date()
              };
              DataStorage.addOrUpdateUser(updatedStoredUser);
            }
            
            toast.success('🎉 Account verification completed! You now have full access.');
          }
        } catch (error) {
          console.error('AuthContext: Failed to parse verification update:', error);
        }
      }

      // Handle balance updates from admin
      if (e.key === 'elitebet_balance_update' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.userId === user.id) {
            console.log('AuthContext: Processing balance update:', data);
            const newBalance = data.newBalance !== undefined ? data.newBalance : user.balance + data.amount;
            const updatedUser = { ...user, balance: newBalance };
            setUser(updatedUser);
            await SessionManager.updateUserBalance(newBalance);
            
            if (data.reason && !data.reason.includes('Bet') && !data.reason.includes('Win')) {
              toast.success(`Balance updated: ${data.reason}`);
            }
          }
        } catch (error) {
          console.error('AuthContext: Failed to parse balance update:', error);
        }
      }

      // Handle user verification updates
      if (e.key === 'elitebet_user_verified' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.userId === user.id) {
            console.log('AuthContext: User verification completed:', data);
            const updatedUser = { 
              ...user, 
              isVerified: true
            };
            setUser(updatedUser);
            
            // Update session
            const session = await SessionManager.getUserSession();
            if (session) {
              session.user = updatedUser;
              SessionManager.saveUserSession(session, localStorage.getItem('elitebet_user_session') !== null);
            }
            
            toast.success('🎉 Account verification completed! You now have full access.');
          }
        } catch (error) {
          console.error('AuthContext: Failed to parse verification update:', error);
        }
      }

      // Handle KYC rejection notifications
      if (e.key === 'elitebet_kyc_rejected' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.userId === user.id) {
            toast.error(`KYC verification rejected: ${data.reason}`);
          }
        } catch (error) {
          console.error('AuthContext: Failed to parse KYC rejection:', error);
        }
      }

      // Handle general data sync events
      if (e.key === 'elitebet_data_sync' && e.newValue) {
        try {
          const update = JSON.parse(e.newValue);
          if (update.type === 'user_updated' && update.data.id === user.id) {
            console.log('AuthContext: User data updated from admin:', update.data);
            const updatedUser = {
              ...user,
              balance: update.data.balance !== undefined ? update.data.balance : user.balance,
              isVerified: update.data.isVerified !== undefined ? update.data.isVerified : user.isVerified,
              firstName: update.data.firstName || user.firstName,
              lastName: update.data.lastName || user.lastName,
              email: update.data.email || user.email
            };
            setUser(updatedUser);
            
            // Update session
            const session = await SessionManager.getUserSession();
            if (session) {
              session.user = updatedUser;
              SessionManager.saveUserSession(session, localStorage.getItem('elitebet_user_session') !== null);
            }
          }
        } catch (error) {
          console.error('AuthContext: Failed to parse data sync event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  // Auto-refresh session periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      const session = await SessionManager.getUserSession();
      if (session) {
        const thirtyMinutesFromNow = new Date(Date.now() + 30 * 60 * 1000);
        if (session.expiresAt < thirtyMinutesFromNow) {
          const refreshed = await SessionManager.refreshUserToken();
          if (!refreshed) {
            logout();
            toast.error('Session expired. Please login again.');
          }
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    setIsLoading(true);
    
    try {
      console.log('AuthContext: Attempting login for:', email);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Load existing data
      const storedData = DataStorage.loadData();
      let existingUser = storedData.users.find((u: any) => u.email === email);
      
      let mockUser: User;
      
      if (existingUser) {
        // User exists, use stored data but START WITH 0
        console.log('AuthContext: Existing user found:', existingUser.id);
        mockUser = {
          id: existingUser.id,
          email: existingUser.email,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          balance: 0, // Start with 0 - will fetch from backend
          currency: 'INR',
          isVerified: existingUser.isVerified || false,
          createdAt: new Date(existingUser.registrationDate || existingUser.createdAt),
          lastLogin: new Date()
        };
      } else {
        // Demo login - create demo user
        console.log('AuthContext: Creating demo user for login:', email);
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        mockUser = {
          id: userId,
          email,
          firstName: email === 'demo@elitebet.com' ? 'Demo' : email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
          lastName: 'User',
          balance: email === 'demo@elitebet.com' ? 1000 : 0, // Demo user gets $1000
          currency: 'INR',
          isVerified: email === 'demo@elitebet.com', // Demo user is pre-verified
          createdAt: new Date(),
          lastLogin: new Date()
        };
        
        // Store new user in admin context
        const adminUser = {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          balance: mockUser.balance,
          status: 'active' as const,
          isVerified: mockUser.isVerified,
          registrationDate: mockUser.createdAt,
          lastLogin: mockUser.lastLogin,
          totalDeposited: 0,
          totalWithdrawn: 0,
          totalWagered: 0,
          activeBets: 0,
          country: 'United States',
          riskLevel: 'low' as const
        };
        
        DataStorage.addOrUpdateUser(adminUser);
        
        // Sync to admin context
        syncManager.addSyncEvent('user_registration', userId, adminUser, 'user');
      }

      // Try to fetch real balance from MongoDB backend FIRST
      console.log('AuthContext: Fetching balance from MongoDB backend for:', mockUser.id);
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const balanceResponse = await fetch(`${backendUrl}/api/betting/balance/${mockUser.id}`);
        
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          if (balanceData.success && balanceData.balance !== undefined) {
            console.log('✅ AuthContext: Got REAL balance from backend:', balanceData.balance);
            mockUser.balance = balanceData.balance;
            
            // Update localStorage with the real balance
            if (existingUser) {
              const updatedStoredUser = {
                ...existingUser,
                balance: balanceData.balance,
                lastLogin: new Date(),
                updatedAt: new Date()
              };
              DataStorage.addOrUpdateUser(updatedStoredUser);
              console.log('AuthContext: Updated localStorage with balance:', balanceData.balance);
            }
          }
        } else {
          console.log('AuthContext: Backend returned status:', balanceResponse.status);
        }
      } catch (backendError) {
        console.log('AuthContext: Could not fetch balance from backend:', backendError);
      }

      // Create session with appropriate expiry
      const expiresAt = new Date(Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000);
      const session: AuthSession = {
        user: mockUser,
        token: `user_token_${Date.now()}`,
        expiresAt,
        refreshToken: `refresh_${Date.now()}`
      };

      SessionManager.saveUserSession(session, rememberMe);
      setUser(mockUser);
      setIsAuthenticated(true);
      
      console.log('✅ AuthContext: Login successful for user:', mockUser.id, 'Final Balance:', mockUser.balance);
      toast.success(`Welcome back, ${mockUser.firstName}!`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      console.error('AuthContext: Login failed:', errorMessage);
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    
    try {
      console.log('AuthContext: Attempting registration for:', data.email);
      
      // Check if user already exists
      const storedData = DataStorage.loadData();
      const existingUser = storedData.users.find((u: any) => u.email === data.email);
      
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const mockUser: User = {
        id: userId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        balance: 0, // No automatic bonus - admin can add referral bonus
        currency: 'USD',
        isVerified: false,
        createdAt: new Date(),
        lastLogin: new Date()
      };

      // Create session (default to session storage for new registrations)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const session: AuthSession = {
        user: mockUser,
        token: `user_token_${Date.now()}`,
        expiresAt,
        refreshToken: `refresh_${Date.now()}`
      };

      SessionManager.saveUserSession(session, false);
      setUser(mockUser);
      setIsAuthenticated(true);
      
      // Store user data for admin context
      const adminUser = {
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        balance: mockUser.balance,
        status: 'active' as const,
        isVerified: mockUser.isVerified,
        registrationDate: mockUser.createdAt,
        lastLogin: mockUser.lastLogin,
        totalDeposited: 0,
        totalWithdrawn: 0,
        totalWagered: 0,
        activeBets: 0,
        country: data.country,
        riskLevel: 'low' as const
      };
      
      DataStorage.addOrUpdateUser(adminUser);
      
      // Sync to admin context
      syncManager.addSyncEvent('user_registration', userId, adminUser, 'user');
      
      console.log('AuthContext: Registration successful for user:', mockUser.id);
      toast.success(`Welcome to Elite Bet, ${mockUser.firstName}!`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      console.error('AuthContext: Registration failed:', errorMessage);
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('AuthContext: Logging out user:', user?.id);
    SessionManager.clearUserSession();
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  const updateBalance = async (newBalance: number) => {
    if (user) {
      console.log('AuthContext: updateBalance called with newBalance:', newBalance);
      const updatedUser = { ...user, balance: newBalance };
      setUser(updatedUser);
      SessionManager.updateUserBalance(newBalance);
      
      console.log('AuthContext: Balance updated in state:', {
        userId: user.id,
        oldBalance: user.balance,
        newBalance
      });
      
      // Update user in storage
      const storedData = DataStorage.loadData();
      const existingUser = storedData.users.find((u: any) => u.id === user.id);
      if (existingUser) {
        const updatedStoredUser = {
          ...existingUser,
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          balance: newBalance,
          lastLogin: new Date(),
          updatedAt: new Date()
        };
        DataStorage.addOrUpdateUser(updatedStoredUser);
        
        // Sync balance update
        syncManager.addSyncEvent('balance_update', user.id, {
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          balance: newBalance,
          amount: newBalance - user.balance,
          previousBalance: user.balance
        }, 'user');
      }
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      
      // Update session
      const session = await SessionManager.getUserSession();
      if (session) {
        session.user = updatedUser;
        SessionManager.saveUserSession(session, localStorage.getItem('elitebet_user_session') !== null);
      }
      
      // Update in storage
      const storedData = DataStorage.loadData();
      const existingUser = storedData.users.find((u: any) => u.id === user.id);
      if (existingUser) {
        const updatedStoredUser = {
          ...existingUser,
          ...updates,
          firstName: updates.firstName || existingUser.firstName,
          lastName: updates.lastName || existingUser.lastName,
          email: updates.email || existingUser.email,
          isVerified: updates.isVerified !== undefined ? updates.isVerified : existingUser.isVerified
        };
        DataStorage.addOrUpdateUser(updatedStoredUser);
        
        // Sync user update
        syncManager.addSyncEvent('user_updated', user.id, updatedStoredUser, 'user');
      }
      
      console.log('AuthContext: User updated:', updates);
    }
  };

  const refreshSession = async (): Promise<boolean> => {
    try {
      const refreshed = await SessionManager.refreshUserToken();
      if (refreshed) {
        const session = await SessionManager.getUserSession();
        if (session) {
          setUser(session.user);
          setIsAuthenticated(true);
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