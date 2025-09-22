import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/database';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getUserId(request: NextRequest): string | null {
  let token: string | undefined;
  const auth = request.headers.get('authorization');
  if (auth) token = auth.split(' ')[1];
  if (!token) token = request.cookies.get('access_token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded.userId as string;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { articleId } = body as { articleId?: string };
    if (!articleId) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    const art = await prisma.article.findUnique({ where: { id: articleId } });
    if (!art) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const viewers: string[] = Array.isArray(art.viewers) ? art.viewers : [];
    if (viewers.includes(userId)) return NextResponse.json({ success: true, viewed: false });
    viewers.push(userId);

    await prisma.article.update({ where: { id: articleId }, data: { viewers, viewsCount: viewers.length } });
    return NextResponse.json({ success: true, viewed: true });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


