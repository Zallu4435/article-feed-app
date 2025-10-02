'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useProfile, useUpdateProfile } from '@/hooks/useUser';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { profileSchema } from '@/schemas/user/profile';
import { toast } from 'react-hot-toast';
import { CalendarIcon, EnvelopeIcon, PhoneIcon, UserIcon } from '@heroicons/react/24/outline';
import { AuthGuard } from '@/components/ui/AuthGuard';
import ProfilePictureUpload from '@/components/ui/ProfilePictureUpload';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { data, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const qc = useQueryClient();
  const { refreshProfile, user: authUser, updateUser } = useAuth();

  const user = data?.data?.user;

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      dateOfBirth: '',
    }
  });

  React.useEffect(() => {
    if (user) {
      setValue('firstName', user.firstName || '');
      setValue('lastName', user.lastName || '');
      setValue('phone', user.phone || '');
      const dob = user.dateOfBirth ? new Date(user.dateOfBirth) : undefined;
      if (dob && !Number.isNaN(dob.getTime())) {
        const yyyy = dob.getFullYear();
        const mm = String(dob.getMonth() + 1).padStart(2, '0');
        const dd = String(dob.getDate()).padStart(2, '0');
        setValue('dateOfBirth', `${yyyy}-${mm}-${dd}`);
      } else {
        setValue('dateOfBirth', '');
      }
    }
  }, [user?.firstName, user?.lastName, user?.phone, user?.dateOfBirth, setValue]);

  return (
    <AuthGuard>
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Card loading={isLoading} className="mb-6 rounded-xl shadow-sm">
        <CardHeader divider icon={<UserIcon className="w-5 h-5" />}>
          <CardTitle size="lg">Your Profile</CardTitle>
          <CardDescription>Manage your personal information and preferences</CardDescription>
        </CardHeader>
        <CardContent spacing="lg">
          <div className="flex items-center gap-6">
            <div className="relative">
              <UserAvatar 
                src={authUser?.profilePicture || user?.profilePicture || undefined}
                name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()} 
                size={80}
              />
              <ProfilePictureUpload
                currentImageUrl={authUser?.profilePicture || user?.profilePicture}
                onUploaded={(url: string) => {

                  updateUser({ profilePicture: url });
                  
                  qc.setQueryData(['profile'], (oldData: any) => {
                    if (!oldData?.data?.user) return oldData;
                    return { 
                      ...oldData, 
                      data: { 
                        ...oldData.data, 
                        user: { 
                          ...oldData.data.user, 
                          profilePicture: url 
                        } 
                      } 
                    };
                  });
                }}
                onRemove={() => {

                  updateUser({ profilePicture: null });
                  
                  qc.setQueryData(['profile'], (oldData: any) => {
                    if (!oldData?.data?.user) return oldData;
                    return { 
                      ...oldData, 
                      data: { 
                        ...oldData.data, 
                        user: { 
                          ...oldData.data.user, 
                          profilePicture: null 
                        } 
                      } 
                    };
                  });
                }}
                size="sm"
                showAsOverlay={true}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xl font-semibold truncate">{user?.firstName} {user?.lastName}</p>
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                <span className="truncate">{user?.email}</span>
              </div>
              {user?.phone && (
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <PhoneIcon className="w-4 h-4 text-gray-400" />
                  <span>{user.phone}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter variant="divider" justify="between">
          <div className="text-sm text-gray-500">
            <span>Member since </span>
            <span className="font-medium text-gray-700">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span>
          </div>
          <div className="text-sm text-gray-500">
            <span>Last updated </span>
            <span className="font-medium text-gray-700">{user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : '—'}</span>
          </div>
        </CardFooter>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader divider>
            <CardTitle>Profile details</CardTitle>
            <CardDescription>Full information about your account</CardDescription>
          </CardHeader>
          <CardContent spacing="lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-xs font-medium text-gray-500">First name</p>
                <p className="mt-1 text-sm text-gray-900">{user?.firstName || '—'}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-xs font-medium text-gray-500">Last name</p>
                <p className="mt-1 text-sm text-gray-900">{user?.lastName || '—'}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-4 sm:col-span-2">
                <p className="text-xs font-medium text-gray-500">Email</p>
                <p className="mt-1 text-sm text-gray-900 break-all">{user?.email || '—'}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-xs font-medium text-gray-500">Phone</p>
                <p className="mt-1 text-sm text-gray-900">{user?.phone || '—'}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-4">
                <p className="text-xs font-medium text-gray-500">Date of birth</p>
                <p className="mt-1 text-sm text-gray-900">{user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader divider>
            <CardTitle>Edit profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent spacing="lg">
            <form onSubmit={handleSubmit(async (payload: any) => {
              try {
                const body: any = {
                  firstName: payload.firstName,
                  lastName: payload.lastName,
                };
                if (payload.phone) body.phone = String(payload.phone);
                if (payload.dateOfBirth) body.dateOfBirth = String(payload.dateOfBirth);
                await updateProfile.mutateAsync(body);
                toast.success('Profile updated successfully');
              } catch (e: any) {
                toast.error(e?.message || 'Failed to update profile');
              }
            })} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First name"
                  placeholder="Your first name"
                  error={errors.firstName?.message}
                  leftIcon={<UserIcon className="w-5 h-5" />}
                  required
                  {...register('firstName')}
                />
                <Input
                  label="Last name"
                  placeholder="Your last name"
                  error={errors.lastName?.message}
                  leftIcon={<UserIcon className="w-5 h-5" />}
                  required
                  {...register('lastName')}
                />
                <Input
                  label="Phone"
                  placeholder="e.g. +1 555 123 4567"
                  error={errors.phone?.message}
                  leftIcon={<PhoneIcon className="w-5 h-5" />}
                  {...register('phone')}
                />
                <Input
                  type="date"
                  label="Date of birth"
                  placeholder="YYYY-MM-DD"
                  max={new Date().toISOString().split('T')[0]}
                  error={errors.dateOfBirth?.message}
                  leftIcon={<CalendarIcon className="w-5 h-5" />}
                  {...register('dateOfBirth')}
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    if (!user) return;
                    reset();
                    setValue('firstName', user.firstName || '');
                    setValue('lastName', user.lastName || '');
                    setValue('phone', user.phone || '');
                    const dob = user.dateOfBirth ? new Date(user.dateOfBirth) : undefined;
                    if (dob && !Number.isNaN(dob.getTime())) {
                      const yyyy = dob.getFullYear();
                      const mm = String(dob.getMonth() + 1).padStart(2, '0');
                      const dd = String(dob.getDate()).padStart(2, '0');
                      setValue('dateOfBirth', `${yyyy}-${mm}-${dd}`);
                    } else {
                      setValue('dateOfBirth', '');
                    }
                  }}
                >
                  Reset
                </Button>
                <Button type="submit" loading={updateProfile.isPending} className="shadow-sm">
                  Save changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {Array.isArray(user?.preferences) && user.preferences.length > 0 && (
        <Card className="mt-6">
          <CardHeader divider>
            <CardTitle>Interests</CardTitle>
            <CardDescription>Your selected categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {user.preferences.map((pref: any) => (
                <span key={pref.id} className="px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {pref.category?.name || 'Unknown'}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </AuthGuard>
  );
}
