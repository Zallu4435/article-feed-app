import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, initializeDatabase } from '@/lib/database';
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

    const { Article } = await import('../../../entities/Article');
    const repo = getDatabase().getRepository(Article);
    const art = await repo.findOne({ where: { id: articleId } });
    if (!art) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const viewers: string[] = Array.isArray((art as any).viewers) ? (art as any).viewers : ((art as any).viewers ? String((art as any).viewers).split(',').filter(Boolean) : []);
    if (viewers.includes(userId)) return NextResponse.json({ success: true, viewed: false });
    viewers.push(userId);
    (art as any).viewers = viewers;
    (art as any).viewsCount = viewers.length;
    await repo.save(art as any);
    return NextResponse.json({ success: true, viewed: true });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


