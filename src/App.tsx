import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/SupabaseAuthContext';
import { AdminProvider } from './contexts/SupabaseAdminContext';
import { WalletProvider } from './contexts/SupabaseWalletContext';
import { SocketProvider } from './contexts/SocketContext';
import { SessionMonitorWrapper } from './components/SessionMonitorWrapper';
import { UserStatusMonitor } from './components/UserStatusMonitor';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/layout/Header';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminProtectedRoute } from './components/auth/AdminProtectedRoute';
import { EmailVerificationHandler } from './components/auth/EmailVerificationHandler';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { ResetPasswordLinkPage } from './pages/auth/ResetPasswordLinkPage';
import { DashboardPage } from './pages/DashboardPage';
import SportsPage from './pages/SportsPage';
import { CasinoPage } from './pages/CasinoPage';
import { WalletPage } from './pages/WalletPage';
import { PromotionsPage } from './pages/PromotionsPage';
import { SupportPage } from './pages/SupportPage';
import { AccountPage } from './pages/AccountPage';
import { KYCVerificationPage } from './pages/KYCVerificationPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { FinancialManagement } from './pages/admin/FinancialManagement';
import { GameManagement } from './pages/admin/GameManagement';
import { RiskManagement } from './pages/admin/RiskManagement';
import { KYCManagement } from './pages/admin/KYCManagement';
import { PromotionManagement } from './pages/admin/PromotionManagement';
import { SupportManagement } from './pages/admin/SupportManagement';
import { LiveChatManagement } from './pages/admin/LiveChatManagement';
import { AdminLayout } from './pages/admin/AdminLayout';
import { WithdrawalsManagement } from './pages/admin/WithdrawalsManagement';
import { PaymentSettings } from './pages/admin/PaymentSettings';
import { NotFoundPage } from './pages/NotFoundPage';
// import { ActivityFeed } from './components/notifications/ActivityFeed';
// import { FloatingWinners } from './components/notifications/FloatingWinners';
// import { JackpotTicker } from './components/notifications/JackpotTicker';

// import { useRealisticNotifications } from './hooks/useRealisticNotifications';
function AppContent() {
  // useRealisticNotifications(); // Disabled - removed right-side notifications

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={
        <ProtectedRoute requireAuth={false}>
          <div className="min-h-screen bg-slate-900">
            <Header />
            <LandingPage />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/login" element={
        <ProtectedRoute requireAuth={false}>
          <div className="min-h-screen bg-slate-900">
            <Header />
            <LoginPage />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/register" element={
        <ProtectedRoute requireAuth={false}>
          <div className="min-h-screen bg-slate-900">
            <Header />
            <RegisterPage />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/forgot-password" element={
        <ProtectedRoute requireAuth={false}>
          <ForgotPasswordPage />
        </ProtectedRoute>
      } />
      <Route path="/reset-password" element={
        <ProtectedRoute requireAuth={false}>
          <ResetPasswordPage />
        </ProtectedRoute>
      } />
      <Route path="/reset-password-link" element={
        <ProtectedRoute requireAuth={false}>
          <ResetPasswordLinkPage />
        </ProtectedRoute>
      } />
      
      {/* Email Verification Route */}
      <Route path="/auth/callback" element={<EmailVerificationHandler />} />
      
      {/* Protected User Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <div className="min-h-screen bg-slate-900">
            <Header />
            <DashboardPage />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/sports" element={
        <ProtectedRoute>
          <div className="min-h-screen bg-slate-900">
            <Header />
            <SportsPage />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/casino" element={
        <ProtectedRoute>
          <div className="min-h-screen bg-slate-900">
            <Header />
            <CasinoPage />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/wallet" element={
        <ProtectedRoute>
          <div className="min-h-screen bg-slate-900">
            <Header />
            <WalletPage />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/account" element={
        <ProtectedRoute>
          <div className="min-h-screen bg-slate-900">
            <Header />
            <AccountPage />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/kyc-verification" element={
        <ProtectedRoute>
          <div className="min-h-screen bg-slate-900">
            <Header />
            <KYCVerificationPage />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/promotions" element={
        <ProtectedRoute>
          <div className="min-h-screen bg-slate-900">
            <Header />
            <PromotionsPage />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/support" element={
        <ProtectedRoute>
          <div className="min-h-screen bg-slate-900">
            <Header />
            <SupportPage />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/live" element={
        <ProtectedRoute>
          <div className="min-h-screen bg-slate-900">
            <Header />
            <SportsPage />
          </div>
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin/login" element={
        <AdminProtectedRoute requireAdmin={false}>
          <AdminLoginPage />
        </AdminProtectedRoute>
      } />
      <Route path="/admin/dashboard" element={
        <AdminProtectedRoute>
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        </AdminProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <AdminProtectedRoute>
          <AdminLayout>
            <UserManagement />
          </AdminLayout>
        </AdminProtectedRoute>
      } />
      <Route path="/admin/financial" element={
        <AdminProtectedRoute>
          <AdminLayout>
            <FinancialManagement />
          </AdminLayout>
        </AdminProtectedRoute>
      } />
      <Route path="/admin/withdrawals" element={
        <AdminProtectedRoute>
          <AdminLayout>
            <WithdrawalsManagement />
          </AdminLayout>
        </AdminProtectedRoute>
      } />
      <Route path="/admin/games" element={
        <AdminProtectedRoute>
          <AdminLayout>
            <GameManagement />
          </AdminLayout>
        </AdminProtectedRoute>
      } />
      <Route path="/admin/risk" element={
        <AdminProtectedRoute>
          <AdminLayout>
            <RiskManagement />
          </AdminLayout>
        </AdminProtectedRoute>
      } />
      <Route path="/admin/kyc" element={
        <AdminProtectedRoute>
          <AdminLayout>
            <KYCManagement />
          </AdminLayout>
        </AdminProtectedRoute>
      } />
      <Route path="/admin/promotions" element={
        <AdminProtectedRoute>
          <AdminLayout>
            <PromotionManagement />
          </AdminLayout>
        </AdminProtectedRoute>
      } />
      <Route path="/admin/support" element={
        <AdminProtectedRoute>
          <AdminLayout>
            <SupportManagement />
          </AdminLayout>
        </AdminProtectedRoute>
      } />
      <Route path="/admin/live-chat" element={
        <AdminProtectedRoute>
          <AdminLayout>
            <LiveChatManagement />
          </AdminLayout>
        </AdminProtectedRoute>
      } />
      <Route path="/admin/payment-settings" element={
        <AdminProtectedRoute>
          <AdminLayout>
            <PaymentSettings />
          </AdminLayout>
        </AdminProtectedRoute>
      } />
      
      {/* Catch all route */}
      <Route path="*" element={<NotFoundPage />} />
      </Routes>
  );
}
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SessionMonitorWrapper>
          <UserStatusMonitor />
          <AdminProvider>
            <WalletProvider>
              <SocketProvider>
              <Router>
                <ErrorBoundary>
                  <AppContent />
                </ErrorBoundary>
                {/* Live notifications disabled */}
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#1e293b',
                      color: '#fff',
                      border: '1px solid #334155'
                    }
                  }}
                />
              </Router>
              </SocketProvider>
            </WalletProvider>
          </AdminProvider>
        </SessionMonitorWrapper>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;