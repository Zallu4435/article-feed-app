import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/database';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { message: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { message: 'Please enter a valid 6-digit code' },
        { status: 400 }
      );
    }

    await initializeDatabase();

    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        passwordResetOtp: otp,
        passwordResetOtpExpiry: { gt: new Date() }
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetOtp: null,
        passwordResetOtpExpiry: null,
      }
    });

    return NextResponse.json(
      { message: 'OTP verified successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    // Prisma is managed globally
  }
}
