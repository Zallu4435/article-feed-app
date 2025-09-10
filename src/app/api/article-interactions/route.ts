import { NextRequest, NextResponse } from "next/server";
import { getDatabase, initializeDatabase } from "@/lib/database";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getUserIdFromRequest(request: NextRequest): string | null {

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

    const userId = getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { articleId, type } = body as { articleId?: string; type?: 'like' | 'dislike' | 'block' | 'unblock' | 'bookmark' | 'unbookmark' };

    if (!articleId || !type || !['like','dislike','block','unblock','bookmark','unbookmark'].includes(type)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const db = getDatabase();
    const { Article } = await import("@/entities/Article");
    const articleRepo = db.getRepository(Article);

    if (type === 'block' || type === 'unblock') {
      const article = await articleRepo.findOne({ where: { id: articleId } });
      if (!article || (article as any).authorId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (type === 'unblock') {
      const art = await articleRepo.findOne({ where: { id: articleId } });
      if (!art) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      (art as any).isBlocked = false;
      await articleRepo.save(art as any);
      return NextResponse.json({ success: true });
    }

    if (type === 'block') {
      const art = await articleRepo.findOne({ where: { id: articleId } });
      if (!art) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      (art as any).isBlocked = true;
      await articleRepo.save(art as any);
      return NextResponse.json({ success: true });
    }

    const art = await articleRepo.findOne({ where: { id: articleId } });
    if (!art) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const likers: string[] = Array.isArray((art as any).likers) ? (art as any).likers : ((art as any).likers ? String((art as any).likers).split(',').filter(Boolean) : []);
    const viewers: string[] = Array.isArray((art as any).viewers) ? (art as any).viewers : ((art as any).viewers ? String((art as any).viewers).split(',').filter(Boolean) : []);
    const bookmarkers: string[] = Array.isArray((art as any).bookmarkers) ? (art as any).bookmarkers : ((art as any).bookmarkers ? String((art as any).bookmarkers).split(',').filter(Boolean) : []);

    if (type === 'like') {
      if (!likers.includes(userId)) likers.push(userId);
      (art as any).likers = likers;
      (art as any).likesCount = likers.length;
    } else if (type === 'dislike') {
      if (likers.includes(userId)) {
        (art as any).likers = likers.filter((x) => x !== userId);
        (art as any).likesCount = ((art as any).likers as string[]).length;
      }
    } else if (type === 'bookmark') {
      if (!bookmarkers.includes(userId)) bookmarkers.push(userId);
      (art as any).bookmarkers = bookmarkers;
      (art as any).bookmarksCount = bookmarkers.length;
    } else if (type === 'unbookmark') {
      if (bookmarkers.includes(userId)) {
        (art as any).bookmarkers = bookmarkers.filter((x) => x !== userId);
        (art as any).bookmarksCount = ((art as any).bookmarkers as string[]).length;
      }
    }

    await articleRepo.save(art as any);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
