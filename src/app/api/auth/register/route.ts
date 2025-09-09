import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase, getDatabase } from "@/lib/database";
import { User } from "@/entities/User";
import { RefreshToken } from "@/entities/RefreshToken";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { EmailVerification } from "@/entities/EmailVerification";
import { generateOtp, sendOtpEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const db = getDatabase();
    const body = await request.json();
    const { firstName, lastName, phone, email, dateOfBirth, password } = body ?? {};
    console.log("[register:initiate] Payload received", { email, phone, hasPassword: !!password });

    // Validation
    const fieldErrors: Record<string, string> = {};
    if (!firstName) fieldErrors.firstName = "First name is required";
    if (!lastName) fieldErrors.lastName = "Last name is required";
    if (!phone) fieldErrors.phone = "Phone is required";
    if (!email) fieldErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) fieldErrors.email = "Email is invalid";
    if (!dateOfBirth) fieldErrors.dateOfBirth = "Date of birth is required";
    if (!password) fieldErrors.password = "Password is required";
    else if (password.length < 8) fieldErrors.password = "Password must be at least 8 characters";
    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        { error: { code: "validation_error", message: "Invalid request body", details: fieldErrors } },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const userRepository = db.getRepository(User);
    const refreshTokenRepository = db.getRepository(RefreshToken);
    const emailVerificationRepo = db.getRepository(EmailVerification);

    // Check if user already exists
    const existingUser = await userRepository.findOne({ where: [{ email }, { phone }] });

    if (existingUser) {
      const conflictField = existingUser.email === email ? "email" : "phone";
      console.warn("[register:initiate] Conflict on", conflictField, "for email:", email, "phone:", phone);
      return NextResponse.json(
        { error: { code: "conflict", message: `User with this ${conflictField} already exists`, details: { [conflictField]: "Already in use" } } },
        { status: 409 }
      );
    }

    // Generate OTP and send email
    const otp = generateOtp(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert verification record
    const existingVerification = await emailVerificationRepo.findOne({ where: { email } });
    if (existingVerification) {
      existingVerification.otp = otp;
      existingVerification.expiresAt = expiresAt;
      existingVerification.attempts = 0;
      await emailVerificationRepo.save(existingVerification);
    } else {
      const verification = emailVerificationRepo.create({ email, otp, expiresAt });
      await emailVerificationRepo.save(verification);
    }

    try {
      await sendOtpEmail(email, otp);
      console.log("[register:initiate] OTP sent to", email);
    } catch (e) {
      console.error("[register:initiate] Failed to send OTP email:", (e as Error)?.message);
      return NextResponse.json(
        { error: { code: "email_failed", message: "Failed to send verification email" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "OTP sent to email" }, { status: 200 });

  } catch (error) {
    console.error("[register:initiate] Registration error:", (error as Error)?.message);
    return NextResponse.json(
      { error: { code: "server_error", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
