import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle, Lock, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; otp?: string; password?: string }>({});
  const [otpExpiry, setOtpExpiry] = useState<number>(600); // 10 minutes
  const [displayedOTP, setDisplayedOTP] = useState<string>(''); // Store OTP to display on page
  const [emailSent, setEmailSent] = useState(false); // Track if email was sent
  const navigate = useNavigate();

  const validateEmail = () => {
    const newErrors: { email?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail()) return;
    
    setIsLoading(true);
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email.toLowerCase() })
      });

      const data = await response.json();

      // Check if user is new (not registered)
      if (data.isNewUser) {
        toast.error('This email is not registered!', {
          duration: 3000,
          icon: '⚠️'
        });
        
        setTimeout(() => {
          toast('Please create an account first', {
            duration: 4000,
            icon: '👉'
          });
          navigate('/register', { state: { email: email.toLowerCase() } });
        }, 1500);
        
        setIsLoading(false);
        return;
      }

      if (data.success) {
        setOtpSent(true);
        setOtpExpiry(data.expiresIn || 600);
        setEmailSent(data.emailSent || false);
        
        // Show OTP if returned in response (email not configured or failed)
        if (data.otp) {
          setDisplayedOTP(data.otp); // Store OTP to display on page
          console.log('🔐 OTP:', data.otp);
          
          // Show prominent toast with OTP
          toast.success(
            (t) => (
              <div className="text-center">
                <div className="font-bold mb-2">Your OTP Code</div>
                <div className="text-3xl font-mono tracking-widest bg-slate-700 px-4 py-2 rounded-lg">
                  {data.otp}
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  {data.emailSent ? 'Also sent to your email' : 'Email not configured - use this code'}
                </div>
              </div>
            ),
            {
              duration: 15000, // 15 seconds
              style: {
                background: '#1e293b',
                color: '#fff',
                minWidth: '350px',
                padding: '20px',
                border: '2px solid #10b981'
              }
            }
          );
        } else if (data.emailSent) {
          setDisplayedOTP(''); // No OTP to display, it was sent via email
          toast.success('OTP sent to your email!');
        } else {
          toast.error('Could not send OTP. Please contact support.');
        }
      } else {
        toast.error(data.message || 'Failed to send OTP');
        setErrors({ email: data.message });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setErrors({ otp: 'Please enter a valid 6-digit OTP' });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email: email.toLowerCase(),
          otp
        })
      });

      const data = await response.json();

      if (data.success) {
        setOtpVerified(true);
        toast.success('OTP verified! Now set your new password.');
      } else {
        toast.error(data.message || 'Invalid OTP');
        setErrors({ otp: data.message });
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast.error('Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { password?: string } = {};
    
    if (!newPassword || newPassword.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (newPassword !== confirmPassword) {
      newErrors.password = 'Passwords do not match';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email: email.toLowerCase(),
          otp,
          newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Password reset successfully!');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        toast.error(data.message || 'Failed to reset password');
        setErrors({ password: data.message });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email.toLowerCase() })
      });

      const data = await response.json();

      if (data.success) {
        setOtpExpiry(data.expiresIn || 600);
        
        if (data.otp) {
          setDisplayedOTP(data.otp); // Update displayed OTP
          console.log('🔐 New OTP:', data.otp);
          
          // Show prominent toast with OTP
          toast.success(
            (t) => (
              <div className="text-center">
                <div className="font-bold mb-2">New OTP Code</div>
                <div className="text-3xl font-mono tracking-widest bg-slate-700 px-4 py-2 rounded-lg">
                  {data.otp}
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  {data.emailSent ? 'Also sent to your email' : 'Email not configured - use this code'}
                </div>
              </div>
            ),
            {
              duration: 15000,
              style: {
                background: '#1e293b',
                color: '#fff',
                minWidth: '350px',
                padding: '20px',
                border: '2px solid #10b981'
              }
            }
          );
        } else if (data.emailSent) {
          toast.success('OTP resent to your email!');
        } else {
          toast.error('Could not resend OTP. Please try again.');
        }
      } else {
        toast.error(data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast.error('Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: OTP Verification
  if (otpSent && !otpVerified) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl">
            {/* Back Button */}
            <button
              onClick={() => {
                setOtpSent(false);
                setOtp('');
              }}
              className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Change Email
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Enter OTP</h1>
              <p className="text-slate-400">
                {emailSent ? (
                  <>We've sent a 6-digit code to <strong className="text-white">{email}</strong></>
                ) : (
                  <>Your 6-digit code for <strong className="text-white">{email}</strong></>
                )}
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Code expires in {Math.floor(otpExpiry / 60)} minutes
              </p>
            </div>

            {/* Display OTP if email wasn't sent */}
            {displayedOTP && !emailSent && (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-600/20 to-blue-600/20 border-2 border-green-500/50 rounded-xl">
                <div className="text-center">
                  <p className="text-sm text-slate-300 mb-2">📧 Email not configured - Use this code:</p>
                  <div className="text-4xl font-mono font-bold tracking-widest text-green-400 bg-slate-900 px-4 py-3 rounded-lg select-all">
                    {displayedOTP}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Click to select and copy this code</p>
                </div>
              </div>
            )}

            {/* Email sent confirmation */}
            {emailSent && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-2 border-blue-500/50 rounded-xl">
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-300">
                    ✅ OTP has been sent to your email
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Check your inbox (and spam folder)
                  </p>
                </div>
              </div>
            )}

            {/* OTP Form */}
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-slate-300 mb-2">
                  6-Digit OTP
                </label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(value);
                    setErrors({});
                  }}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  error={errors.otp}
                  autoFocus
                  className="text-center text-2xl tracking-widest"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isLoading || otp.length !== 6}
                icon={isLoading ? <LoadingSpinner size="sm" /> : <CheckCircle className="w-5 h-5" />}
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </form>

            {/* Resend OTP */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400 mb-2">
                Didn't receive the code?
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResendOTP}
                disabled={isLoading}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Resend OTP
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Set New Password (after OTP verified)
  if (otpVerified) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Set New Password</h1>
              <p className="text-slate-400">
                Enter your new password for <strong className="text-white">{email}</strong>
            </p>
            </div>

            {/* Password Form */}
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-300 mb-2">
                  New Password
                </label>
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrors({});
                  }}
                  placeholder="Enter new password"
                  icon={<Lock className="w-5 h-5" />}
                  error={errors.password}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors({});
                  }}
                  placeholder="Confirm new password"
                  icon={<Lock className="w-5 h-5" />}
                />
              </div>

              <label className="flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-800" 
                />
                <span className="ml-2 text-sm text-slate-400">Show passwords</span>
              </label>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isLoading}
                icon={isLoading ? <LoadingSpinner size="sm" /> : <CheckCircle className="w-5 h-5" />}
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl">
          {/* Back to Login */}
          <Link
            to="/login"
            className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Forgot Password?</h1>
            <p className="text-slate-400">
              Enter your email address and we'll send you a code to reset your password
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors({});
                }}
                placeholder="Enter your email"
                icon={<Mail className="w-5 h-5" />}
                error={errors.email}
                autoFocus
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isLoading}
              icon={isLoading ? <LoadingSpinner size="sm" /> : <Send className="w-5 h-5" />}
            >
              {isLoading ? 'Sending...' : 'Send OTP'}
            </Button>
          </form>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Remember your password?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            For security reasons, we'll send a 6-digit OTP to the email address associated with your account. The OTP expires in 10 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}

