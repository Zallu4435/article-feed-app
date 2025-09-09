import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/lib/datasource';
import { User } from '@/entities/User';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
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
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has completed OTP verification (OTP is cleared after verification)
    if (user.passwordResetOtp !== null) {
      return NextResponse.json(
        { message: 'OTP verification required' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Access granted' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Access validation error:', error);
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
