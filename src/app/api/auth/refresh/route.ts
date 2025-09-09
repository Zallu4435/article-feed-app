import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase, getDatabase } from "@/lib/database";
import { RefreshToken } from "@/entities/RefreshToken";
import { User } from "@/entities/User";
import { verifyRefreshToken, generateAccessToken } from "@/lib/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const db = getDatabase();
    const refreshTokenRepository = db.getRepository(RefreshToken);
    const userRepository = db.getRepository(User);

    // Get refresh token from cookies
    const refreshToken = request.cookies.get("refresh_token")?.value;
    console.log('[REFRESH] Has refresh_token cookie:', Boolean(refreshToken));
    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token provided" }, { status: 401 });
    }

    // Verify refresh token signature and expiry
    let payload: { userId: string };
    try {
      payload = verifyRefreshToken(refreshToken);
      console.log('[REFRESH] Refresh token verified for userId:', payload.userId);
    } catch (e) {
      console.log('[REFRESH] Refresh token verification failed');
      return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
    }

    // Check if refresh token exists in DB and is not expired
    const dbToken = await refreshTokenRepository.findOne({
      where: { token: refreshToken },
      relations: ["user"],
    });
    if (!dbToken || dbToken.expiresAt < new Date()) {
      console.log('[REFRESH] DB token missing or expired');
      return NextResponse.json({ error: "Refresh token not found or expired" }, { status: 401 });
    }

    // Issue new access token
    const accessToken = generateAccessToken(payload.userId);

    // Set new access token as cookie
    const response = NextResponse.json({ message: "Access token refreshed" });
    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60, // 15 minutes
      path: "/",
    });
    console.log('[REFRESH] New access_token cookie set');
    return response;
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


