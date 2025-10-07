import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function AdminProtectedRoute({ children, requireAdmin = true }: AdminProtectedRouteProps) {
  const { adminUser, isLoading } = useAdmin();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-slate-400 mt-4">Checking admin authentication...</p>
        </div>
      </div>
    );
  }

  if (requireAdmin && !adminUser) {
    // Redirect to admin login page
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (!requireAdmin && adminUser) {
    // Redirect authenticated admins away from login page
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
}