import { useState, useEffect } from 'react';
import { User as UserIcon, Shield, Settings, Bell, Lock, Eye, EyeOff, Camera, CheckCircle, AlertTriangle, Copy, Link as LinkIcon, Gem } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatCurrency } from '../lib/utils';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { KYCVerificationView } from '../components/kyc/KYCVerification';
import { ResponsibleGamingControls } from '../components/responsibleGaming/ResponsibleGamingControls';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { KYCService } from '../services/kycService';
import toast from 'react-hot-toast';

export function AccountPage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState<any>(null);
  
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    country: '',
    address: '',
    city: '',
    postalCode: '',
    dateOfBirth: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [preferences, setPreferences] = useState({
    currency: 'USD',
    oddsFormat: 'decimal',
    timezone: 'UTC',
    language: 'en',
    notifications: {
      email: true,
      sms: false,
      push: true,
      marketing: false,
      deposits: true,
      withdrawals: true,
      promotions: false,
      security: true
    },
    privacy: {
      showOnlineStatus: true,
      allowDataCollection: true,
      shareWithPartners: false
    }
  });

  // Load KYC status when component mounts
  useEffect(() => {
    if (user) {
      const verification = KYCService.getUserVerification(user.id);
      const documents = KYCService.getUserDocuments(user.id);
      setKycStatus({
        verification,
        documents,
        isVerified: user.isVerified
      });
    }
  }, [user]);

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'verification', name: 'Verification', icon: Shield },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'preferences', name: 'Preferences', icon: Settings },
    { id: 'responsible', name: 'Responsible Gaming', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell }
  ];

  const handleSaveProfile = async () => {
    if (!profileData.firstName.trim() || !profileData.lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update user in auth context
      updateUser({
        firstName: profileData.firstName.trim(),
        lastName: profileData.lastName.trim(),
        email: profileData.email
      });
      
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword) {
      toast.error('Current password is required');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      toast.error('Password must contain uppercase, lowercase, and number');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success('Preferences saved successfully');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* Profile Picture Section */}
            <div className="bg-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-slate-700">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 md:mb-6">Profile Picture</h3>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 md:gap-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl sm:text-2xl">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
                <div className="text-center sm:text-left">
                  <Button variant="outline" size="sm" disabled className="text-xs sm:text-sm">
                    <Camera className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Upload Photo
                  </Button>
                  <p className="text-[10px] sm:text-xs text-slate-400 mt-2">JPG, PNG up to 2MB</p>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-slate-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-4 md:mb-6">
                <h3 className="text-base sm:text-lg md:text-xl font-semibold">Personal Information</h3>
                <Button
                  variant="outline"
                  onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                  disabled={isLoading}
                  size="sm"
                  className="text-xs sm:text-sm w-full sm:w-auto"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : isEditing ? (
                    'Save Changes'
                  ) : (
                    'Edit Profile'
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <Input
                  label="First Name"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                  disabled={!isEditing || isLoading}
                  placeholder="Enter your first name"
                />
                <Input
                  label="Last Name"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                  disabled={!isEditing || isLoading}
                  placeholder="Enter your last name"
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!isEditing || isLoading}
                  placeholder="Enter your email"
                />
                <Input
                  label="Phone Number"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={!isEditing || isLoading}
                  placeholder="Enter your phone number"
                />
                <Input
                  label="Country"
                  value={profileData.country}
                  onChange={(e) => setProfileData(prev => ({ ...prev, country: e.target.value }))}
                  disabled={!isEditing || isLoading}
                  placeholder="Enter your country"
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  value={profileData.dateOfBirth}
                  onChange={(e) => setProfileData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  disabled={!isEditing || isLoading}
                />
              </div>

              {isEditing && (
                <div className="mt-3 sm:mt-4 md:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isLoading} className="w-full sm:w-auto text-xs sm:text-sm">
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProfile} disabled={isLoading} className="w-full sm:w-auto text-xs sm:text-sm">
                    Save Changes
                  </Button>
                </div>
              )}
            </div>

            {/* Account Status */}
            <div className="bg-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-slate-700">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4">Account Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs sm:text-sm">Account Status:</span>
                    <span className="text-green-400 font-medium text-xs sm:text-sm">Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs sm:text-sm">Verification Status:</span>
                    <div className="flex items-center space-x-2">
                      {user?.isVerified ? (
                        <>
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                          <span className="text-green-400 font-medium text-xs sm:text-sm">Verified</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                          <span className="text-yellow-400 font-medium text-xs sm:text-sm">Pending</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs sm:text-sm">Member Since:</span>
                    <span className="text-white font-medium text-xs sm:text-sm">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs sm:text-sm">Account Balance:</span>
                    <span className="text-green-400 font-bold text-sm sm:text-base md:text-lg">
                      ₹{(user?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs sm:text-sm">Currency:</span>
                    <span className="text-white font-medium text-xs sm:text-sm">{user?.currency || 'INR'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs sm:text-sm">Last Login:</span>
                    <span className="text-white font-medium text-xs sm:text-sm">
                      {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'verification':
        return <KYCVerificationView />;

      case 'security':
        return (
          <div className="space-y-6">
            {/* Password Change */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-xl font-semibold mb-6">Change Password</h3>
              
              <div className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                  disabled={isLoading}
                />
                
                <div className="relative">
                  <Input
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-8 text-slate-400 hover:text-white transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                  disabled={isLoading}
                />
                
                <Button onClick={handleChangePassword} disabled={isLoading}>
                  {isLoading ? 'Changing Password...' : 'Change Password'}
                </Button>
              </div>
            </div>

            {/* Two-Factor Authentication */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-xl font-semibold mb-6">Two-Factor Authentication</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                  <div>
                    <h4 className="font-medium">Authenticator App</h4>
                    <p className="text-sm text-slate-400">Use an authenticator app for enhanced security</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Enable 2FA
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                  <div>
                    <h4 className="font-medium">SMS Authentication</h4>
                    <p className="text-sm text-slate-400">Receive codes via SMS</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Setup SMS
                  </Button>
                </div>
              </div>
            </div>

            {/* Login History */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-xl font-semibold mb-6">Recent Login Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <div>
                    <p className="font-medium">Current Session</p>
                    <p className="text-sm text-slate-400">Chrome on Windows • 192.168.1.100</p>
                  </div>
                  <span className="text-green-400 text-sm">Active</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <div>
                    <p className="font-medium">Previous Login</p>
                    <p className="text-sm text-slate-400">Mobile App • 192.168.1.101</p>
                  </div>
                  <span className="text-slate-400 text-sm">2 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-xl font-semibold mb-6">Account Preferences</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Preferred Currency</label>
                  <select
                    value={preferences.currency}
                    onChange={(e) => setPreferences(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Odds Format</label>
                  <select
                    value={preferences.oddsFormat}
                    onChange={(e) => setPreferences(prev => ({ ...prev, oddsFormat: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="decimal">Decimal (1.85)</option>
                    <option value="fractional">Fractional (17/20)</option>
                    <option value="american">American (-118)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Timezone</label>
                  <select
                    value={preferences.timezone}
                    onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="EST">Eastern Time</option>
                    <option value="PST">Pacific Time</option>
                    <option value="GMT">Greenwich Mean Time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Language</label>
                  <select
                    value={preferences.language}
                    onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <Button onClick={handleSavePreferences} disabled={isLoading}>
                  Save Preferences
                </Button>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-xl font-semibold mb-6">Notification Preferences</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Account Notifications</h4>
                  <div className="space-y-3">
                    {Object.entries(preferences.notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                          <p className="text-sm text-slate-400">
                            {key === 'email' && 'Receive notifications via email'}
                            {key === 'sms' && 'Receive notifications via SMS'}
                            {key === 'push' && 'Browser push notifications'}
                            {key === 'marketing' && 'Promotional offers and updates'}
                            {key === 'deposits' && 'Deposit confirmations and updates'}
                            {key === 'withdrawals' && 'Withdrawal status notifications'}
                            {key === 'promotions' && 'New bonus and promotion alerts'}
                            {key === 'security' && 'Security alerts and login notifications'}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setPreferences(prev => ({
                              ...prev,
                              notifications: { ...prev.notifications, [key]: e.target.checked }
                            }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Privacy Settings</h4>
                  <div className="space-y-3">
                    {Object.entries(preferences.privacy).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                          <p className="text-sm text-slate-400">
                            {key === 'showOnlineStatus' && 'Show when you\'re online to other users'}
                            {key === 'allowDataCollection' && 'Allow anonymous usage data collection'}
                            {key === 'shareWithPartners' && 'Share data with trusted partners'}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setPreferences(prev => ({
                              ...prev,
                              privacy: { ...prev.privacy, [key]: e.target.checked }
                            }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleSavePreferences} disabled={isLoading}>
                  Save Notification Settings
                </Button>
              </div>
            </div>
          </div>
        );

      case 'responsible':
        return <ResponsibleGamingControls />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">Account Settings</h1>
          <p className="text-slate-400 text-xs sm:text-sm md:text-base">Manage your account, security, and preferences</p>
          
          {/* Account Overview */}
          <div className="mt-3 sm:mt-4 md:mt-6 bg-gradient-to-r from-blue-600/20 to-green-600/20 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-blue-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-base sm:text-lg md:text-xl">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-white truncate">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <p className="text-slate-300 text-xs sm:text-sm md:text-base truncate">{user?.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {user?.isVerified ? (
                      <>
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                        <span className="text-green-400 text-[10px] sm:text-xs md:text-sm font-medium">Verified Account</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                        <span className="text-yellow-400 text-[10px] sm:text-xs md:text-sm font-medium">Verification Pending</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-left sm:text-right bg-slate-800/50 sm:bg-transparent rounded-lg p-3 sm:p-0">
                <p className="text-slate-400 text-xs sm:text-sm">Account Balance</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-400">
                  {formatCurrency(user?.balance || 0, 'INR')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-wrap gap-1 sm:gap-2 bg-slate-800 rounded-lg p-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-md text-[10px] sm:text-xs md:text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline sm:inline">{tab.name}</span>
                  {tab.id === 'verification' && !user?.isVerified && (
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Referral Section */}
        <div className="mb-4 sm:mb-6 md:mb-8 bg-slate-800/60 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Gem className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
              <h2 className="text-base sm:text-lg md:text-xl font-bold">Referral Program</h2>
            </div>
            {user?.referralCode && (
              <span className="text-xs sm:text-sm text-slate-400">Share and earn ₹250 per friend</span>
            )}
          </div>
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <div>
              <p className="text-slate-400 text-xs sm:text-sm mb-2">Your Referral Code</p>
              <div className="flex items-center gap-2">
                <Input readOnly value={user?.referralCode || '—'} className="font-mono text-xs sm:text-sm" />
                <Button
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(user?.referralCode || '')}
                  disabled={!user?.referralCode}
                  size="sm"
                  className="text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> 
                  <span className="hidden sm:inline">Copy</span>
                </Button>
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-xs sm:text-sm mb-2">Referral Link</p>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={user?.referralCode ? `${window.location.origin}/register?ref=${user.referralCode}` : '—'}
                  className="font-mono text-xs sm:text-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => user?.referralCode && navigator.clipboard.writeText(`${window.location.origin}/register?ref=${user.referralCode}`)}
                  disabled={!user?.referralCode}
                  size="sm"
                  className="text-xs sm:text-sm px-2 sm:px-3"
                >
                  <LinkIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> 
                  <span className="hidden md:inline">Copy Link</span>
                </Button>
              </div>
            </div>
          </div>
          <p className="text-slate-400 text-[10px] sm:text-xs mt-2 sm:mt-3">Friends receive ₹100 on signup. You earn ₹250 when they join.</p>
        </div>

        {/* Tab Content */}
        <div>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}