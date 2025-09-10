import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { ButtonProps } from '@/types/ui';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background active:scale-95 select-none',
  {
    variants: {
      variant: {
        default: 'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500 shadow-sm hover:shadow-md',
        destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 shadow-sm hover:shadow-md',
        outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus-visible:ring-indigo-500 shadow-sm hover:shadow-md',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500 shadow-sm hover:shadow-md',
        ghost: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500',
        link: 'text-indigo-600 underline-offset-4 hover:underline hover:text-indigo-700 focus-visible:ring-indigo-500 p-0 h-auto',
        success: 'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500 shadow-sm hover:shadow-md',
        warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus-visible:ring-yellow-500 shadow-sm hover:shadow-md',
      },
      size: {
        sm: 'h-9 px-3 text-xs rounded-md',
        default: 'h-10 px-4 py-2',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-lg',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0 rounded-md',
        'icon-lg': 'h-12 w-12 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    loading, 
    leftIcon, 
    rightIcon, 
    children, 
    disabled, 
    type = 'button',
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading;
    
    return (
      <button
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <Loader2 className={cn(
            "animate-spin",
            size === 'sm' ? "h-3 w-3" : 
            size === 'lg' ? "h-5 w-5" : 
            size === 'xl' ? "h-6 w-6" : "h-4 w-4",
            children && "mr-2"
          )} />
        )}
        
        {!loading && leftIcon && (
          <span className={cn(
            "flex items-center",
            children && "mr-2",
            size === 'sm' ? "[&>*]:h-3 [&>*]:w-3" :
            size === 'lg' ? "[&>*]:h-5 [&>*]:w-5" :
            size === 'xl' ? "[&>*]:h-6 [&>*]:w-6" : "[&>*]:h-4 [&>*]:w-4"
          )}>
            {leftIcon}
          </span>
        )}
        
        {children && (
          <span className={cn(
            "truncate",
            loading && "ml-0"
          )}>
            {children}
          </span>
        )}
        
        {!loading && rightIcon && (
          <span className={cn(
            "flex items-center",
            children && "ml-2",
            size === 'sm' ? "[&>*]:h-3 [&>*]:w-3" :
            size === 'lg' ? "[&>*]:h-5 [&>*]:w-5" :
            size === 'xl' ? "[&>*]:h-6 [&>*]:w-6" : "[&>*]:h-4 [&>*]:w-4"
          )}>
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };