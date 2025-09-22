import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/database';
import prisma from '@/lib/prisma';
import { sendOtpEmail, generateOtp } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    await initializeDatabase();

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user) {
      return NextResponse.json(
        { message: 'If an account with that email exists, we\'ve sent a verification code.' },
        { status: 200 }
      );
    }

    const otp = generateOtp(6);
    const otpExpiry = new Date(Date.now() + 600000); 

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetOtp: otp,
          passwordResetOtpExpiry: otpExpiry,
        }
      });

      await sendOtpEmail(user.email, otp);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetOtp: null,
          passwordResetOtpExpiry: null,
        }
      });
      
      return NextResponse.json(
        { message: 'Failed to send verification code. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'If an account with that email exists, we\'ve sent a verification code.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    // Prisma is managed globally
  }
}
