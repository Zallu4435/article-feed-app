import { NextRequest } from 'next/server';
import { ensureDatabaseConnection } from '@/helpers/database';
import { validateEmail } from '@/helpers/validation';
import { createSuccessResponse, createErrorResponse, createNotFoundResponse, withErrorHandling } from '@/helpers/response';
import { HttpStatusCode, ErrorCode } from '@/constants/status-codes';
import { ERROR_MESSAGES } from '@/constants/messages';
import prisma from '@/lib/prisma';

export const GET = withErrorHandling(async (request: NextRequest) => {
  await ensureDatabaseConnection();
  
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return createErrorResponse(
      ErrorCode.MISSING_REQUIRED_FIELD,
      'Email is required',
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

  const user = await prisma.user.findUnique({ 
    where: { email: email.toLowerCase() },
    select: { 
      id: true, 
      email: true, 
      passwordResetOtp: true, 
      passwordResetOtpExpiry: true 
    }
  });

  if (!user) {
    return createNotFoundResponse(ERROR_MESSAGES.USER_NOT_FOUND);
  }

  if (user.passwordResetOtp && user.passwordResetOtp.trim() !== '') {

    if (user.passwordResetOtpExpiry && user.passwordResetOtpExpiry > new Date()) {
      return createErrorResponse(
        ErrorCode.OTP_VERIFICATION_REQUIRED,
        'OTP verification required to proceed',
        { 
          statusCode: HttpStatusCode.BAD_REQUEST,
          details: { requiresOtp: true }
        }
      );
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetOtp: null,
          passwordResetOtpExpiry: null
        }
      });
    }
  }

  return createSuccessResponse({ 
    accessGranted: true,
    email: user.email 
  }, {
    message: 'Reset password access validated successfully',
  });
});
