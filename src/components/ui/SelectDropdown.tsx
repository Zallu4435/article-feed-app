import React from 'react';
import { cn } from '@/lib/utils';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ChevronDownIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
import type { Option, SelectDropdownProps } from '@/types/ui';

interface EnhancedSelectProps extends Omit<SelectDropdownProps, 'onChange'> {
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

const SelectDropdown: React.FC<EnhancedSelectProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder = "Select an option...",
  disabled,
  error,
  helperText,
  success,
  required,
  variant = 'default',
  size = 'default',
  clearable = false,
  searchable = false,
  multiple = false,
  loading = false,
  leftIcon,
  onClear,
  onSearch,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isFocused, setIsFocused] = React.useState(false);
  const selectRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  React.useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;
    return options.filter(option =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.value.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  // Get selected option(s) for display
  const getSelectedOptions = () => {
    if (multiple && Array.isArray(value)) {
      return options.filter(option => value.includes(option.value));
    }
    return options.filter(option => option.value === value);
  };

  const selectedOptions = getSelectedOptions();

  // Handle option selection
  const handleOptionSelect = (optionValue: string) => {
    if (multiple) {
      const currentValues: string[] = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue];
      onChange?.(newValues);
    } else {
      onChange?.(optionValue);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  // Handle clear
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(multiple ? [] : '');
    onClear?.();
    setSearchQuery('');
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  // Determine states for styling
  const isError = !!error;
  const isSuccess = success && !isError;
  const hasValue = multiple ? Array.isArray(value) && value.length > 0 : !!value;

  // Size configurations
  const sizeConfig = {
    sm: {
      padding: 'px-3 py-2',
      text: 'text-xs',
      height: 'h-9',
      labelText: 'text-xs',
    },
    default: {
      padding: 'px-3 py-2.5',
      text: 'text-sm',
      height: 'h-10',
      labelText: 'text-sm',
    },
    lg: {
      padding: 'px-4 py-3',
      text: 'text-base',
      height: 'h-12',
      labelText: 'text-sm',
    },
  };

  const currentSize = sizeConfig[size];

  // Get trigger classes based on variant
  const getTriggerClasses = () => {
    const baseClasses = `
      w-full ${currentSize.height} ${currentSize.padding} ${currentSize.text}
      rounded-lg border transition-all duration-200 cursor-pointer
      focus:outline-none focus:ring-2 focus:ring-offset-0
      disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
      flex items-center justify-between
    `;

    if (variant === 'filled') {
      return cn(baseClasses,
        'bg-gray-50 border-transparent',
        isError ? [
          'bg-red-50 text-red-900',
          'hover:bg-red-100 focus:bg-red-50 focus:ring-red-500/20'
        ] :
        isSuccess ? [
          'bg-green-50 text-green-900',
          'hover:bg-green-100 focus:bg-green-50 focus:ring-green-500/20'
        ] :
        disabled ? 'bg-gray-100' : [
          'text-gray-900 hover:bg-gray-100',
          'focus:bg-white focus:ring-indigo-500/20'
        ]
      );
    }

    if (variant === 'minimal') {
      return cn(baseClasses,
        'bg-transparent border-0 border-b-2 rounded-none px-0 h-auto pb-2',
        isError ? [
          'border-red-300 text-red-900',
          'focus:border-red-500 focus:ring-0'
        ] :
        isSuccess ? [
          'border-green-300 text-green-900',
          'focus:border-green-500 focus:ring-0'
        ] :
        disabled ? 'border-gray-200' : [
          'border-gray-300 text-gray-900',
          'hover:border-gray-400 focus:border-indigo-500 focus:ring-0'
        ]
      );
    }

    // Default variant
    return cn(baseClasses,
      isError ? [
        'border-red-300 bg-red-50/50 text-red-900',
        'hover:border-red-400 focus:border-red-500 focus:ring-red-500/20'
      ] :
      isSuccess ? [
        'border-green-300 bg-green-50/50 text-green-900',
        'hover:border-green-400 focus:border-green-500 focus:ring-green-500/20'
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

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label className={cn(
          `block font-medium mb-2 transition-colors duration-200 ${currentSize.labelText}`,
          isError ? "text-red-700" : 
          isSuccess ? "text-green-700" : 
          isFocused ? "text-indigo-700" : "text-gray-700"
        )}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative" ref={selectRef}>
        {/* Select Trigger */}
        <div
          className={getTriggerClasses()}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          tabIndex={0}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <div className="flex items-center flex-1 min-w-0">
            {/* Left Icon */}
            {leftIcon && (
              <div className="flex-shrink-0 mr-2 text-gray-400">
                <div className="w-5 h-5">{leftIcon}</div>
              </div>
            )}

            {/* Selected Value(s) */}
            <div className="flex-1 min-w-0">
              {selectedOptions.length === 0 ? (
                <span className="text-gray-500 truncate">{placeholder}</span>
              ) : multiple && selectedOptions.length > 1 ? (
                <div className="flex flex-wrap gap-1">
                  {selectedOptions.slice(0, 2).map((option) => (
                    <span
                      key={option.value}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {option.label}
                    </span>
                  ))}
                  {selectedOptions.length > 2 && (
                    <span className="text-xs text-gray-500">
                      +{selectedOptions.length - 2} more
                    </span>
                  )}
                </div>
              ) : (
                <span className="truncate">{selectedOptions[0]?.label}</span>
              )}
            </div>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
            {/* Loading Spinner */}
            {loading && (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
            )}

            {/* Clear Button */}
            {clearable && hasValue && !loading && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 hover:bg-gray-200 rounded transition-colors duration-200"
              >
                <XMarkIcon className="w-4 h-4 text-gray-400" />
              </button>
            )}

            {/* Status Icons */}
            {isSuccess && !error && !loading && (
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
            )}
            {isError && !loading && (
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
            )}

            {/* Dropdown Arrow */}
            <ChevronDownIcon className={cn(
              "w-5 h-5 text-gray-400 transition-transform duration-200",
              isOpen && "rotate-180"
            )} />
          </div>
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            {/* Backdrop: close on click to avoid blocking the page */}
            <div
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => {
                setIsOpen(false);
                setSearchQuery('');
              }}
              aria-hidden="true"
            />

            {/* Menu */}
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto" role="listbox">
              {/* Search Input */}
              {searchable && (
                <div className="p-2 border-b border-gray-100">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search options..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Options */}
              <div className="py-1">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500 text-center">
                    No options found
                  </div>
                ) : (
                  filteredOptions.map((option) => {
                    const isSelected = multiple 
                      ? Array.isArray(value) && value.includes(option.value)
                      : value === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={cn(
                          "w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 focus:outline-none focus:bg-indigo-50 transition-colors duration-200 flex items-center justify-between",
                          isSelected && "bg-indigo-100 text-indigo-900 font-medium"
                        )}
                        onClick={() => handleOptionSelect(option.value)}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span className="truncate">{option.label}</span>
                        {isSelected && multiple && (
                          <CheckCircleIcon className="w-4 h-4 text-indigo-600 flex-shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
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
};

export { SelectDropdown };