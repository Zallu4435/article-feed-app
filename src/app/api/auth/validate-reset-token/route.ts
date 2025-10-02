import { NextRequest } from 'next/server';
import { ensureDatabaseConnection } from '@/helpers/database';
import { createSuccessResponse, createErrorResponse, withErrorHandling } from '@/helpers/response';
import { HttpStatusCode, ErrorCode } from '@/constants/status-codes';
import { ERROR_MESSAGES } from '@/constants/messages';
import prisma from '@/lib/prisma';

export const GET = withErrorHandling(async (request: NextRequest) => {
  await ensureDatabaseConnection();
  
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return createErrorResponse(
      ErrorCode.MISSING_REQUIRED_FIELD,
      'Reset token is required',
      { statusCode: HttpStatusCode.BAD_REQUEST }
    );
  }

  if (!token.trim() || token.length < 10) {
    return createErrorResponse(
      ErrorCode.VALIDATION_ERROR,
      'Invalid token format',
      { statusCode: HttpStatusCode.BAD_REQUEST }
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() }
    },
    select: {
      id: true,
      email: true,
      resetToken: true,
      resetTokenExpiry: true
    }
  });

  if (!user) {
    return createErrorResponse(
      ErrorCode.TOKEN_EXPIRED,
      ERROR_MESSAGES.INVALID_TOKEN,
      { statusCode: HttpStatusCode.BAD_REQUEST }
    );
  }

  const tokenAge = Date.now() - (user.resetTokenExpiry!.getTime() - (10 * 60 * 1000));
  const maxTokenAge = 30 * 60 * 1000; 

  if (tokenAge > maxTokenAge) {
    return createErrorResponse(
      ErrorCode.TOKEN_EXPIRED,
      'Reset token has expired',
      { statusCode: HttpStatusCode.BAD_REQUEST }
    );
  }

  return createSuccessResponse({
    tokenValid: true,
    email: user.email,
    expiresAt: user.resetTokenExpiry
  }, {
    message: 'Reset token is valid',
  });
});
