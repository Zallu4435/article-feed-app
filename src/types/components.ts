import type { VariantProps } from 'class-variance-authority';
import type React from 'react';

export interface ProfilePictureUploadProps {
  currentImageUrl?: string | null;
  onUploaded: (url: string) => void;
  onRemove?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showAsOverlay?: boolean;
}

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: {
    id: string;
    title: string;
    description?: string;
    imageUrl?: string;
  };
  url: string;
}

export interface SearchResultsProps {
  query: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: () => void;
}

export interface WarningDialogProps {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export interface EnhancedSelectProps extends Omit<SelectDropdownProps, 'onChange'> {
  error?: string;
  helperText?: string;
  success?: boolean | string;
  required?: boolean;
  variant?: 'default' | 'minimal' | 'filled';
  size?: 'sm' | 'default' | 'lg';
  clearable?: boolean;
  searchable?: boolean;
  multiple?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  onChange?: (value: string | string[]) => void;
  onClear?: () => void;
  onSearch?: (query: string) => void;
}

export interface EnhancedTextAreaProps extends TextAreaProps {
  success?: boolean | string;
  required?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical' | 'auto';
  variant?: 'default' | 'minimal' | 'filled';
  size?: 'sm' | 'default' | 'lg';
}

export interface EnhancedCardProps extends CardProps, VariantProps<typeof cardVariants> {
  hover?: boolean;
}

export interface EnhancedCardHeaderProps extends CardHeaderProps, VariantProps<typeof cardHeaderVariants> {
  icon?: React.ReactNode;
}

export interface EnhancedCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement>, VariantProps<typeof cardTitleVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export interface EnhancedCardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement>, VariantProps<typeof cardDescriptionVariants> {}

export interface EnhancedCardContentProps extends CardContentProps, VariantProps<typeof cardContentVariants> {}

export interface EnhancedCardFooterProps extends CardFooterProps, VariantProps<typeof cardFooterVariants> {}

import type { 
  SelectDropdownProps, 
  TextAreaProps, 
  CardProps, 
  CardHeaderProps, 
  CardContentProps, 
  CardFooterProps 
} from './ui';

declare const cardVariants: any;
declare const cardHeaderVariants: any;
declare const cardTitleVariants: any;
declare const cardDescriptionVariants: any;
declare const cardContentVariants: any;
declare const cardFooterVariants: any;
