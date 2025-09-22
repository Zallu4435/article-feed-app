import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/database";
import prisma from "@/lib/prisma";
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

    if (type === 'block' || type === 'unblock') {
      const existing = await prisma.article.findUnique({ where: { id: articleId }, select: { authorId: true } });
      if (!existing || existing.authorId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (type === 'unblock') {
      await prisma.article.update({ where: { id: articleId }, data: { isBlocked: false } });
      return NextResponse.json({ success: true });
    }

    if (type === 'block') {
      await prisma.article.update({ where: { id: articleId }, data: { isBlocked: true } });
      return NextResponse.json({ success: true });
    }

    const art = await prisma.article.findUnique({ where: { id: articleId } });
    if (!art) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const likers: string[] = Array.isArray(art.likers) ? art.likers : [];
    const viewers: string[] = Array.isArray(art.viewers) ? art.viewers : [];
    const bookmarkers: string[] = Array.isArray(art.bookmarkers) ? art.bookmarkers : [];

    let data: any = {};

    if (type === 'like') {
      if (!likers.includes(userId)) likers.push(userId);
      data.likers = likers;
      data.likesCount = likers.length;
    } else if (type === 'dislike') {
      if (likers.includes(userId)) {
        const updatedLikers = likers.filter((x) => x !== userId);
        data.likers = updatedLikers;
        data.likesCount = updatedLikers.length;
      }
    } else if (type === 'bookmark') {
      if (!bookmarkers.includes(userId)) bookmarkers.push(userId);
      data.bookmarkers = bookmarkers;
      data.bookmarksCount = bookmarkers.length;
    } else if (type === 'unbookmark') {
      if (bookmarkers.includes(userId)) {
        const updated = bookmarkers.filter((x) => x !== userId);
        data.bookmarkers = updated;
        data.bookmarksCount = updated.length;
      }
    }

    await prisma.article.update({ where: { id: articleId }, data });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
