import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useAdmin } from '../../contexts/SupabaseAdminContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { adminLogin, isLoading } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the intended destination from location state
  const from = location.state?.from?.pathname || '/admin/dashboard';

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setErrors({}); // Clear any previous errors
      await adminLogin(email, password);
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Admin login error:', error);
      setErrors({ password: 'Invalid admin credentials. Please check your email and password.' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
          {/* Header */}
          <div className="text-center mb-8">
            <img 
              src="https://res.cloudinary.com/dy9zlgjh6/image/upload/v1761390123/Gemini_Generated_Image_7764vh7764vh7764_hhd94q.png" 
              alt="Spinzos Logo" 
              className="w-16 h-16 rounded-2xl mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-white mb-2">Spinzos Admin Portal</h1>
            <p className="text-slate-400">Secure administrative access</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Admin Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@spinzos.com"
              error={errors.email}
              disabled={isLoading}
            />

            <div className="relative">
              <Input
                label="Admin Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                error={errors.password}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-slate-400 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                'Access Admin Portal'
              )}
            </Button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <div className="flex items-start space-x-2">
              <Shield className="w-4 h-4 text-yellow-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-300">
                  This is a secure administrative area. All actions are logged and monitored.
                  Unauthorized access attempts will be reported.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}