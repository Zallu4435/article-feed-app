'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  CalendarIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import useSWR from 'swr';
import { apiFetch } from '@/lib/api';

import { registerSchema, type RegisterFormData } from '@/schemas/auth/register';

const fetcher = (url: string) => apiFetch<{ categories: Array<{ id: string; name: string }> }>(url);

const RegisterPage: React.FC = () => {
  const { register: registerUser, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [pendingForm, setPendingForm] = useState<RegisterFormData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { data: categoriesData } = useSWR('/api/categories', fetcher);
  const categories = (categoriesData?.categories ?? []) as { id: string; name: string }[];

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
  });

  const watchedPassword = watch('password');

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const initiateRegistration = async (data: RegisterFormData) => {
    try {
      // call initiate endpoint to send OTP
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          email: data.email,
          dateOfBirth: data.dateOfBirth,
          password: data.password,
        }),
      });
      if (!res.ok) {
        const payload = await res.json();
        throw (payload?.error ?? { code: 'unknown_error', message: 'Failed to send OTP' });
      }
      const dataJson = await res.json().catch(() => ({}));
      setPendingForm(data);
      setStep(2);
      toast.success('Verification code sent to your email');
      // start resend cooldown
      setResendCooldown(60);
    } catch (error) {
      const err: any = error || {};
      if (err?.code === 'validation_error' && err?.details) {
        Object.entries(err.details).forEach(([field, message]) => {
          const key = field as keyof RegisterFormData;
          setError(key, { type: 'server', message: String(message) });
        });
        toast.error('Please fix the highlighted fields');
        return;
      }
      if (err?.code === 'conflict' && err?.details) {
        if (err.details.email) setError('email', { type: 'server', message: 'Email already in use' });
        if (err.details.phone) setError('phone', { type: 'server', message: 'Phone already in use' });
        toast.error(err.message || 'Email or phone already exists');
        return;
      }
      toast.error(err?.message || 'Failed to send OTP');
    }
  };

  // cooldown timer
  React.useEffect(() => {
    if (!resendCooldown) return;
    const id = setInterval(() => setResendCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const resendOtp = async () => {
    if (!pendingForm?.email) return;
    try {
      const res = await fetch('/api/auth/register/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingForm.email }),
      });
      if (!res.ok) {
        const payload = await res.json();
        if (payload?.error?.code === 'too_many_requests') {
          setResendCooldown(payload.error.retryAfter || 60);
        }
        throw (payload?.error ?? { code: 'unknown_error', message: 'Failed to resend code' });
      }
      toast.success('Verification code resent');
      setResendCooldown(60);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to resend code');
    }
  };

  const verifyAndRegister = async () => {
    try {
      if (!pendingForm) return;
      const res = await fetch('/api/auth/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...pendingForm,
          otp,
        }),
      });
      if (!res.ok) {
        const payload = await res.json();
        if (payload?.error?.code === 'otp_invalid') {
          setOtpError('Invalid verification code');
        } else if (payload?.error?.code === 'otp_expired') {
          setOtpError('Code expired. Please resend a new code');
        } else if (payload?.error?.code === 'otp_not_found') {
          setOtpError('No code found. Please request a new one');
        }
        throw (payload?.error ?? { code: 'unknown_error', message: 'Verification failed' });
      }
      const verified = await res.json().catch(() => ({}));
      // User is created and cookies set by verify API; refresh profile and move to preferences step
      await refreshProfile();
      setStep(3);
      setOtpError(null);
      toast.success('Email verified. Choose your preferences.');
    } catch (error) {
      const err: any = error || {};
      if (err?.code === 'validation_error' && err?.details) {
        Object.entries(err.details).forEach(([field, message]) => {
          const key = field as keyof RegisterFormData;
          setError(key, { type: 'server', message: String(message) });
        });
        toast.error('Please fix the highlighted fields');
        return;
      }
      if (err?.code === 'conflict' && err?.details) {
        if (err.details.email) setError('email', { type: 'server', message: 'Email already in use' });
        if (err.details.phone) setError('phone', { type: 'server', message: 'Phone already in use' });
        toast.error(err.message || 'Email or phone already exists');
        return;
      }
      toast.error(err?.message || 'Verification failed');
    }
  };

  const completeRegistration = async () => {
    try {
      if (selectedCategories.length) {
        await Promise.all(
          selectedCategories.map((categoryId) =>
            apiFetch('/api/users/preferences', {
              method: 'POST',
              body: { categoryId },
            })
          )
        );
      }
      toast.success('Registration successful!');
      router.push('/dashboard');
    } catch (err) {
      toast.error('Failed to save preferences');
    }
  };

  const nextStep = () => setStep(3);
  const prevStep = () => setStep(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-2 text-sm text-gray-600">
            Join ArticleFeeds and start discovering amazing content
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <span className={`text-sm font-medium ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>Personal Info</span>
            <span className={`text-sm font-medium ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>Verify Email</span>
            <span className={`text-sm font-medium ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>Preferences</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {step === 1 ? 'Personal Information' : 'Category Preferences'}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 1 
                ? 'Tell us about yourself' 
                : 'Choose topics that interest you'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <form onSubmit={handleSubmit(initiateRegistration)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="First Name"
                    placeholder="Enter your first name"
                    leftIcon={<UserIcon className="h-5 w-5" />}
                    error={errors.firstName?.message}
                    {...register('firstName')}
                  />
                  <Input
                    label="Last Name"
                    placeholder="Enter your last name"
                    leftIcon={<UserIcon className="h-5 w-5" />}
                    error={errors.lastName?.message}
                    {...register('lastName')}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Email"
                    type="email"
                    placeholder="Enter your email"
                    leftIcon={<EnvelopeIcon className="h-5 w-5" />}
                    error={errors.email?.message}
                    {...register('email')}
                  />
                  <Input
                    label="Phone Number"
                    placeholder="Enter your phone number"
                    leftIcon={<PhoneIcon className="h-5 w-5" />}
                    error={errors.phone?.message}
                    {...register('phone')}
                  />
                </div>

                <Input
                  label="Date of Birth"
                  type="date"
                  leftIcon={<CalendarIcon className="h-5 w-5" />}
                  error={errors.dateOfBirth?.message}
                  {...register('dateOfBirth')}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    leftIcon={<LockClosedIcon className="h-5 w-5" />}
                    error={errors.password?.message}
                    rightIcon={
                      showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" onClick={() => setShowPassword(false)} />
                      ) : (
                        <EyeIcon className="h-5 w-5" onClick={() => setShowPassword(true)} />
                      )
                    }
                    {...register('password')}
                  />
                  <Input
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    leftIcon={<LockClosedIcon className="h-5 w-5" />}
                    error={errors.confirmPassword?.message}
                    rightIcon={
                      showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5" onClick={() => setShowConfirmPassword(false)} />
                      ) : (
                        <EyeIcon className="h-5 w-5" onClick={() => setShowConfirmPassword(true)} />
                      )
                    }
                    {...register('confirmPassword')}
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" variant="default">
                  Send Verification Code
                </Button>
              </form>
            ) : step === 2 ? (
              <div className="space-y-6">
                <p className="text-sm text-gray-600">We sent a 6-digit code to your email. Enter it below to verify your email.</p>
                <Input
                  label="Verification Code"
                  placeholder="Enter the 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                {otpError && (
                  <p className="text-sm text-red-600">{otpError}</p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <button
                    type="button"
                    className={`text-blue-600 hover:underline disabled:text-gray-400`}
                    onClick={resendOtp}
                    disabled={resendCooldown > 0}
                  >
                    Resend code {resendCooldown > 0 ? `(${resendCooldown}s)` : ''}
                  </button>
                </div>
                <div className="flex space-x-4">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                  <Button type="button" onClick={verifyAndRegister} className="flex-1" loading={loading} variant="default" size="lg">
                    Verify Email
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedCategories.includes(category.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleCategoryToggle(category.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{category.name}</h3>
                        </div>
                        {selectedCategories.includes(category.id) && (
                          <CheckIcon className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button type="button" onClick={completeRegistration} className="flex-1" loading={loading} disabled={selectedCategories.length === 0} variant="default" size="lg">
                    Complete Registration
                  </Button>
                </div>
              </div>
            )}

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
