import { AuthSession, AdminSession } from '../types/auth';

const USER_SESSION_KEY = 'elitebet_user_session';
const ADMIN_SESSION_KEY = 'elitebet_admin_session';

export class SessionManager {
  // User Session Management
  static saveUserSession(session: AuthSession, rememberMe: boolean = false): void {
    try {
      const storage = rememberMe ? localStorage : sessionStorage;
      const sessionData = {
        ...session,
        expiresAt: session.expiresAt.toISOString(),
        user: {
          ...session.user,
          createdAt: session.user.createdAt.toISOString(),
          lastLogin: session.user.lastLogin.toISOString()
        }
      };
      storage.setItem(USER_SESSION_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Failed to save user session:', error);
    }
  }

  static getUserSession(): AuthSession | null {
    try {
      // Check both localStorage and sessionStorage
      let sessionData = localStorage.getItem(USER_SESSION_KEY) || sessionStorage.getItem(USER_SESSION_KEY);
      
      if (!sessionData) return null;

      const parsed = JSON.parse(sessionData);
      const session: AuthSession = {
        ...parsed,
        expiresAt: new Date(parsed.expiresAt),
        user: {
          ...parsed.user,
          createdAt: new Date(parsed.user.createdAt),
          lastLogin: new Date(parsed.user.lastLogin)
        }
      };

      // Check if session is expired
      if (new Date() > session.expiresAt) {
        this.clearUserSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Failed to get user session:', error);
      this.clearUserSession();
      return null;
    }
  }

  static clearUserSession(): void {
    try {
      localStorage.removeItem(USER_SESSION_KEY);
      sessionStorage.removeItem(USER_SESSION_KEY);
    } catch (error) {
      console.error('Failed to clear user session:', error);
    }
  }

  static updateUserBalance(newBalance: number): void {
    try {
      const session = this.getUserSession();
      if (session) {
        session.user.balance = newBalance;
        session.user.lastLogin = new Date(); // Update last activity
        // Determine which storage was used
        const isInLocalStorage = localStorage.getItem(USER_SESSION_KEY) !== null;
        this.saveUserSession(session, isInLocalStorage);
      }
    } catch (error) {
      console.error('Failed to update user balance in session:', error);
    }
  }

  // Admin Session Management
  static saveAdminSession(session: AdminSession): void {
    try {
      const sessionData = {
        ...session,
        expiresAt: session.expiresAt.toISOString(),
        adminUser: {
          ...session.adminUser,
          lastLogin: session.adminUser.lastLogin.toISOString()
        }
      };
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Failed to save admin session:', error);
    }
  }

  static getAdminSession(): AdminSession | null {
    try {
      const sessionData = sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (!sessionData) return null;

      const parsed = JSON.parse(sessionData);
      const session: AdminSession = {
        ...parsed,
        expiresAt: new Date(parsed.expiresAt),
        adminUser: {
          ...parsed.adminUser,
          lastLogin: new Date(parsed.adminUser.lastLogin)
        }
      };

      // Check if session is expired
      if (new Date() > session.expiresAt) {
        this.clearAdminSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Failed to get admin session:', error);
      this.clearAdminSession();
      return null;
    }
  }

  static clearAdminSession(): void {
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch (error) {
      console.error('Failed to clear admin session:', error);
    }
  }

  // Session Validation
  static isUserSessionValid(): boolean {
    const session = this.getUserSession();
    return session !== null && new Date() < session.expiresAt;
  }

  static isAdminSessionValid(): boolean {
    const session = this.getAdminSession();
    return session !== null && new Date() < session.expiresAt;
  }

  // Auto-refresh tokens (for future implementation)
  static async refreshUserToken(): Promise<boolean> {
    try {
      const session = this.getUserSession();
      if (!session || !session.refreshToken) return false;

      // In a real app, this would call the API to refresh the token
      // For now, we'll extend the current session
      const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const updatedSession: AuthSession = {
        ...session,
        expiresAt: newExpiresAt
      };

      const isInLocalStorage = localStorage.getItem(USER_SESSION_KEY) !== null;
      this.saveUserSession(updatedSession, isInLocalStorage);
      return true;
    } catch (error) {
      console.error('Failed to refresh user token:', error);
      return false;
    }
  }

  static async refreshAdminToken(): Promise<boolean> {
    try {
      const session = this.getAdminSession();
      if (!session || !session.refreshToken) return false;

      // In a real app, this would call the API to refresh the token
      // For now, we'll extend the current session
      const newExpiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours for admin
      const updatedSession: AdminSession = {
        ...session,
        expiresAt: newExpiresAt
      };

      this.saveAdminSession(updatedSession);
      return true;
    } catch (error) {
      console.error('Failed to refresh admin token:', error);
      return false;
    }
  }
}