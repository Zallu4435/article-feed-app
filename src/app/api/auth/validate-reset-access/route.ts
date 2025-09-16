import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, getDatabase } from '@/lib/database';
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

    await initializeDatabase();
    const dataSource = getDatabase();
    const userRepository = dataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    if (user.passwordResetOtp && user.passwordResetOtp.trim() !== '') {
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
    // Do not destroy the global DataSource; connection pooling is managed in lib/database.
  }
}
