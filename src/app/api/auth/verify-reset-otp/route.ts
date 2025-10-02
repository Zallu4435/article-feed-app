import { NextRequest } from 'next/server';
import { ensureDatabaseConnection } from '@/helpers/database';
import { validateEmail, validateOtp } from '@/helpers/validation';
import { createSuccessResponse, createErrorResponse, withErrorHandling } from '@/helpers/response';
import { HttpStatusCode, ErrorCode } from '@/constants/status-codes';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/constants/messages';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export const POST = withErrorHandling(async (request: NextRequest) => {
  await ensureDatabaseConnection();
  
  const { email, otp } = await request.json();

  if (!email || !otp) {
    return createErrorResponse(
      ErrorCode.MISSING_REQUIRED_FIELD,
      'Email and OTP are required',
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

  if (!validateOtp(otp)) {
    return createErrorResponse(
      ErrorCode.VALIDATION_ERROR,
      'Please enter a valid 6-digit verification code',
      { statusCode: HttpStatusCode.BAD_REQUEST }
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      email: email.toLowerCase(),
      passwordResetOtp: otp,
      passwordResetOtpExpiry: { gt: new Date() }
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      passwordResetOtp: true,
      passwordResetOtpExpiry: true
    }
  });

  if (!user) {
    return createErrorResponse(
      ErrorCode.INVALID_TOKEN,
      ERROR_MESSAGES.INVALID_TOKEN,
      { statusCode: HttpStatusCode.BAD_REQUEST }
    );
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); 

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetOtp: null,
      passwordResetOtpExpiry: null,
      resetToken: resetToken,
      resetTokenExpiry: resetTokenExpiry,
    }
  });

  return createSuccessResponse({
    verified: true,
    resetToken: resetToken,
    email: user.email,
    expiresAt: resetTokenExpiry
  }, {
    message: SUCCESS_MESSAGES.EMAIL_VERIFIED,
  });
});
