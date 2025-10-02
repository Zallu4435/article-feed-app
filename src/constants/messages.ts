/**
 * Common Messages Constants
 * Centralized messages for consistent user communication
 */

export const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logged out successfully',
  REGISTRATION_SUCCESS: 'Registration successful!',
  PASSWORD_CHANGED: 'Password changed successfully',
  PASSWORD_RESET_SENT: 'Password reset instructions sent to your email',
  PASSWORD_RESET_SUCCESS: 'Password reset successfully',
  EMAIL_VERIFIED: 'Email verified successfully',
  OTP_SENT: 'Verification code sent to your email',

  // User Management
  PROFILE_UPDATED: 'Profile updated successfully',
  PREFERENCES_UPDATED: 'Preferences updated successfully',
  AVATAR_UPLOADED: 'Profile picture uploaded successfully',

  // Articles
  ARTICLE_CREATED: 'Article created successfully',
  ARTICLE_UPDATED: 'Article updated successfully',
  ARTICLE_DELETED: 'Article deleted successfully',
  ARTICLES_BULK_DELETED: 'Articles deleted successfully',
  ARTICLE_LIKED: 'Article liked',
  ARTICLE_UNLIKED: 'Article unliked',
  ARTICLE_BOOKMARKED: 'Article bookmarked',
  ARTICLE_UNBOOKMARKED: 'Article removed from bookmarks',

  // Categories
  CATEGORY_CREATED: 'Category created successfully',
  CATEGORY_UPDATED: 'Category updated successfully',
  CATEGORY_DELETED: 'Category deleted successfully',

  // File Upload
  FILE_UPLOADED: 'File uploaded successfully',
  IMAGE_UPLOADED: 'Image uploaded successfully',

  // General
  OPERATION_SUCCESS: 'Operation completed successfully',
  DATA_SAVED: 'Data saved successfully',
  CHANGES_SAVED: 'Changes saved successfully',
} as const;

export const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email/phone or password',
  USER_NOT_FOUND: 'No account found with this email/phone',
  INVALID_PASSWORD: 'Incorrect password',
  UNAUTHORIZED: 'You are not authorized to access this resource',
  TOKEN_EXPIRED: 'Your session has expired. Please login again',
  INVALID_TOKEN: 'Invalid authentication token',
  EMAIL_NOT_VERIFIED: 'Please verify your email before logging in',
  ACCOUNT_LOCKED: 'Your account has been temporarily locked',

  // Registration
  EMAIL_ALREADY_EXISTS: 'Email already in use',
  PHONE_ALREADY_EXISTS: 'Phone number already in use',
  WEAK_PASSWORD: 'Password must be at least 8 characters long',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  REGISTRATION_FAILED: 'Registration failed. Please try again',

  // Validation
  REQUIRED_FIELD: 'This field is required',
  INVALID_FORMAT: 'Invalid format',
  INVALID_UUID: 'Invalid ID format',
  INVALID_DATE: 'Invalid date format',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit',
  INVALID_FILE_TYPE: 'Invalid file type',

  // Articles
  ARTICLE_NOT_FOUND: 'Article not found',
  ARTICLE_ACCESS_DENIED: 'You do not have permission to access this article',
  ARTICLE_CREATION_FAILED: 'Failed to create article',
  ARTICLE_UPDATE_FAILED: 'Failed to update article',
  ARTICLE_DELETE_FAILED: 'Failed to delete article',
  INVALID_ARTICLE_DATA: 'Invalid article data provided',

  // Categories
  CATEGORY_NOT_FOUND: 'Category not found',
  CATEGORY_ALREADY_EXISTS: 'Category already exists',
  CATEGORY_IN_USE: 'Cannot delete category as it is being used by articles',

  // User Management
  PROFILE_UPDATE_FAILED: 'Failed to update profile',
  PREFERENCES_UPDATE_FAILED: 'Failed to update preferences',
  AVATAR_UPLOAD_FAILED: 'Failed to upload profile picture',
  PASSWORD_CHANGE_FAILED: 'Failed to change password',
  CURRENT_PASSWORD_INCORRECT: 'Current password is incorrect',

  // File Upload
  UPLOAD_FAILED: 'File upload failed',
  INVALID_IMAGE: 'Please upload a valid image file',
  IMAGE_PROCESSING_FAILED: 'Failed to process image',

  // Database
  DATABASE_ERROR: 'Database operation failed',
  CONNECTION_ERROR: 'Database connection error',
  TRANSACTION_FAILED: 'Transaction failed',

  // Network
  NETWORK_ERROR: 'Network error occurred',
  REQUEST_TIMEOUT: 'Request timeout',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later',
  DAILY_LIMIT_EXCEEDED: 'Daily limit exceeded',

  // General
  INTERNAL_SERVER_ERROR: 'Internal server error',
  OPERATION_FAILED: 'Operation failed',
  UNKNOWN_ERROR: 'An unknown error occurred',
  MAINTENANCE_MODE: 'System is under maintenance. Please try again later',
  FEATURE_DISABLED: 'This feature is currently disabled',
} as const;

