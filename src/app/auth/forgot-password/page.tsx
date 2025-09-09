'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { 
  ArrowLeftIcon,
  EnvelopeIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface ForgotPasswordFormData {
  email: string;
}

const ForgotPasswordPage: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<ForgotPasswordFormData>();

  const email = watch('email');

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setSentEmail(data.email);
        toast.success('OTP sent to your email!');
      } else {
        toast.error(result.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (otpSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold text-green-800">
                OTP Sent!
              </CardTitle>
              <CardDescription className="text-base leading-relaxed">
                We've sent a 6-digit verification code to{' '}
                <span className="font-medium text-gray-900">{sentEmail}</span>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Didn't receive the code?</strong> Check your spam folder or try again in a few minutes.
              </p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => router.push(`/auth/verify-reset-otp?email=${encodeURIComponent(sentEmail)}`)}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
                leftIcon={<EnvelopeIcon className="w-5 h-5" />}
              >
                Enter Verification Code
              </Button>
              <Button
                onClick={() => setOtpSent(false)}
                variant="outline"
                className="w-full h-12 border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 font-medium rounded-lg"
                leftIcon={<EnvelopeIcon className="w-5 h-5" />}
              >
                Send Another OTP
              </Button>
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
            <EnvelopeIcon className="w-8 h-8 text-indigo-600" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold">Forgot Password?</CardTitle>
            <CardDescription className="text-base leading-relaxed">
              No worries! Enter your email address and we'll send you a link to reset your password.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                className="h-12"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Please enter a valid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              loading={isLoading}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
              leftIcon={<EnvelopeIcon className="w-5 h-5" />}
            >
              {isLoading ? 'Sending...' : 'Send Reset Code'}
            </Button>
          </form>

          <div className="text-center pt-2">
            <Link 
              href="/auth/login" 
              className="text-sm text-gray-600 hover:text-indigo-600 hover:underline transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
