import { NextRequest } from "next/server";
import { ensureDatabaseConnection } from "@/helpers/database";
import { createSuccessResponse, createErrorResponse, createValidationErrorResponse, withErrorHandling } from "@/helpers/response";
import { validateRegistrationData } from "@/helpers/validation";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "@/constants/messages";
import { HttpStatusCode, ErrorCode } from "@/constants/status-codes";
import { generateOtp, sendOtpEmail } from "@/lib/email";
import { UserService } from "@/services/user.service";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withErrorHandling(async (request: NextRequest) => {
  await ensureDatabaseConnection();
  
  const body = await request.json();
  const { firstName, lastName, phone, email, dateOfBirth, password } = body ?? {};

  const validation = validateRegistrationData({
    firstName,
    lastName,
    phone,
    email,
    dateOfBirth,
    password,
  });

  if (!validation.isValid) {
    const validationDetails: Record<string, string> = {};
    validation.errors.forEach(error => {
      validationDetails[error.field] = error.message;
    });

    return createValidationErrorResponse(
      validationDetails,
      ERROR_MESSAGES.REGISTRATION_FAILED
    );
  }

  const existingCheck = await UserService.checkExistingUser(email, phone);
  
  if (existingCheck.exists) {
    return createErrorResponse(
      ErrorCode.CONFLICT,
      'Account already exists with this email or phone',
      {
        statusCode: HttpStatusCode.CONFLICT,
        details: existingCheck.conflicts,
      }
    );
  }

    const otp = generateOtp(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 

    const existingVerification = await prisma.emailVerification.findUnique({ where: { email } });
    if (existingVerification) {
      await prisma.emailVerification.update({ where: { email }, data: { otp, expiresAt, attempts: 0 } });
    } else {
      await prisma.emailVerification.create({ data: { email, otp, expiresAt } });
    }

    await sendOtpEmail(email, otp);

    return createSuccessResponse(null, {
      message: SUCCESS_MESSAGES.OTP_SENT,
    });
});
