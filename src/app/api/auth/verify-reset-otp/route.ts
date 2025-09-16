import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, getDatabase } from '@/lib/database';
import { User } from '@/entities/User';
import { MoreThan } from 'typeorm';

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
    const dataSource = getDatabase();
    const userRepository = dataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: {
        email: email.toLowerCase(),
        passwordResetOtp: otp,
        passwordResetOtpExpiry: MoreThan(new Date()) 
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    await userRepository.update(user.id, {
      passwordResetOtp: null,
      passwordResetOtpExpiry: null,
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
    // Do not destroy the global DataSource; connection pooling is managed in lib/database.
  }
}
