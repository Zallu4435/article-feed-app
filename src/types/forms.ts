// Form data types from schemas
export type LoginFormData = {
  email: string;
  password: string;
};

export type RegisterFormData = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  password: string;
  confirmPassword: string;
};

export type ProfileFormData = {
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
};

export type CreateArticleForm = {
  title: string;
  description: string;
  content: string;
  imageUrl?: string;
  tags?: string[];
  categoryId: string;
};

export type ChangePasswordFormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ForgotPasswordFormData = {
  email: string;
};

export type VerifyOtpFormData = {
  otp: string;
};

export type ResetPasswordFormData = {
  password: string;
  confirmPassword: string;
};
