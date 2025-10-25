import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export function EmailVerificationHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Check if this is an email verification callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Email verification error:', error);
          toast.error('Email verification failed. Please try again.');
          navigate('/login');
          return;
        }

        if (data.session?.user) {
          console.log('Email verification successful for:', data.session.user.email);
          toast.success('Email verified successfully! Welcome to Elite Bet!');
          navigate('/dashboard');
        } else {
          // No session, redirect to login
          navigate('/login');
        }
      } catch (error) {
        console.error('Email verification handler error:', error);
        toast.error('Email verification failed. Please try again.');
        navigate('/login');
      }
    };

    // Check URL parameters for email verification
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    const type = urlParams.get('type');

    if (type === 'signup' && accessToken && refreshToken) {
      console.log('Email verification callback detected');
      handleEmailVerification();
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-white mb-2">Verifying Email...</h2>
        <p className="text-slate-400">Please wait while we verify your email address.</p>
      </div>
    </div>
  );
}
