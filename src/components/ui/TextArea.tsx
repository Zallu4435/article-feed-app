import React from 'react';
import { cn } from '@/lib/utils';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import type { TextAreaProps } from '@/types/ui';

interface EnhancedTextAreaProps extends TextAreaProps {
  success?: boolean | string;
  required?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical' | 'auto';
  variant?: 'default' | 'minimal' | 'filled';
  size?: 'sm' | 'default' | 'lg';
}

const TextArea = React.forwardRef<HTMLTextAreaElement, EnhancedTextAreaProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    id,
    required,
    success,
    maxLength,
    showCharCount = false,
    resize = 'vertical',
    variant = 'default',
    size = 'default',
    disabled,
    placeholder,
    value,
    defaultValue,
    onChange,
    onFocus,
    onBlur,
    ...props 
  }, ref) => {
    const reactId = React.useId();
    const textAreaId = id || reactId;
    const [isFocused, setIsFocused] = React.useState(false);
    const [charCount, setCharCount] = React.useState(0);

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    React.useEffect(() => {
      const currentValue = value || defaultValue || '';
      setCharCount(String(currentValue).length);
    }, [value, defaultValue]);

    // Determine states for styling
    const isError = !!error;
    const isSuccess = success && !isError;
    const isActive = isFocused;

    // Size configurations
    const sizeConfig = {
      sm: {
        padding: 'px-3 py-2',
        text: 'text-xs',
        minHeight: 'min-h-[80px]',
        labelText: 'text-xs',
      },
      default: {
        padding: 'px-3 py-2.5',
        text: 'text-sm',
        minHeight: 'min-h-[100px]',
        labelText: 'text-sm',
      },
      lg: {
        padding: 'px-4 py-3',
        text: 'text-base',
        minHeight: 'min-h-[120px]',
        labelText: 'text-sm',
      },
    };

    const currentSize = sizeConfig[size];

    // Variant configurations
    const getVariantClasses = () => {
      const baseClasses = `
        block w-full rounded-lg border transition-all duration-200 
        placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0
        disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
        ${currentSize.padding} ${currentSize.text} ${currentSize.minHeight}
      `;

      if (variant === 'filled') {
        return cn(baseClasses, 
          'bg-gray-50 border-transparent',
          isError ? [
            'bg-red-50 text-red-900 placeholder-red-400',
            'focus:bg-red-50 focus:ring-red-500/20 focus:border-red-500'
          ] :
          isSuccess ? [
            'bg-green-50 text-green-900',
            'focus:bg-green-50 focus:ring-green-500/20 focus:border-green-500'
          ] :
          disabled ? 'bg-gray-100' : [
            'text-gray-900 hover:bg-gray-100',
            'focus:bg-white focus:ring-indigo-500/20 focus:border-indigo-500'
          ]
        );
      }

      if (variant === 'minimal') {
        return cn(baseClasses,
          'bg-transparent border-0 border-b-2 rounded-none px-0',
          isError ? [
            'border-red-300 text-red-900 placeholder-red-400',
            'focus:border-red-500 focus:ring-0'
          ] :
          isSuccess ? [
            'border-green-300 text-green-900',
            'focus:border-green-500 focus:ring-0'
          ] :
          disabled ? 'border-gray-200' : [
            'border-gray-300 text-gray-900',
            'hover:border-gray-400',
            'focus:border-indigo-500 focus:ring-0'
          ]
        );
      }

      // Default variant
      return cn(baseClasses,
        isError ? [
          'border-red-300 bg-red-50/50 text-red-900 placeholder-red-400',
          'focus:border-red-500 focus:ring-red-500/20'
        ] :
        isSuccess ? [
          'border-green-300 bg-green-50/50 text-green-900',
          'focus:border-green-500 focus:ring-green-500/20'
        ] :
        disabled ? [
          'border-gray-200 bg-gray-50'
        ] : [
          'border-gray-300 bg-white text-gray-900',
          'hover:border-gray-400 focus:border-indigo-500 focus:ring-indigo-500/20'
        ],
        !disabled && 'shadow-sm hover:shadow-md focus:shadow-md'
      );
    };

    // Resize classes
    const getResizeClasses = () => {
      switch (resize) {
        case 'none': return 'resize-none';
        case 'both': return 'resize';
        case 'horizontal': return 'resize-x';
        case 'vertical': return 'resize-y';
        case 'auto': return 'resize-none overflow-hidden';
        default: return 'resize-y';
      }
    };

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label 
            htmlFor={textAreaId} 
            className={cn(
              `block font-medium mb-2 transition-colors duration-200 ${currentSize.labelText}`,
              isError ? "text-red-700" : 
              isSuccess ? "text-green-700" : 
              isActive ? "text-indigo-700" : "text-gray-700"
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative group">
          {/* TextArea Field */}
          <textarea
            id={textAreaId}
            ref={ref}
            disabled={disabled}
            placeholder={placeholder}
            value={value}
            defaultValue={defaultValue}
            maxLength={maxLength}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            className={cn(
              getVariantClasses(),
              getResizeClasses(),
              className
            )}
            {...props}
          />

          {/* Status Icons */}
          {(isSuccess || isError) && (
            <div className="absolute top-3 right-3 pointer-events-none">
              {isSuccess && !error && (
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
              )}
              {isError && (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              )}
            </div>
          )}

          {/* Focus Ring Animation */}
          <div className={cn(
            "absolute inset-0 rounded-lg pointer-events-none transition-opacity duration-200",
            isActive && !isError && !isSuccess && variant === 'default' && "ring-2 ring-indigo-500/20"
          )} />
        </div>

        {/* Character Count */}
        {(showCharCount || maxLength) && (
          <div className="flex justify-end mt-1">
            <span className={cn(
              "text-xs transition-colors duration-200",
              maxLength && charCount > maxLength * 0.9 
                ? charCount >= maxLength 
                  ? "text-red-600 font-medium" 
                  : "text-yellow-600"
                : "text-gray-500"
            )}>
              {showCharCount && `${charCount}`}
              {maxLength && `${showCharCount ? '/' : ''}${maxLength}`}
            </span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-2 flex items-start space-x-2">
            <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600 leading-5">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {isSuccess && typeof success === 'string' && (
          <div className="mt-2 flex items-start space-x-2">
            <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-600 leading-5">{success}</p>
          </div>
        )}

        {/* Helper Text */}
        {helperText && !error && !isSuccess && (
          <p className="mt-2 text-sm text-gray-500 leading-5">{helperText}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export { TextArea };