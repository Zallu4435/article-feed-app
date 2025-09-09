import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase, getDatabase } from "@/lib/database";
import { EmailVerification } from "@/entities/EmailVerification";
import { User } from "@/entities/User";
import { generateOtp, sendOtpEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const db = getDatabase();
    const body = await request.json();
    const { email } = body ?? {};

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { error: { code: "validation_error", message: "Invalid request body", details: { email: "Valid email is required" } } },
        { status: 400 }
      );
    }

    const userRepository = db.getRepository(User);
    const emailVerificationRepo = db.getRepository(EmailVerification);

    // If user already exists, do not send OTP
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: { code: "conflict", message: "User with this email already exists", details: { email: "Already in use" } } },
        { status: 409 }
      );
    }

    const existing = await emailVerificationRepo.findOne({ where: { email } });

    if (existing) {
      // Derive lastSentAt from expiresAt - TTL
      const lastSentAt = new Date(existing.expiresAt.getTime() - OTP_TTL_MS);
      const now = Date.now();
      const msSinceLast = now - lastSentAt.getTime();
      if (msSinceLast < RESEND_COOLDOWN_MS) {
        const retryAfter = Math.ceil((RESEND_COOLDOWN_MS - msSinceLast) / 1000);
        return NextResponse.json(
          { error: { code: "too_many_requests", message: "Please wait before requesting another code", retryAfter } },
          { status: 429 }
        );
      }
    }

    const otp = generateOtp(6);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    if (existing) {
      existing.otp = otp;
      existing.expiresAt = expiresAt;
      existing.attempts = 0;
      await emailVerificationRepo.save(existing);
    } else {
      const record = emailVerificationRepo.create({ email, otp, expiresAt });
      await emailVerificationRepo.save(record);
    }

    try {
      await sendOtpEmail(email, otp);
    } catch (e) {
      console.error("[register:resend] Failed to send OTP:", (e as Error)?.message);
      return NextResponse.json(
        { error: { code: "email_failed", message: "Failed to send verification email" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "OTP resent" }, { status: 200 });
  } catch (error) {
    console.error("[register:resend] Error:", (error as Error)?.message);
    return NextResponse.json(
      { error: { code: "server_error", message: "Internal server error" } },
      { status: 500 }
    );
  }
}


