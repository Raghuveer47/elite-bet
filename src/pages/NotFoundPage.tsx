import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/SupabaseAuthContext';

export function NotFoundPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Code */}
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-red-500 mb-2">404</h1>
          <h2 className="text-2xl font-bold text-white mb-2">NOT_FOUND</h2>
          <p className="text-slate-400 text-sm">The page you're looking for doesn't exist</p>
        </div>

        {/* Error Box */}
        <div className="bg-slate-800/50 rounded-lg border border-red-500/20 p-6 mb-6">
          <div className="text-left mb-4">
            <p className="text-sm text-slate-300 mb-1">
              <span className="font-semibold">Code:</span>
              <span className="ml-2 font-mono text-red-400">NOT_FOUND</span>
            </p>
            <p className="text-sm text-slate-300">
              <span className="font-semibold">ID:</span>
              <span className="ml-2 font-mono text-slate-400">
                {`spinzo::${Date.now()}-${Math.random().toString(36).substring(7)}`}
              </span>
            </p>
          </div>
          <Search className="w-12 h-12 text-slate-500 mx-auto" />
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to {isAuthenticated ? 'Dashboard' : 'Homepage'}
          </Button>
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Documentation Link */}
        <p className="mt-8 text-sm text-slate-500">
          Read our{' '}
          <a
            href="https://docs.spinzos.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-500 hover:text-red-400 underline"
          >
            documentation
          </a>
          {' '}to learn more about this error.
        </p>
      </div>
    </div>
  );
}
