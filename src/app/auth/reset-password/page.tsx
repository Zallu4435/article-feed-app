'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { 
  ArrowLeftIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

const ResetPasswordPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const email = searchParams.get('email');
  const verified = searchParams.get('verified');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<ResetPasswordFormData>();

  const password = watch('password');

  useEffect(() => {
    const validateAccess = async () => {
      if (!email || verified !== 'true') {
        setIsValidating(false);
        return;
      }

      try {
        // Check if user has a valid OTP verification
        const response = await fetch(`/api/auth/validate-reset-access?email=${encodeURIComponent(email)}`);
        if (response.ok) {
          setIsValid(true);
        } else {
          setIsValid(false);
        }
      } catch (error) {
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateAccess();
  }, [email, verified]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!email) {
      toast.error('Email not found. Please try again.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setPasswordReset(true);
        toast.success('Password reset successfully!');
      } else {
        toast.error(result.message || 'Failed to reset password');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 text-sm">Validating access...</p>
        </div>
      </div>
    );
  }

  if (!email || !isValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold text-red-800">
                Access Denied
              </CardTitle>
              <CardDescription className="text-base leading-relaxed">
                You need to verify your email first. Please complete the OTP verification process.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Link href="/auth/forgot-password" className="block">
                <Button 
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
                  leftIcon={<LockClosedIcon className="w-5 h-5" />}
                >
                  Start Password Reset
                </Button>
              </Link>
              <Link href="/auth/login" className="block">
                <Button
                  variant="outline"
                  className="w-full h-12 border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 font-medium rounded-lg"
                  leftIcon={<ArrowLeftIcon className="w-5 h-5" />}
                >
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (passwordReset) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold text-green-800">
                Password Reset Successfully!
              </CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Your password has been updated. You can now sign in with your new password.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/auth/login" className="block">
              <Button 
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
                leftIcon={<ArrowLeftIcon className="w-5 h-5" />}
              >
                Sign In Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
            <LockClosedIcon className="w-8 h-8 text-indigo-600" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold">Reset Your Password</CardTitle>
            <CardDescription className="text-base leading-relaxed">
              Enter your new password below. Make sure it's secure and easy to remember.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                New Password
              </label>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your new password"
                className="h-12"
                rightIcon={
                  showPassword ? (
                    <EyeSlashIcon
                      className="h-5 w-5 cursor-pointer text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(false)}
                    />
                  ) : (
                    <EyeIcon
                      className="h-5 w-5 cursor-pointer text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(true)}
                    />
                  )
                }
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                  },
                })}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your new password"
                className="h-12"
                rightIcon={
                  showConfirmPassword ? (
                    <EyeSlashIcon
                      className="h-5 w-5 cursor-pointer text-gray-400 hover:text-gray-600"
                      onClick={() => setShowConfirmPassword(false)}
                    />
                  ) : (
                    <EyeIcon
                      className="h-5 w-5 cursor-pointer text-gray-400 hover:text-gray-600"
                      onClick={() => setShowConfirmPassword(true)}
                    />
                  )
                }
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === password || 'Passwords do not match',
                })}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              loading={isLoading}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
              leftIcon={<LockClosedIcon className="w-5 h-5" />}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>

          <div className="text-center pt-2">
            <Link 
              href="/auth/login" 
              className="text-sm text-gray-600 hover:text-indigo-600 hover:underline transition-colors inline-flex items-center"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
