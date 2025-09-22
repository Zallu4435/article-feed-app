import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/database";
import prisma from "@/lib/prisma";
import { generateOtp, sendOtpEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OTP_TTL_MS = 10 * 60 * 1000; 
const RESEND_COOLDOWN_MS = 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const body = await request.json();
    const { email } = body ?? {};

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { error: { code: "validation_error", message: "Invalid request body", details: { email: "Valid email is required" } } },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: { code: "conflict", message: "User with this email already exists", details: { email: "Already in use" } } },
        { status: 409 }
      );
    }

    const existing = await prisma.emailVerification.findUnique({ where: { email } });

    if (existing) {
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
      await prisma.emailVerification.update({ where: { email }, data: { otp, expiresAt, attempts: 0 } });
    } else {
      await prisma.emailVerification.create({ data: { email, otp, expiresAt } });
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


