import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/lib/datasource';
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

    await AppDataSource.initialize();
    const userRepository = AppDataSource.getRepository(User);

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

    user.passwordResetOtp = undefined;
    user.passwordResetOtpExpiry = undefined;
    await userRepository.save(user);

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
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}
