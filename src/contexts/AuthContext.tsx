'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { User } from '@/generated/prisma';
import type { AuthContextType, RegisterData } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshProfile();
  }, []);

  const refreshProfile = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ user: User }>(`/api/users/profile`);
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      if (!response.ok) {
        const payload = await response.json();
        throw (payload?.error ?? { code: 'unknown_error', message: 'Login failed' });
      }
      refreshProfile().catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include',
      });
      if (!response.ok) {
        const payload = await response.json();
        throw (payload?.error ?? { code: 'unknown_error', message: 'Registration failed' });
      }
      const profileRes = await fetch('/api/users/profile', { credentials: 'include' });
      if (profileRes.ok) {
        const data = await profileRes.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      if (res.ok) {
        const { toast } = await import('react-hot-toast');
        toast.success('Logged out successfully!');
      }
    } catch (error) {
      const { toast } = await import('react-hot-toast');
      toast.success('Logged out successfully!');
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
