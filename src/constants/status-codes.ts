export enum HttpStatusCode {
  // Success
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,

  // Client Errors
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,

  // Server Errors
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

export enum ErrorCode {
  // Validation Errors
  VALIDATION_ERROR = 'validation_error',
  INVALID_INPUT = 'invalid_input',
  MISSING_REQUIRED_FIELD = 'missing_required_field',

  // Authentication Errors
  UNAUTHORIZED = 'unauthorized',
  INVALID_TOKEN = 'invalid_token',
  TOKEN_EXPIRED = 'token_expired',
  INVALID_CREDENTIALS = 'invalid_credentials',
  USER_NOT_FOUND = 'user_not_found',
  INVALID_PASSWORD = 'invalid_password',
  OTP_VERIFICATION_REQUIRED = 'otp_verification_required',

  // Authorization Errors
  FORBIDDEN = 'forbidden',
  INSUFFICIENT_PERMISSIONS = 'insufficient_permissions',

  // Resource Errors
  NOT_FOUND = 'not_found',
  ALREADY_EXISTS = 'already_exists',
  CONFLICT = 'conflict',

  // Business Logic Errors
  OPERATION_FAILED = 'operation_failed',
  INVALID_OPERATION = 'invalid_operation',
  RESOURCE_LOCKED = 'resource_locked',

  // System Errors
  INTERNAL_ERROR = 'internal_error',
  DATABASE_ERROR = 'database_error',
  EXTERNAL_SERVICE_ERROR = 'external_service_error',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',

  // Unknown Error
  UNKNOWN_ERROR = 'unknown_error',
}
