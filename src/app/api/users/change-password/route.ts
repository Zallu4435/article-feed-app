import { NextRequest } from 'next/server';
import { ensureDatabaseConnection } from '@/helpers/database';
import { authenticateRequest } from '@/helpers/auth';
import { validatePassword } from '@/helpers/validation';
import { createSuccessResponse, createErrorResponse, withErrorHandling } from '@/helpers/response';
import { UserService } from '@/services/user.service';
import { HttpStatusCode, ErrorCode } from '@/constants/status-codes';
import { SUCCESS_MESSAGES } from '@/constants/messages';

export const runtime = 'nodejs';

export const POST = withErrorHandling(async (request: NextRequest) => {
  await ensureDatabaseConnection();
  
  const authResult = authenticateRequest(request);
  if (!authResult.success) {
    return createErrorResponse(
      authResult.error!.code,
      authResult.error!.message,
      { statusCode: authResult.error!.statusCode }
    );
  }

  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword) {
    return createErrorResponse(
      ErrorCode.MISSING_REQUIRED_FIELD,
      'Current password and new password are required',
      { statusCode: HttpStatusCode.BAD_REQUEST }
    );
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    return createErrorResponse(
      ErrorCode.VALIDATION_ERROR,
      passwordValidation.errors[0],
      { statusCode: HttpStatusCode.BAD_REQUEST }
    );
  }

  if (newPassword === currentPassword) {
    return createErrorResponse(
      ErrorCode.VALIDATION_ERROR,
      'New password must be different from current password',
      { statusCode: HttpStatusCode.BAD_REQUEST }
    );
  }

  const result = await UserService.changePassword(
    authResult.userId!,
    currentPassword,
    newPassword
  );

  if (!result.success) {
    const statusCode = result.error?.includes('incorrect') 
      ? HttpStatusCode.BAD_REQUEST 
      : HttpStatusCode.INTERNAL_SERVER_ERROR;
    
    return createErrorResponse(
      ErrorCode.OPERATION_FAILED,
      result.error!,
      { statusCode }
    );
  }

  return createSuccessResponse(null, {
    message: SUCCESS_MESSAGES.PASSWORD_CHANGED,
  });
});
