import { NextRequest, NextResponse } from "next/server";
import { ensureDatabaseConnection } from "@/helpers/database";
import { verifyRefreshToken, generateToken } from "@/helpers/auth";
import { createErrorResponse, withErrorHandling } from "@/helpers/response";
import { HttpStatusCode, ErrorCode } from "@/constants/status-codes";
import { ERROR_MESSAGES } from "@/constants/messages";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withErrorHandling(async (request: NextRequest) => {
  await ensureDatabaseConnection();

  const refreshToken = request.cookies.get("refresh_token")?.value;
  if (!refreshToken) {
    return createErrorResponse(
      ErrorCode.UNAUTHORIZED,
      "No refresh token provided",
      { statusCode: HttpStatusCode.UNAUTHORIZED }
    );
  }

  const tokenResult = verifyRefreshToken(refreshToken);
  if (!tokenResult.success) {
    return createErrorResponse(
      tokenResult.error,
      tokenResult.error === ErrorCode.TOKEN_EXPIRED 
        ? ERROR_MESSAGES.TOKEN_EXPIRED 
        : ERROR_MESSAGES.INVALID_TOKEN,
      { statusCode: HttpStatusCode.UNAUTHORIZED }
    );
  }

  const dbToken = await prisma.refreshToken.findFirst({ 
    where: { token: refreshToken },
    include: { user: { select: { id: true, email: true } } }
  });

  if (!dbToken || dbToken.expiresAt < new Date()) {
    return createErrorResponse(
      ErrorCode.TOKEN_EXPIRED,
      "Refresh token not found or expired",
      { statusCode: HttpStatusCode.UNAUTHORIZED }
    );
  }

  const accessToken = generateToken(dbToken.userId, dbToken.user.email);

  const response = NextResponse.json({
    success: true,
    data: null,
    message: "Access token refreshed successfully",
  });

  response.cookies.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60,
    path: "/",
  });

  return response;
});


