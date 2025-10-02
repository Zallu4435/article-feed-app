import { NextRequest } from "next/server";
import { ensureDatabaseConnection } from "@/helpers/database";
import { validateEmail } from "@/helpers/validation";
import { createSuccessResponse, createErrorResponse, createConflictResponse, withErrorHandling } from "@/helpers/response";
import { HttpStatusCode, ErrorCode } from "@/constants/status-codes";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "@/constants/messages";
import { generateOtp, sendOtpEmail } from "@/lib/email";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OTP_TTL_MS = 10 * 60 * 1000; 
const RESEND_COOLDOWN_MS = 60 * 1000; 

export const POST = withErrorHandling(async (request: NextRequest) => {
  await ensureDatabaseConnection();
  
  const body = await request.json();
  const { email } = body ?? {};

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

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return createConflictResponse(
      ERROR_MESSAGES.EMAIL_ALREADY_EXISTS,
      { email: "Already in use" }
    );
  }

  const existing = await prisma.emailVerification.findUnique({ where: { email } });

  if (existing) {
    const lastSentAt = new Date(existing.expiresAt.getTime() - OTP_TTL_MS);
    const now = Date.now();
    const msSinceLast = now - lastSentAt.getTime();
    
    if (msSinceLast < RESEND_COOLDOWN_MS) {
      const retryAfter = Math.ceil((RESEND_COOLDOWN_MS - msSinceLast) / 1000);
      return createErrorResponse(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
        { 
          statusCode: HttpStatusCode.TOO_MANY_REQUESTS,
          details: { retryAfter }
        }
      );
    }
  }

  const otp = generateOtp(6);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  if (existing) {
    await prisma.emailVerification.update({ 
      where: { email }, 
      data: { otp, expiresAt, attempts: 0 } 
    });
  } else {
    await prisma.emailVerification.create({ 
      data: { email, otp, expiresAt } 
    });
  }

  await sendOtpEmail(email, otp);

  return createSuccessResponse(null, {
    message: SUCCESS_MESSAGES.OTP_SENT,
  });
});


