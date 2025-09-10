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
    db.getRepository(User);

    const refreshToken = request.cookies.get("refresh_token")?.value;
    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token provided" }, { status: 401 });
    }

    let payload: { userId: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (e) {
      return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
    }

    const dbToken = await refreshTokenRepository.findOne({
      where: { token: refreshToken },
      relations: ["user"],
    });
    if (!dbToken || dbToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "Refresh token not found or expired" }, { status: 401 });
    }

    const accessToken = generateAccessToken(payload.userId);

    const response = NextResponse.json({ message: "Access token refreshed" });
    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60,
      path: "/",
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


