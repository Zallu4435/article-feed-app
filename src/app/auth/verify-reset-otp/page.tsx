'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  ArrowLeftIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import type { VerifyOtpFormData } from '@/types/auth';

const VerifyResetOtpContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); 
  const [resendCooldown, setResendCooldown] = useState(60); 

  const email = searchParams.get('email');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    setError,
    clearErrors
  } = useForm<VerifyOtpFormData>();

  const otp = watch('otp');

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    const otpInput = document.getElementById('otp');
    if (otpInput) {
      otpInput.focus();
    }
  }, []);

  const onSubmit = async (data: VerifyOtpFormData) => {
    if (!email) {
      toast.error('Email not found. Please try again.');
      return;
    }

    clearErrors('otp');

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', 
        },
        body: JSON.stringify({ 
          email: email,
          otp: data.otp 
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setOtpVerified(true);
        toast.success('OTP verified successfully!');
        setTimeout(() => {
          router.push(`/auth/reset-password?email=${encodeURIComponent(email)}&verified=true`);
        }, 1500);
      } else {
        setError('otp', {
          type: 'server',
          message: result.message || 'Invalid or expired OTP'
        });
        setValue('otp', ''); 
      }
    } catch (error) {
      setError('otp', {
        type: 'server',
        message: 'Something went wrong. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      toast.error('Email not found. Please try again.');
      return;
    }

    clearErrors('otp');
    setValue('otp', ''); 

    setIsResending(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email }),
      });

      const result = await response.json();

      if (response.ok) {
        setTimeLeft(600); 
        setResendCooldown(60); 
        toast.success('New OTP sent!');
      } else {
        toast.error(result.message || 'Failed to resend OTP');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (otpVerified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold text-green-800">
                OTP Verified!
              </CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Your email has been verified. Redirecting to reset password...
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <LoadingSpinner size={32} text="Redirecting..." overlay={true} preventScroll={true} backdrop="blur" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold text-red-800">
                Invalid Request
              </CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Email not found. Please start the password reset process again.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/auth/forgot-password" className="block">
              <Button 
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
                leftIcon={<ShieldCheckIcon className="w-5 h-5" />}
              >
                Start Password Reset
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
            <ShieldCheckIcon className="w-8 h-8 text-indigo-600" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold">Verify Your Email</CardTitle>
            <CardDescription className="text-base leading-relaxed">
              Enter the 6-digit code sent to{' '}
              <span className="font-medium text-gray-900">{email}</span>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                className="h-12 text-center text-lg tracking-widest"
                maxLength={6}
                {...register('otp', {
                  required: 'Verification code is required',
                  pattern: {
                    value: /^\d{6}$/,
                    message: 'Please enter a valid 6-digit code',
                  },
                })}
              />
              {errors.otp && (
                <p className="text-sm text-red-600">{errors.otp.message}</p>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                {timeLeft > 0 ? (
                  <>Code expires in <span className="font-medium text-indigo-600">{formatTime(timeLeft)}</span></>
                ) : (
                  <span className="text-red-600 font-medium">Code has expired</span>
                )}
              </p>
            </div>

            <Button
              type="submit"
              loading={isLoading}
              disabled={timeLeft === 0 || isLoading}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : timeLeft === 0 ? 'Code Expired' : 'Verify Code'}
            </Button>
          </form>

          <div className="space-y-4">
            <Button
              onClick={handleResendOtp}
              loading={isResending}
              disabled={resendCooldown > 0}
              variant="outline"
              className="w-full h-12 border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? 'Sending...' : 
               resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </Button>
            
            <div className="text-center pt-2">
              <Link 
                href="/auth/login" 
                className="text-sm text-gray-600 hover:text-indigo-600 hover:underline transition-colors inline-flex items-center gap-2"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const LoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <LoadingSpinner size={40} text="Loading..." overlay={true} preventScroll={true} backdrop="blur" />
  </div>
);

const VerifyResetOtpPage: React.FC = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyResetOtpContent />
    </Suspense>
  );
};

export default VerifyResetOtpPage;
