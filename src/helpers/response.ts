import { NextResponse } from 'next/server';
import { HttpStatusCode, ErrorCode } from '@/constants/status-codes';

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp?: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    timestamp?: string;
    requestId?: string;
  };
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;


export function createSuccessResponse<T>(
  data: T,
  options?: {
    message?: string;
    statusCode?: HttpStatusCode;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(options?.message && { message: options.message }),
    meta: {
      ...(options?.pagination && { pagination: options.pagination }),
      timestamp: new Date().toISOString(),
    },
  };

  return NextResponse.json(response, {
    status: options?.statusCode || HttpStatusCode.OK,
  });
}


export function createErrorResponse(
  code: ErrorCode,
  message: string,
  options?: {
    statusCode?: HttpStatusCode;
    details?: Record<string, any>;
    requestId?: string;
  }
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(options?.details && { details: options.details }),
    },
    meta: {
      timestamp: new Date().toISOString(),
      ...(options?.requestId && { requestId: options.requestId }),
    },
  };

  return NextResponse.json(response, {
    status: options?.statusCode || HttpStatusCode.BAD_REQUEST,
  });
}


export function createValidationErrorResponse(
  details: Record<string, string>,
  message: string = 'Validation failed'
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    ErrorCode.VALIDATION_ERROR,
    message,
    {
      statusCode: HttpStatusCode.BAD_REQUEST,
      details,
    }
  );
}


export function createUnauthorizedResponse(
  message: string = 'Unauthorized access'
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    ErrorCode.UNAUTHORIZED,
    message,
    {
      statusCode: HttpStatusCode.UNAUTHORIZED,
    }
  );
}


export function createForbiddenResponse(
  message: string = 'Access forbidden'
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    ErrorCode.FORBIDDEN,
    message,
    {
      statusCode: HttpStatusCode.FORBIDDEN,
    }
  );
}


export function createNotFoundResponse(
  message: string = 'Resource not found'
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    ErrorCode.NOT_FOUND,
    message,
    {
      statusCode: HttpStatusCode.NOT_FOUND,
    }
  );
}


export function createConflictResponse(
  message: string = 'Resource conflict',
  details?: Record<string, any>
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    ErrorCode.CONFLICT,
    message,
    {
      statusCode: HttpStatusCode.CONFLICT,
      details,
    }
  );
}


export function createInternalServerErrorResponse(
  message: string = 'Internal server error'
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    ErrorCode.INTERNAL_ERROR,
    message,
    {
      statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
    }
  );
}


export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  message?: string
): NextResponse<ApiSuccessResponse<T[]>> {
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  
  return createSuccessResponse(data, {
    message,
    pagination: {
      ...pagination,
      totalPages,
    },
  });
}


export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API Error:', error);
      
      if (error instanceof Error) {

        if (error.message.includes('JWT')) {
          return createUnauthorizedResponse('Invalid or expired token');
        }
        
        if (error.message.includes('validation')) {
          return createValidationErrorResponse({}, error.message);
        }
        
        if (error.message.includes('not found')) {
          return createNotFoundResponse(error.message);
        }
        
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          return createConflictResponse('Resource already exists');
        }
      }
      
      return createInternalServerErrorResponse();
    }
  };
}


export function extractPaginationParams(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  offset: number;
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
}


export function extractSearchParams(
  searchParams: URLSearchParams,
  defaults: Record<string, any> = {}
): Record<string, any> {
  const params: Record<string, any> = { ...defaults };
  
  for (const [key, value] of searchParams.entries()) {

    if (value === 'true') {
      params[key] = true;
    } else if (value === 'false') {
      params[key] = false;
    } else if (!isNaN(Number(value)) && value !== '') {
      params[key] = Number(value);
    } else {
      params[key] = value;
    }
  }
  
  return params;
}
