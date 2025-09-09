import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase, getDatabase } from "@/lib/database";
import { EmailVerification } from "@/entities/EmailVerification";
import { User } from "@/entities/User";
import { RefreshToken } from "@/entities/RefreshToken";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const db = getDatabase();
    const body = await request.json();
    const { firstName, lastName, phone, email, dateOfBirth, password, otp } = body ?? {};
    console.log("[register:verify] Payload received", { email, phone, hasOtp: !!otp });

    const fieldErrors: Record<string, string> = {};
    if (!firstName) fieldErrors.firstName = "First name is required";
    if (!lastName) fieldErrors.lastName = "Last name is required";
    if (!phone) fieldErrors.phone = "Phone is required";
    if (!email) fieldErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) fieldErrors.email = "Email is invalid";
    if (!dateOfBirth) fieldErrors.dateOfBirth = "Date of birth is required";
    if (!password) fieldErrors.password = "Password is required";
    else if (password.length < 8) fieldErrors.password = "Password must be at least 8 characters";
    if (!otp) fieldErrors.otp = "OTP is required";
    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        { error: { code: "validation_error", message: "Invalid request body", details: fieldErrors } },
        { status: 400 }
      );
    }

    const userRepository = db.getRepository(User);
    const refreshTokenRepository = db.getRepository(RefreshToken);
    const emailVerificationRepo = db.getRepository(EmailVerification);

    // Check OTP record
    const verification = await emailVerificationRepo.findOne({ where: { email } });
    if (!verification) {
      console.warn("[register:verify] No OTP record for", email);
      return NextResponse.json(
        { error: { code: "otp_not_found", message: "No OTP request found for this email" } },
        { status: 404 }
      );
    }

    if (verification.expiresAt.getTime() < Date.now()) {
      console.warn("[register:verify] OTP expired for", email);
      return NextResponse.json(
        { error: { code: "otp_expired", message: "OTP has expired" } },
        { status: 400 }
      );
    }

    if (verification.otp !== otp) {
      verification.attempts += 1;
      await emailVerificationRepo.save(verification);
      console.warn("[register:verify] Invalid OTP for", email, "attempts:", verification.attempts);
      return NextResponse.json(
        { error: { code: "otp_invalid", message: "Invalid OTP" } },
        { status: 400 }
      );
    }

    // OTP valid; delete verification
    await emailVerificationRepo.delete({ id: verification.id });

    // Create user
    const existingUser = await userRepository.findOne({ where: [{ email }, { phone }] });
    if (existingUser) {
      const conflictField = existingUser.email === email ? "email" : "phone";
      console.warn("[register:verify] Conflict on", conflictField, "for", email);
      return NextResponse.json(
        { error: { code: "conflict", message: `User with this ${conflictField} already exists`, details: { [conflictField]: "Already in use" } } },
        { status: 409 }
      );
    }

    const user = userRepository.create({
      firstName,
      lastName,
      phone,
      email,
      dateOfBirth: new Date(dateOfBirth),
      password,
    });
    await userRepository.save(user);

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await refreshTokenRepository.save(
      refreshTokenRepository.create({ token: refreshToken, user, expiresAt: refreshTokenExpiry })
    );

    const { password: _, ...userWithoutPassword } = user;

    const response = NextResponse.json(
      { message: "User verified and registered successfully", user: userWithoutPassword },
      { status: 201 }
    );
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
    console.error("[register:verify] Error:", (error as Error)?.message);
    return NextResponse.json(
      { error: { code: "server_error", message: "Internal server error" } },
      { status: 500 }
    );
  }
}


