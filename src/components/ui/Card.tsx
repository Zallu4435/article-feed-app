import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { CardProps, CardHeaderProps, CardContentProps, CardFooterProps } from '@/types/ui';

// Card variants using CVA
const cardVariants = cva(
  'rounded-lg bg-white text-gray-900 transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border border-gray-200 shadow-sm hover:shadow-md',
        elevated: 'border border-gray-200 shadow-md hover:shadow-lg',
        outlined: 'border-2 border-gray-300 shadow-none hover:border-gray-400',
        ghost: 'border-none shadow-none hover:bg-gray-50',
        gradient: 'border border-gray-200 shadow-sm hover:shadow-md bg-gradient-to-br from-white to-gray-50',
        success: 'border border-green-200 shadow-sm hover:shadow-md bg-green-50/50',
        warning: 'border border-yellow-200 shadow-sm hover:shadow-md bg-yellow-50/50',
        error: 'border border-red-200 shadow-sm hover:shadow-md bg-red-50/50',
        info: 'border border-blue-200 shadow-sm hover:shadow-md bg-blue-50/50',
      },
      size: {
        sm: 'text-sm',
        default: '',
        lg: 'text-base',
      },
      interactive: {
        true: 'cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      interactive: false,
    },
  }
);

// Card Header variants
const cardHeaderVariants = cva(
  'flex flex-col transition-colors duration-200',
  {
    variants: {
      variant: {
        default: 'space-y-1.5 p-6',
        compact: 'space-y-1 p-4',
        spacious: 'space-y-2 p-8',
        centered: 'space-y-1.5 p-6 text-center items-center',
      },
      divider: {
        true: 'border-b border-gray-100 pb-4 mb-4',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      divider: false,
    },
  }
);

// Card Title variants
const cardTitleVariants = cva(
  'font-semibold leading-none tracking-tight transition-colors duration-200',
  {
    variants: {
      size: {
        sm: 'text-lg',
        default: 'text-xl',
        lg: 'text-2xl',
        xl: 'text-3xl',
      },
      variant: {
        default: 'text-gray-900',
        muted: 'text-gray-700',
        success: 'text-green-800',
        warning: 'text-yellow-800',
        error: 'text-red-800',
        info: 'text-blue-800',
        gradient: 'bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
);

// Card Description variants
const cardDescriptionVariants = cva(
  'leading-relaxed transition-colors duration-200',
  {
    variants: {
      size: {
        sm: 'text-xs',
        default: 'text-sm',
        lg: 'text-base',
      },
      variant: {
        default: 'text-gray-600',
        muted: 'text-gray-500',
        success: 'text-green-700',
        warning: 'text-yellow-700',
        error: 'text-red-700',
        info: 'text-blue-700',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
);

// Card Content variants
const cardContentVariants = cva(
  'transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'p-6 pt-0',
        compact: 'p-4 pt-0',
        spacious: 'p-8 pt-0',
        flush: 'p-0',
        'flush-top': 'px-6 pb-6 pt-0',
        'flush-sides': 'py-6 px-0',
      },
      spacing: {
        none: 'space-y-0',
        sm: 'space-y-2',
        default: 'space-y-4',
        lg: 'space-y-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      spacing: 'default',
    },
  }
);

// Card Footer variants
const cardFooterVariants = cva(
  'flex items-center transition-colors duration-200',
  {
    variants: {
      variant: {
        default: 'p-6 pt-0',
        compact: 'p-4 pt-0',
        spacious: 'p-8 pt-0',
        divider: 'p-6 pt-4 border-t border-gray-100 mt-4',
      },
      justify: {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
        between: 'justify-between',
        around: 'justify-around',
      },
      spacing: {
        none: 'space-x-0',
        sm: 'space-x-2',
        default: 'space-x-4',
        lg: 'space-x-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      justify: 'start',
      spacing: 'default',
    },
  }
);

// Enhanced Card component with variants
interface EnhancedCardProps extends CardProps, VariantProps<typeof cardVariants> {
  hover?: boolean;
  loading?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, EnhancedCardProps>(
  ({ className, children, variant, size, interactive, hover, loading, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        cardVariants({ variant, size, interactive }),
        hover && 'hover:shadow-lg hover:-translate-y-1',
        loading && 'animate-pulse',
        className
      )}
      {...props}
    >
      {loading ? (
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  )
);

// Enhanced Card Header
interface EnhancedCardHeaderProps extends CardHeaderProps, VariantProps<typeof cardHeaderVariants> {
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

const CardHeader = React.forwardRef<HTMLDivElement, EnhancedCardHeaderProps>(
  ({ className, children, variant, divider, icon, badge, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardHeaderVariants({ variant, divider }), className)}
      {...props}
    >
      {(icon || badge) && (
        <div className="flex items-center justify-between mb-2">
          {icon && (
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 text-gray-600">
              {icon}
            </div>
          )}
          {badge && <div className="ml-auto">{badge}</div>}
        </div>
      )}
      {children}
    </div>
  )
);

// Enhanced Card Title
interface EnhancedCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement>, VariantProps<typeof cardTitleVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const CardTitle = React.forwardRef<HTMLHeadingElement, EnhancedCardTitleProps>(
  ({ className, children, size, variant, as = 'h3', ...props }, ref) => {
    const Component = as;
    return (
      <Component
        ref={ref}
        className={cn(cardTitleVariants({ size, variant }), className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

// Enhanced Card Description
interface EnhancedCardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement>, VariantProps<typeof cardDescriptionVariants> {}

const CardDescription = React.forwardRef<HTMLParagraphElement, EnhancedCardDescriptionProps>(
  ({ className, children, size, variant, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(cardDescriptionVariants({ size, variant }), className)}
      {...props}
    >
      {children}
    </p>
  )
);

// Enhanced Card Content
interface EnhancedCardContentProps extends CardContentProps, VariantProps<typeof cardContentVariants> {}

const CardContent = React.forwardRef<HTMLDivElement, EnhancedCardContentProps>(
  ({ className, children, variant, spacing, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn(cardContentVariants({ variant, spacing }), className)} 
      {...props}
    >
      {children}
    </div>
  )
);

// Enhanced Card Footer
interface EnhancedCardFooterProps extends CardFooterProps, VariantProps<typeof cardFooterVariants> {}

const CardFooter = React.forwardRef<HTMLDivElement, EnhancedCardFooterProps>(
  ({ className, children, variant, justify, spacing, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardFooterVariants({ variant, justify, spacing }), className)}
      {...props}
    >
      {children}
    </div>
  )
);

// Set display names
Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardTitle.displayName = 'CardTitle';
CardDescription.displayName = 'CardDescription';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  cardVariants,
  cardHeaderVariants,
  cardTitleVariants,
  cardDescriptionVariants,
  cardContentVariants,
  cardFooterVariants
};