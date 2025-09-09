import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/lib/datasource';
import { User } from '@/entities/User';
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

    // Validate email format
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    await AppDataSource.initialize();
    const userRepository = AppDataSource.getRepository(User);

    // Find user by email
    const user = await userRepository.findOne({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { message: 'If an account with that email exists, we\'ve sent a verification code.' },
        { status: 200 }
      );
    }

    // Generate OTP
    const otp = generateOtp(6);
    const otpExpiry = new Date(Date.now() + 600000); // 10 minutes from now

    // Update user with OTP
    user.passwordResetOtp = otp;
    user.passwordResetOtpExpiry = otpExpiry;
    await userRepository.save(user);

    // Send OTP email
    try {
      await sendOtpEmail(user.email, otp);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // Clear the OTP if email fails
      user.passwordResetOtp = null;
      user.passwordResetOtpExpiry = null;
      await userRepository.save(user);
      
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
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}