export const VALIDATION_MESSAGES = {
  // Common field validations
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_URL: 'Please enter a valid URL',
  INVALID_DATE: 'Please enter a valid date',
  
  // String validations
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters long`,
  MAX_LENGTH: (max: number) => `Must be no more than ${max} characters long`,
  EXACT_LENGTH: (length: number) => `Must be exactly ${length} characters long`,
  
  // Number validations
  MIN_VALUE: (min: number) => `Must be at least ${min}`,
  MAX_VALUE: (max: number) => `Must be no more than ${max}`,
  POSITIVE_NUMBER: 'Must be a positive number',
  
  // Password validations
  PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters long',
  PASSWORD_COMPLEXITY: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
  
  // File validations
  FILE_REQUIRED: 'Please select a file',
  FILE_TOO_LARGE: (maxSize: string) => `File size must be less than ${maxSize}`,
  INVALID_FILE_TYPE: (allowedTypes: string) => `Only ${allowedTypes} files are allowed`,
  
  // Custom validations
  INVALID_UUID: 'Must be a valid UUID',
  INVALID_SLUG: 'Must be a valid URL slug (lowercase letters, numbers, and hyphens only)',
  FUTURE_DATE_REQUIRED: 'Date must be in the future',
  PAST_DATE_REQUIRED: 'Date must be in the past',
} as const;

export const CONFIRMATION_MESSAGES = {
  DELETE_ARTICLE: 'Are you sure you want to delete this article? This action cannot be undone.',
  DELETE_ARTICLES: (count: number) => `Are you sure you want to delete ${count} article${count > 1 ? 's' : ''}? This action cannot be undone.`,
  DELETE_CATEGORY: 'Are you sure you want to delete this category? This action cannot be undone.',
  DELETE_ACCOUNT: 'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
  LOGOUT: 'Are you sure you want to logout?',
  DISCARD_CHANGES: 'Are you sure you want to discard your changes?',
  RESET_PREFERENCES: 'Are you sure you want to reset all preferences to default values?',
} as const;

export const INFO_MESSAGES = {
  LOADING: 'Loading...',
  SAVING: 'Saving...',
  UPLOADING: 'Uploading...',
  PROCESSING: 'Processing...',
  DELETING: 'Deleting...',
  SENDING: 'Sending...',
  
  NO_DATA: 'No data available',
  NO_ARTICLES: 'No articles found',
  NO_CATEGORIES: 'No categories found',
  NO_RESULTS: 'No results found',
  
  EMPTY_STATE_ARTICLES: 'You haven\'t created any articles yet. Create your first article to get started!',
  EMPTY_STATE_BOOKMARKS: 'You haven\'t bookmarked any articles yet.',
  EMPTY_STATE_SEARCH: 'No articles match your search criteria. Try different keywords.',
  
  MAINTENANCE_MODE: 'The system is currently under maintenance. We\'ll be back shortly.',
  FEATURE_COMING_SOON: 'This feature is coming soon!',
  BETA_FEATURE: 'This is a beta feature. Your feedback is appreciated!',
} as const;
