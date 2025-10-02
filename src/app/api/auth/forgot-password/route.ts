import { NextRequest } from 'next/server';
import { ensureDatabaseConnection } from '@/helpers/database';
import { validateEmail } from '@/helpers/validation';
import { createSuccessResponse, createErrorResponse, createNotFoundResponse, withErrorHandling } from '@/helpers/response';
import { HttpStatusCode, ErrorCode } from '@/constants/status-codes';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/constants/messages';
import { sendOtpEmail, generateOtp } from '@/lib/email';
import prisma from '@/lib/prisma';

export const POST = withErrorHandling(async (request: NextRequest) => {
  await ensureDatabaseConnection();
  
  const { email } = await request.json();

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
    select: { id: true, email: true, firstName: true }
  });

  if (!user) {
    return createErrorResponse(
      ErrorCode.USER_NOT_FOUND,
      ERROR_MESSAGES.USER_NOT_FOUND,
      { statusCode: HttpStatusCode.NOT_FOUND }
    );
  }

    const otp = generateOtp(6);
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetOtp: otp,
      passwordResetOtpExpiry: otpExpiry,
    }
  });

  await sendOtpEmail(user.email, otp);

  return createSuccessResponse(null, {
    message: SUCCESS_MESSAGES.PASSWORD_RESET_SENT,
  });
});
