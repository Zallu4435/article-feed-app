import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, HTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  helperText?: string;
  success?: boolean | string;
}

export interface Option {
  value: string;
  label: string;
}

export interface SelectDropdownProps {
  options: Option[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success' | 'warning';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'xl' | 'icon' | 'icon-sm' | 'icon-lg';

export interface ButtonProps {
  children: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}
export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export interface UserAvatarProps {
  src?: string;
  name?: string;
  size?: number;
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export interface LoadingSpinnerProps {
  size?: number;
  text?: string;
}

export interface ImageUploadProps {
  label?: string;
  onUploaded?: (url: string) => void;
  onFileSelected?: (file: File) => void;
  initialUrl?: string | null;
  onClear?: () => void;
}
