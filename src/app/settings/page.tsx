'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { useTheme } from '@/contexts/ThemeContext';
import { useChangePassword } from '@/hooks/useSecurity';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { changePasswordSchema } from '@/schemas/auth/change-password';
import type { InferType } from 'yup';

type ChangePasswordFormData = InferType<typeof changePasswordSchema>;

import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { usePreferences, useAddPreference, useRemovePreference, useProfile, useDeleteAccount, useCategories } from '@/hooks/useUser';
import { AuthGuard } from '@/components/ui/AuthGuard';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { WarningDialog } from '@/components/ui/WarningDialog';


const SettingsPage: React.FC = () => {
  const { theme } = useTheme();
  const [tab, setTab] = useState<'preferences' | 'security' | 'account'>('preferences');

  const prof = useProfile();
  const prefs = usePreferences();
  const cats = useCategories();
  const addPref = useAddPreference();
  const remPref = useRemovePreference();

  const [preferred, setPreferred] = useState<string[]>([]);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (prof.data?.user) {
      const u: any = prof.data.user;
      const prefCats = (u.preferences || []).map((p: any) => p.categoryId);
      setPreferred(prefCats);
    }
  }, [prof.data]);

  const {
    register: registerSecurity,
    handleSubmit: handleSubmitSecurity,
    reset: resetSecurity,
    watch: watchSecurity,
    formState: { errors: errorsSecurity },
  } = useForm<ChangePasswordFormData>({ resolver: yupResolver(changePasswordSchema) });

  const changePass = useChangePassword();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const onSubmitSecurity = async (data: ChangePasswordFormData) => {
    try {
      setApiError(null);
      await changePass.mutateAsync(data);
      toast.success('Password changed successfully');
      resetSecurity();
      setShowCurrent(false);
      setShowNew(false);
    } catch (e: any) {
      const message = e?.message || 'Failed to change password';
      setApiError(message);
      toast.error(message);
    }
  };
  const delAccount = useDeleteAccount();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const confirmDelete = async () => {
    try {
      await delAccount.mutateAsync();
      toast.success('Your account has been deleted');
      window.location.href = '/auth/login';
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete account');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const selectAllCategories = () => setPreferred((cats.data?.categories || []).map((c: any) => c.id));
  const clearAllCategories = () => setPreferred([]);
  const savePreferences = async () => {
    setSavingPrefs(true);
    try {
      const current = new Set<string>((prof.data?.user?.preferences || []).map((p: any) => p.categoryId));
      for (const c of preferred) if (!current.has(c)) await addPref.mutateAsync(c);
      for (const c of current) if (!preferred.includes(c)) await remPref.mutateAsync(c);
      toast.success('Preferences updated');
    } finally {
      setSavingPrefs(false);
    }
  };

  const strength = (() => {
    let s = 0;
    const pwd = watchSecurity ? (watchSecurity('newPassword') || '') : '';
    if (pwd.length >= 8) s += 1;
    if (/[A-Z]/.test(pwd)) s += 1;
    if (/[a-z]/.test(pwd)) s += 1;
    if (/\d/.test(pwd)) s += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) s += 1;
    return s; // 0..5
  })();

  return (
    <AuthGuard>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        {/* Tabs */}
        <div className="flex border-b mb-6">
          {(
            [
              { id: 'preferences', label: 'Preferences' },
              { id: 'security', label: 'Security' },
              { id: 'account', label: 'Account' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 -mb-px border-b-2 font-medium text-sm ${
                tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}

        {tab === 'preferences' && (
          <Card>
            <CardHeader divider>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Choose categories you’re interested in and theme</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Categories</span>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={clearAllCategories}>Clear all</Button>
                    <Button size="sm" variant="secondary" onClick={selectAllCategories}>Select all</Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(cats.data?.categories || []).map((c: any) => {
                    const id = c.id as string;
                    const active = preferred.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPreferred((prev) => active ? prev.filter((x) => x !== id) : [...prev, id])}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                          active ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="block text-sm font-medium text-gray-700 mb-3">Theme</span>
                <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => (document.documentElement.classList.remove('dark'), localStorage.setItem('theme','light'))}
                    className={`px-4 py-2 text-sm rounded-md transition ${theme === 'light' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => (document.documentElement.classList.add('dark'), localStorage.setItem('theme','dark'))}
                    className={`px-4 py-2 text-sm rounded-md transition ${theme === 'dark' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    Dark
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button variant="outline">Cancel</Button>
                <Button onClick={savePreferences} loading={savingPrefs}>Save</Button>
              </div>
            </CardContent>
            <CardFooter className="p-6 pt-0 text-sm text-gray-500">
              Want to update your personal details? <Link href="/profile" className="ml-1 text-indigo-600 hover:underline">Go to your profile</Link>
            </CardFooter>
          </Card>
        )}

        {tab === 'security' && (
          <Card>
            <CardHeader divider>
              <CardTitle>Security</CardTitle>
              <CardDescription>Update your password regularly to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {apiError && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {apiError}
                </div>
              )}
              <form onSubmit={handleSubmitSecurity(onSubmitSecurity)} className="space-y-4">
                <Input
                  label="Current Password"
                  type={showCurrent ? 'text' : 'password'}
                  error={errorsSecurity.currentPassword?.message}
                  placeholder="Enter your current password"
                  rightIcon={
                    showCurrent ? (
                      <EyeSlashIcon className="h-5 w-5 cursor-pointer" onClick={() => setShowCurrent(false)} />
                    ) : (
                      <EyeIcon className="h-5 w-5 cursor-pointer" onClick={() => setShowCurrent(true)} />
                    )
                  }
                  {...registerSecurity('currentPassword')}
                />
                <div className="space-y-2">
                  <Input
                    label="New Password"
                    type={showNew ? 'text' : 'password'}
                    error={errorsSecurity.newPassword?.message}
                    placeholder="Create a new password"
                    rightIcon={
                      showNew ? (
                        <EyeSlashIcon className="h-5 w-5 cursor-pointer" onClick={() => setShowNew(false)} />
                      ) : (
                        <EyeIcon className="h-5 w-5 cursor-pointer" onClick={() => setShowNew(true)} />
                      )
                    }
                    {...registerSecurity('newPassword')}
                  />
                  <div className="h-2 w-full bg-gray-200 rounded">
                    <div
                      className={`h-2 rounded ${
                        strength <= 2 ? 'bg-red-500 w-1/5' : strength === 3 ? 'bg-yellow-500 w-3/5' : 'bg-green-500 w-full'
                      }`}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Use at least 8 characters with a mix of upper/lowercase, numbers, and symbols.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => resetSecurity()}>Cancel</Button>
                  <Button type="submit" loading={changePass.isPending}>Change Password</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {tab === 'account' && (
          <Card>
            <CardHeader divider>
              <CardTitle>Account</CardTitle>
              <CardDescription>Danger zone: deleting your account is permanent</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-gray-700 text-sm">
                To confirm, type <span className="font-semibold">DELETE</span> below and click Delete.
              </p>
              <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Type DELETE to confirm" />
              <div className="flex items-center justify-end">
                <Button variant="destructive" disabled={confirmText !== 'DELETE'} onClick={() => setShowDeleteModal(true)}>Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {showDeleteModal && (
        <WarningDialog
          title="Delete account"
          description="This action cannot be undone. Your data will be permanently removed."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
    </AuthGuard>
  );
};

export default SettingsPage;
