import { ErrorCode } from '@/constants/status-codes';
import { VALIDATION_MESSAGES } from '@/constants/messages';

export interface ValidationError {
  field: string;
  code: ErrorCode;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}


export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}


export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}


export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push(VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH);
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}


export function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(id);
}


export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}


export function validateDate(dateString: string, options?: { 
  minDate?: Date; 
  maxDate?: Date; 
  futureOnly?: boolean; 
  pastOnly?: boolean; 
}): boolean {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return false;
  }
  
  const now = new Date();
  
  if (options?.futureOnly && date <= now) {
    return false;
  }
  
  if (options?.pastOnly && date >= now) {
    return false;
  }
  
  if (options?.minDate && date < options.minDate) {
    return false;
  }
  
  if (options?.maxDate && date > options.maxDate) {
    return false;
  }
  
  return true;
}


export function validateStringLength(
  value: string, 
  options: { min?: number; max?: number; exact?: number }
): boolean {
  if (options.exact !== undefined) {
    return value.length === options.exact;
  }
  
  if (options.min !== undefined && value.length < options.min) {
    return false;
  }
  
  if (options.max !== undefined && value.length > options.max) {
    return false;
  }
  
  return true;
}


export function validateNumberRange(
  value: number, 
  options: { min?: number; max?: number; integer?: boolean }
): boolean {
  if (options.integer && !Number.isInteger(value)) {
    return false;
  }
  
  if (options.min !== undefined && value < options.min) {
    return false;
  }
  
  if (options.max !== undefined && value > options.max) {
    return false;
  }
  
  return true;
}


export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}


export function validateFileSize(file: File, maxSizeInBytes: number): boolean {
  return file.size <= maxSizeInBytes;
}


export function validateArticleData(data: {
  title?: string;
  description?: string;
  content?: string;
  categoryId?: string;
  tags?: string[];
  imageUrl?: string;
}): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!data.title) {
    errors.push({
      field: 'title',
      code: ErrorCode.MISSING_REQUIRED_FIELD,
      message: 'Title is required',
    });
  } else if (!validateStringLength(data.title, { min: 1, max: 200 })) {
    errors.push({
      field: 'title',
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Title must be between 1 and 200 characters',
    });
  }
  
  if (!data.description) {
    errors.push({
      field: 'description',
      code: ErrorCode.MISSING_REQUIRED_FIELD,
      message: 'Description is required',
    });
  } else if (!validateStringLength(data.description, { min: 1, max: 500 })) {
    errors.push({
      field: 'description',
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Description must be between 1 and 500 characters',
    });
  }
  
  if (!data.content) {
    errors.push({
      field: 'content',
      code: ErrorCode.MISSING_REQUIRED_FIELD,
      message: 'Content is required',
    });
  } else if (!validateStringLength(data.content, { min: 1 })) {
    errors.push({
      field: 'content',
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Content cannot be empty',
    });
  }
  
  if (!data.categoryId) {
    errors.push({
      field: 'categoryId',
      code: ErrorCode.MISSING_REQUIRED_FIELD,
      message: 'Category is required',
    });
  } else if (!validateUUID(data.categoryId)) {
    errors.push({
      field: 'categoryId',
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Invalid category ID format',
    });
  }
  
  if (data.imageUrl && !validateURL(data.imageUrl)) {
    errors.push({
      field: 'imageUrl',
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Invalid image URL format',
    });
  }
  
  if (data.tags && data.tags.length > 10) {
    errors.push({
      field: 'tags',
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Maximum 10 tags allowed',
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}


export function validateRegistrationData(data: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  dateOfBirth?: string;
}): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!data.firstName) {
    errors.push({
      field: 'firstName',
      code: ErrorCode.MISSING_REQUIRED_FIELD,
      message: 'First name is required',
    });
  } else if (!validateStringLength(data.firstName, { min: 1, max: 50 })) {
    errors.push({
      field: 'firstName',
      code: ErrorCode.VALIDATION_ERROR,
      message: 'First name must be between 1 and 50 characters',
    });
  }
  
  if (!data.lastName) {
    errors.push({
      field: 'lastName',
      code: ErrorCode.MISSING_REQUIRED_FIELD,
      message: 'Last name is required',
    });
  } else if (!validateStringLength(data.lastName, { min: 1, max: 50 })) {
    errors.push({
      field: 'lastName',
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Last name must be between 1 and 50 characters',
    });
  }
  
  if (!data.email) {
    errors.push({
      field: 'email',
      code: ErrorCode.MISSING_REQUIRED_FIELD,
      message: 'Email is required',
    });
  } else if (!validateEmail(data.email)) {
    errors.push({
      field: 'email',
      code: ErrorCode.VALIDATION_ERROR,
      message: VALIDATION_MESSAGES.INVALID_EMAIL,
    });
  }
  
  if (!data.phone) {
    errors.push({
      field: 'phone',
      code: ErrorCode.MISSING_REQUIRED_FIELD,
      message: 'Phone is required',
    });
  } else if (!validatePhone(data.phone)) {
    errors.push({
      field: 'phone',
      code: ErrorCode.VALIDATION_ERROR,
      message: VALIDATION_MESSAGES.INVALID_PHONE,
    });
  }
  
  if (!data.password) {
    errors.push({
      field: 'password',
      code: ErrorCode.MISSING_REQUIRED_FIELD,
      message: 'Password is required',
    });
  } else {
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
      errors.push({
        field: 'password',
        code: ErrorCode.VALIDATION_ERROR,
        message: passwordValidation.errors[0], 
      });
    }
  }
  
  if (!data.dateOfBirth) {
    errors.push({
      field: 'dateOfBirth',
      code: ErrorCode.MISSING_REQUIRED_FIELD,
      message: 'Date of birth is required',
    });
  } else if (!validateDate(data.dateOfBirth, { pastOnly: true })) {
    errors.push({
      field: 'dateOfBirth',
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Invalid date of birth',
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}


export function validateOtp(otp: string): boolean {
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(otp);
}


export function sanitizeString(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}


export function sanitizeHTML(html: string): string {

  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '');
}
