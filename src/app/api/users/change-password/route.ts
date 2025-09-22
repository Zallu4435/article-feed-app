import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/database';
import prisma from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import { verifyAccessToken } from '@/lib/jwt';

export const runtime = 'nodejs';

function getUserIdFromRequest(request: NextRequest): string | null {
  const cookieToken = request.cookies.get('access_token')?.value;
  const headerAuth = request.headers.get('authorization');
  const headerToken = headerAuth?.startsWith('Bearer ')
    ? headerAuth.slice('Bearer '.length)
    : null;
  const token = cookieToken || headerToken;
  if (!token) return null;
  try {
    const decoded = verifyAccessToken(token);
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const userId = getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    }
    if (newPassword === currentPassword) {
      return NextResponse.json({ error: 'New password must be different from current password' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

    const sameAsOld = await bcrypt.compare(newPassword, user.password);
    if (sameAsOld) {
      return NextResponse.json({ error: 'New password must be different from current password' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
