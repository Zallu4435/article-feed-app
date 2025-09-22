export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
  refreshProfile: () => Promise<void>;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  password: string;
}

export interface VerifyOtpFormData {
  otp: string;
}

export interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}


import type { User } from '@/generated/prisma';
