import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../../contexts/SupabaseAdminContext';
import { AdminSidebar } from '../../components/layout/AdminSidebar';
import { AdminTopBar } from '../../components/layout/AdminTopBar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { SessionManager } from '../../utils/sessionStorage';
import toast from 'react-hot-toast';

interface AdminLayoutProps {
  children: React.ReactNode;
}

function AdminSessionMonitor() {
  const { adminUser, adminLogout } = useAdmin();

  useEffect(() => {
    const checkAdminSession = () => {
      if (adminUser && !SessionManager.isAdminSessionValid()) {
        adminLogout();
        toast.error('Admin session has expired. Please login again.');
      }
    };

    const interval = setInterval(checkAdminSession, 60 * 1000);
    checkAdminSession();

    return () => clearInterval(interval);
  }, [adminUser, adminLogout]);

  return null;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { adminUser, isLoading } = useAdmin();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Give time for session initialization
    const timer = setTimeout(() => {
      setInitializing(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading || initializing) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-slate-400 mt-4">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <AdminSessionMonitor />
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <AdminTopBar />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}