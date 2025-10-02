import { NextRequest, NextResponse } from "next/server";
import { ensureDatabaseConnection } from "@/helpers/database";
import { optionalAuthentication } from "@/helpers/auth";
import { withErrorHandling } from "@/helpers/response";
import { SUCCESS_MESSAGES } from "@/constants/messages";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withErrorHandling(async (request: NextRequest) => {
  await ensureDatabaseConnection();
  
  const userId = optionalAuthentication(request);
  
  if (userId) {
    await prisma.refreshToken.deleteMany({
      where: { userId }
    });
  }

  const response = NextResponse.json({
    success: true,
    data: null,
    message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
  });
  
  response.cookies.set("access_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  });
  
  response.cookies.set("refresh_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  });

  return response;
});
