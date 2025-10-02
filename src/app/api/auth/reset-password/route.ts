import { NextRequest } from 'next/server';
import { ensureDatabaseConnection } from '@/helpers/database';
import { validateEmail, validatePassword } from '@/helpers/validation';
import { createSuccessResponse, createErrorResponse, createNotFoundResponse, withErrorHandling } from '@/helpers/response';
import { UserService } from '@/services/user.service';
import { HttpStatusCode, ErrorCode } from '@/constants/status-codes';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/constants/messages';
import prisma from '@/lib/prisma';

export const POST = withErrorHandling(async (request: NextRequest) => {
  await ensureDatabaseConnection();
  
  const { email, password, resetToken } = await request.json();

  if (!email || !password) {
    return createErrorResponse(
      ErrorCode.MISSING_REQUIRED_FIELD,
      'Email and password are required',
      { statusCode: HttpStatusCode.BAD_REQUEST }
    );
  }

  if (!validateEmail(email)) {
    return createErrorResponse(
      ErrorCode.VALIDATION_ERROR,
      ERROR_MESSAGES.INVALID_EMAIL,
      { statusCode: HttpStatusCode.BAD_REQUEST }
    );
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return createErrorResponse(
      ErrorCode.VALIDATION_ERROR,
      passwordValidation.errors[0],
      { statusCode: HttpStatusCode.BAD_REQUEST }
    );
  }

  const user = await prisma.user.findUnique({ 
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      passwordResetOtp: true,
      passwordResetOtpExpiry: true,
      resetToken: true,
      resetTokenExpiry: true
    }
  });

  if (!user) {
    return createNotFoundResponse(ERROR_MESSAGES.USER_NOT_FOUND);
  }

  if (resetToken) {
    if (!user.resetToken || user.resetToken !== resetToken) {
      return createErrorResponse(
        ErrorCode.INVALID_TOKEN,
        'Invalid reset token',
        { statusCode: HttpStatusCode.BAD_REQUEST }
      );
    }

    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return createErrorResponse(
        ErrorCode.TOKEN_EXPIRED,
        'Reset token has expired',
        { statusCode: HttpStatusCode.BAD_REQUEST }
      );
    }
  } else {
    if (user.passwordResetOtp && user.passwordResetOtp.trim() !== '') {
      return createErrorResponse(
        ErrorCode.OTP_VERIFICATION_REQUIRED,
        'OTP verification required before password reset',
        { statusCode: HttpStatusCode.BAD_REQUEST }
      );
    }
  }

  const result = await UserService.resetPassword(user.id, password);

  if (!result.success) {
    return createErrorResponse(
      ErrorCode.OPERATION_FAILED,
      result.error!,
      { statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetOtp: null,
      passwordResetOtpExpiry: null,
      resetToken: null,
      resetTokenExpiry: null,
    }
  });

  return createSuccessResponse(null, {
    message: SUCCESS_MESSAGES.PASSWORD_RESET_SUCCESS,
  });
});
