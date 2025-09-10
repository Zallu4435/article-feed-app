import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase, getDatabase } from "@/lib/database";
import { User } from "@/entities/User";
import { RefreshToken } from "@/entities/RefreshToken";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body ?? {};

    const fieldErrors: Record<string, string> = {};
    if (!email) fieldErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) fieldErrors.email = "Email is invalid";
    if (!password) fieldErrors.password = "Password is required";
    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        { error: { code: "validation_error", message: "Invalid request body", details: fieldErrors } },
        { status: 400 }
      );
    }

    await initializeDatabase();
    const db = getDatabase();
    const userRepository = db.getRepository(User);
    const refreshTokenRepository = db.getRepository(RefreshToken);

    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: { code: "user_not_found", message: "No account found for this email" } },
        { status: 404 }
      );
    }

    const isValidPassword = await user.validatePassword(password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: { code: "invalid_password", message: "Password is incorrect" } },
        { status: 401 }
      );
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
 
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); 

    await refreshTokenRepository.save(
      refreshTokenRepository.create({
        token: refreshToken,
        user: user,
        expiresAt: refreshTokenExpiry,
      })
    );

    const { password: _, ...userWithoutPassword } = user;

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

    return response;

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
