import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase, getDatabase } from "@/lib/database";
import { User } from "@/entities/User";
import { RefreshToken } from "@/entities/RefreshToken";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    console.log("[login] Environment check:", {
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasDbUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    });

    const body = await request.json();
    const { email, password } = body ?? {};

    console.log("[login] Incoming body:", { hasEmail: !!email, hasPassword: !!password });

    const fieldErrors: Record<string, string> = {};
    if (!email) fieldErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) fieldErrors.email = "Email is invalid";
    if (!password) fieldErrors.password = "Password is required";
    if (Object.keys(fieldErrors).length > 0) {
      console.warn("[login] Validation error:", fieldErrors);
      return NextResponse.json(
        { error: { code: "validation_error", message: "Invalid request body", details: fieldErrors } },
        { status: 400 }
      );
    }

    console.log("[login] Initializing database...");
    await initializeDatabase();
    const db = getDatabase();
    console.log("[login] Database initialized");

    const userRepository = db.getRepository(User);
    const refreshTokenRepository = db.getRepository(RefreshToken);

    console.log("[login] Looking up user by email...");
    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      console.warn("[login] User not found for email");
      return NextResponse.json(
        { error: { code: "user_not_found", message: "No account found for this email" } },
        { status: 404 }
      );
    }

    console.log("[login] Validating password...");
    const isValidPassword = await user.validatePassword(password);

    if (!isValidPassword) {
      console.warn("[login] Invalid password");
      return NextResponse.json(
        { error: { code: "invalid_password", message: "Password is incorrect" } },
        { status: 401 }
      );
    }

    console.log("[login] About to generate tokens...");
    const accessToken = generateAccessToken(user.id);
    console.log("[login] Access token generated");

    const refreshToken = generateRefreshToken(user.id);
    console.log("[login] Refresh token generated");

    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    console.log("[login] Saving refresh token to DB...");
    await refreshTokenRepository.save(
      refreshTokenRepository.create({
        token: refreshToken,
        user: user,
        expiresAt: refreshTokenExpiry,
      })
    );
    console.log("[login] Refresh token saved");

    const { password: _, ...userWithoutPassword } = user;

    console.log("[login] Preparing response and setting cookies...");
    const response = NextResponse.json({
      message: "Login successful",
      user: userWithoutPassword,
    });
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

    console.log("[login] Response ready. Returning 200");
    return response;
  } catch (error: any) {
    console.error("[login] Detailed error:", {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
