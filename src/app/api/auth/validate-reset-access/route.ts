import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/database';
import prisma from '@/lib/prisma';

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

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

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
    // Prisma is managed globally
  }
}
