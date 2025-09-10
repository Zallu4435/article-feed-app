'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { loginSchema, type LoginFormData } from '@/schemas/auth/login';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';


const LoginPage: React.FC = () => {
  const { login, loading } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isEmail, setIsEmail] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
  });

  const emailOrPhone = watch('emailOrPhone');

  React.useEffect(() => {
    if (emailOrPhone) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setIsEmail(emailRegex.test(emailOrPhone));
    }
  }, [emailOrPhone]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.emailOrPhone, data.password);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error) {
      const err: any = error || {};
      if (err?.code === 'validation_error' && err?.details) {
        Object.entries(err.details).forEach(([field, message]) => {
          if (field === 'email') setError('emailOrPhone', { type: 'server', message: String(message) });
          if (field === 'password') setError('password', { type: 'server', message: String(message) });
        });
        toast.error('Please fix the highlighted fields');
        return;
      }
      if (err?.code === 'user_not_found') {
        setError('emailOrPhone', { type: 'server', message: err.message || 'No account found' });
        toast.error(err.message || 'No account found');
        return;
      }
      if (err?.code === 'invalid_password') {
        setError('password', { type: 'server', message: err.message || 'Incorrect password' });
        toast.error(err.message || 'Incorrect password');
        return;
      }
      toast.error(err?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account to continue
          </p>
        </div>

        <Card variant="elevated" hover>
          <CardHeader variant="centered" divider>
            <CardTitle size="lg" className="text-center" variant="gradient">Sign in</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Input
                  label="Email or Phone"
                  type="text"
                  placeholder={isEmail ? 'Enter your email' : 'Enter your phone number'}
                  leftIcon={isEmail ? <EnvelopeIcon className="h-5 w-5" /> : <PhoneIcon className="h-5 w-5" />}
                  error={errors.emailOrPhone?.message}
                  required
                  {...register('emailOrPhone')}
                />
              </div>

              <div>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  error={errors.password?.message}
                  required
                  rightIcon={
                    showPassword ? (
                      <EyeSlashIcon
                        className="h-5 w-5"
                        onClick={() => setShowPassword(false)}
                      />
                    ) : (
                      <EyeIcon
                        className="h-5 w-5"
                        onClick={() => setShowPassword(true)}
                      />
                    )
                  }
                  {...register('password')}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={loading}
                size="lg"
                variant="default"
              >
                Sign in
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link
                    href="/auth/register"
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Sign up
                  </Link>
                </p>
                <p className="text-sm">
                  <Link
                    href="/auth/forgot-password"
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Forgot your password?
                  </Link>
                </p>
              </div>
            </form>

            
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
