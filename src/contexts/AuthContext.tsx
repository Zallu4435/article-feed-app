'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/entities/User';
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

  // Fetch user profile on mount
  useEffect(() => {
    console.log('[AUTH] Mounting AuthProvider');
    refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshProfile = async () => {
    setLoading(true);
    try {
      console.log('[AUTH] Fetching /api/users/profile');
      const res = await fetch('/api/users/profile', { credentials: 'include' });
      console.log('[AUTH] Profile response status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('[AUTH] Profile fetched for userId:', data?.user?.id);
        setUser(data.user);
      } else {
        let errorPayload: any = null;
        try { errorPayload = await res.json(); } catch {}
        console.log('[AUTH] Profile fetch failed:', errorPayload || res.statusText);
        setUser(null);
      }
    } catch (e) {
      console.log('[AUTH] Profile fetch threw error');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('[AUTH] Logging in with', email);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      console.log('[AUTH] Login response status:', response.status);
      if (!response.ok) {
        const payload = await response.json();
        throw (payload?.error ?? { code: 'unknown_error', message: 'Login failed' });
      }
      // Fire-and-forget refresh to avoid blocking navigation
      refreshProfile().catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setLoading(true);
    try {
      console.log('[AUTH] Registering user:', userData.email);
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include',
      });
      console.log('[AUTH] Register response status:', response.status);
      if (!response.ok) {
        const payload = await response.json();
        throw (payload?.error ?? { code: 'unknown_error', message: 'Registration failed' });
      }
      // Fetch user profile after registration
      const profileRes = await fetch('/api/users/profile', { credentials: 'include' });
      console.log('[AUTH] Post-register profile status:', profileRes.status);
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
      console.log('[AUTH] Logout response status:', res.status);
      if (res.ok) {
        // Import toast dynamically to avoid SSR issues
        const { toast } = await import('react-hot-toast');
        toast.success('Logged out successfully!');
      }
    } catch (error) {
      console.error('[AUTH] Logout error:', error);
      // Still show success toast even if API call fails
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
