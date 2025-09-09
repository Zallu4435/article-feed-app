import React from 'react';
import { cn } from '@/lib/utils';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import type { InputProps } from '@/types/ui';

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type = 'text', 
    label, 
    error, 
    leftIcon, 
    rightIcon, 
    helperText, 
    id, 
    required,
    success,
    disabled,
    placeholder,
    ...props 
  }, ref) => {
    const reactId = React.useId();
    const inputId = id || reactId;
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    const handleFocus = () => setIsFocused(true);
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(e.target.value.length > 0);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0);
      props.onChange?.(e);
    };

    React.useEffect(() => {
      if (props.value || props.defaultValue) {
        setHasValue(true);
      }
    }, [props.value, props.defaultValue]);

    // Determine input state for styling
    const isError = !!error;
    const isSuccess = success && !isError;
    const isActive = isFocused || hasValue;

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId} 
            className={cn(
              "block text-sm font-medium mb-2 transition-colors duration-200",
              isError ? "text-red-700" : 
              isSuccess ? "text-green-700" : 
              isFocused ? "text-indigo-700" : "text-gray-700"
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative group">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              <div className={cn(
                "h-5 w-5 transition-colors duration-200",
                isError ? "text-red-400" :
                isSuccess ? "text-green-400" :
                isFocused ? "text-indigo-400" : "text-gray-400"
              )}>
                {leftIcon}
              </div>
            </div>
          )}

          {/* Input Field */}
          <input
            type={type}
            id={inputId}
            ref={ref}
            disabled={disabled}
            placeholder={placeholder}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            className={cn(
              // Base styles
              "block w-full rounded-lg border transition-all duration-200 text-sm placeholder-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
              
              // Padding based on icons
              leftIcon ? "pl-10" : "pl-3",
              (rightIcon || isError || isSuccess) ? "pr-10" : "pr-3",
              
              // Height
              "py-3",
              
              // State-based styling
              isError ? [
                "border-red-300 bg-red-50/50 text-red-900 placeholder-red-400",
                "focus:border-red-500 focus:ring-red-500/20"
              ] :
              isSuccess ? [
                "border-green-300 bg-green-50/50 text-green-900",
                "focus:border-green-500 focus:ring-green-500/20"
              ] :
              disabled ? [
                "border-gray-200 bg-gray-50"
              ] : [
                "border-gray-300 bg-white text-gray-900",
                "hover:border-gray-400",
                "focus:border-indigo-500 focus:ring-indigo-500/20"
              ],
              
              // Shadow
              !disabled && "shadow-sm hover:shadow-md focus:shadow-md",
              
              className
            )}
            {...props}
          />

          {/* Right Side Icons (non-interactive). Render only when not using interactive rightIcon */}
          {!(rightIcon && (type === 'password' || rightIcon.props?.onClick)) && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {/* Success Icon */}
              {isSuccess && !rightIcon && (
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
              )}
              
              {/* Error Icon */}
              {isError && !rightIcon && (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              )}
              
              {/* Custom Right Icon */}
              {rightIcon && !isError && (
                <div className={cn(
                  "h-5 w-5 transition-colors duration-200",
                  isSuccess ? "text-green-400" :
                  isFocused ? "text-indigo-400" : "text-gray-400"
                )}>
                  {rightIcon}
                </div>
              )}
            </div>
          )}

          {/* Interactive Right Icon (clickable) */}
          {rightIcon && (type === 'password' || rightIcon.props?.onClick) && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                type="button"
                className={cn(
                  "p-1 rounded-md transition-colors duration-200",
                  "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500",
                  isError ? "text-red-400 hover:text-red-500" :
                  isSuccess ? "text-green-400 hover:text-green-500" :
                  "text-gray-400 hover:text-gray-500"
                )}
                onClick={rightIcon.props?.onClick}
              >
                <div className="h-5 w-5">
                  {rightIcon}
                </div>
              </button>
            </div>
          )}

          {/* Focus Ring Animation */}
          <div className={cn(
            "absolute inset-0 rounded-lg pointer-events-none transition-opacity duration-200",
            isFocused && !isError && !isSuccess && "ring-2 ring-indigo-500/20"
          )} />
        </div>

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

Input.displayName = 'Input';

export { Input };