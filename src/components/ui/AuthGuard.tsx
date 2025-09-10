import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { AuthGuardProps } from '@/types/components';
import { 
  LockClosedIcon, 
  UserCircleIcon, 
  ArrowRightIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <LoadingSpinner size={32} text="Verifying access..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
              <LockClosedIcon className="w-8 h-8 text-indigo-600" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold">Sign in to continue</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                You need to be signed in to access this page. Create an account or sign in to get started.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Link href="/auth/login" className="flex-1">
                <Button 
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
                  leftIcon={<UserCircleIcon className="w-5 h-5" />}
                  rightIcon={<ArrowRightIcon className="w-4 h-4" />}
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register" className="flex-1">
                <Button 
                  variant="outline" 
                  className="w-full h-12 border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 font-medium rounded-lg"
                  leftIcon={<SparklesIcon className="w-5 h-5" />}
                >
                  Create Account
                </Button>
              </Link>
            </div>
            <div className="text-center pt-2">
              <Link href="/" className="text-sm text-gray-600 hover:text-indigo-600 hover:underline transition-colors">
                ← Back to home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
