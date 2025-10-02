import { NextRequest, NextResponse } from "next/server";
import { ensureDatabaseConnection } from "@/helpers/database";
import { createErrorResponse, createValidationErrorResponse, withErrorHandling } from "@/helpers/response";
import { UserService } from "@/services/user.service";
import { HttpStatusCode, ErrorCode } from "@/constants/status-codes";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "@/constants/messages";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withErrorHandling(async (request: NextRequest) => {
  await ensureDatabaseConnection();
  
  const body = await request.json();
  const { email, password } = body ?? {};

  const fieldErrors: Record<string, string> = {};
  if (!email) fieldErrors.email = "Email is required";
  else if (!/^\S+@\S+\.\S+$/.test(email)) fieldErrors.email = "Email is invalid";
  if (!password) fieldErrors.password = "Password is required";
  
  if (Object.keys(fieldErrors).length > 0) {
    return createValidationErrorResponse(fieldErrors, ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  const result = await UserService.loginUser({ emailOrPhone: email, password });

  if (!result.success) {
    return createErrorResponse(
      result.error!.code,
      result.error!.message,
      {
        statusCode: result.error!.code === ErrorCode.USER_NOT_FOUND 
          ? HttpStatusCode.NOT_FOUND 
          : HttpStatusCode.UNAUTHORIZED,
      }
    );
  }

  const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: {
      token: result.refreshToken!,
      userId: result.user!.id,
      expiresAt: refreshTokenExpiry,
    }
  });

  const response = NextResponse.json({
    success: true,
    data: {
      user: result.user,
    },
    message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
  });

  response.cookies.set("access_token", result.accessToken!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60,
    path: "/",
  });
  
  response.cookies.set("refresh_token", result.refreshToken!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return response;
});
