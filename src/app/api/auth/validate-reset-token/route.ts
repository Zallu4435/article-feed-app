import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, getDatabase } from '@/lib/database';
import { User } from '@/entities/User';
import { MoreThan } from 'typeorm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { message: 'Reset token is required' },
        { status: 400 }
      );
    }

    await initializeDatabase();
    const dataSource = getDatabase();
    const userRepository = dataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: MoreThan(new Date()) 
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Token is valid' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    // Do not destroy the global DataSource; connection pooling is managed in lib/database.
  }
}
