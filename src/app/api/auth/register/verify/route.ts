import { NextRequest, NextResponse } from "next/server";
import { ensureDatabaseConnection } from "@/helpers/database";
import { validateRegistrationData } from "@/helpers/validation";
import { generateToken, generateRefreshToken } from "@/helpers/auth";
import { createErrorResponse, createValidationErrorResponse, createNotFoundResponse, withErrorHandling } from "@/helpers/response";
import { UserService } from "@/services/user.service";
import { HttpStatusCode, ErrorCode } from "@/constants/status-codes";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "@/constants/messages";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withErrorHandling(async (request: NextRequest) => {
  await ensureDatabaseConnection();
  
  const body = await request.json();
  const { firstName, lastName, phone, email, dateOfBirth, password, otp } = body ?? {};

  const validation = validateRegistrationData({
    firstName,
    lastName,
    phone,
    email,
    dateOfBirth,
    password,
  });

  if (!otp) {
    validation.errors.push({
      field: 'otp',
      code: ErrorCode.MISSING_REQUIRED_FIELD,
      message: 'OTP is required',
    });
    validation.isValid = false;
  }

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

  const verification = await prisma.emailVerification.findUnique({ where: { email } });
  if (!verification) {
    return createNotFoundResponse('No OTP request found for this email');
  }

  if (verification.expiresAt.getTime() < Date.now()) {
    return createErrorResponse(
      ErrorCode.TOKEN_EXPIRED,
      'OTP has expired',
      { statusCode: HttpStatusCode.BAD_REQUEST }
    );
  }

  if (verification.otp !== otp) {
    await prisma.emailVerification.update({ 
      where: { email }, 
      data: { attempts: { increment: 1 } } 
    });
    
    return createErrorResponse(
      ErrorCode.INVALID_TOKEN,
      'Invalid OTP',
      { statusCode: HttpStatusCode.BAD_REQUEST }
    );
  }

  await prisma.emailVerification.delete({ where: { email } });

  const result = await UserService.registerUser({
    firstName,
    lastName,
    phone,
    email,
    dateOfBirth,
    password,
  });

  if (!result.success) {
    const validationDetails: Record<string, string> = {};
    result.errors?.forEach(error => {
      validationDetails[error.field] = error.message;
    });

    return createErrorResponse(
      ErrorCode.CONFLICT,
      ERROR_MESSAGES.REGISTRATION_FAILED,
      {
        statusCode: HttpStatusCode.CONFLICT,
        details: validationDetails,
      }
    );
  }

  const accessToken = generateToken(result.user!.id, result.user!.email);
  const refreshToken = generateRefreshToken(result.user!.id);
  const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({ 
    data: { 
      token: refreshToken, 
      userId: result.user!.id, 
      expiresAt: refreshTokenExpiry 
    } 
  });

  const response = NextResponse.json({
    success: true,
    data: {
      user: result.user,
    },
    message: SUCCESS_MESSAGES.REGISTRATION_SUCCESS,
  }, { status: HttpStatusCode.CREATED });

  response.cookies.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60,
    path: "/",
  });
  
  response.cookies.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  
  return response;
});


