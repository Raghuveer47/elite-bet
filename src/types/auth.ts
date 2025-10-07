export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  balance: number;
  currency: string;
  isVerified: boolean;
  createdAt: Date;
  lastLogin: Date;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: Date;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  country: string;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  permissions: string[];
  lastLogin: Date;
  isActive: boolean;
}

export interface AdminRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  level: number;
}

export interface AdminSession {
  adminUser: AdminUser;
  token: string;
  expiresAt: Date;
  refreshToken: string;
}