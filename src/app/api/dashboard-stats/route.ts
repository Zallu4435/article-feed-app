import { NextRequest, NextResponse } from "next/server";
import { getDatabase, initializeDatabase } from "@/lib/database";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();

    // Resolve current user
    let token: string | undefined;
    const auth = request.headers.get('authorization');
    if (auth) token = auth.split(' ')[1];
    if (!token) token = request.cookies.get('access_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const userId = decoded.userId;

    const { Article } = await import("@/entities/Article");
    const repo = getDatabase().getRepository(Article);

    // Select only interaction fields for efficiency
    const articles = await repo
      .createQueryBuilder("article")
      .select([
        "article.id",
        "article.viewers",
        "article.likers",
        "article.bookmarkers",
      ])
      .getMany();

    const toArray = (v: any): string[] => Array.isArray(v) ? v : (v ? String(v).split(',').filter(Boolean) : []);

    let articlesRead = 0;
    let likesGiven = 0;
    let bookmarks = 0;

    for (const a of articles as any[]) {
      const viewers = toArray(a.viewers);
      const likers = toArray(a.likers);
      const bookmarkers = toArray(a.bookmarkers);
      if (viewers.includes(userId)) articlesRead++;
      if (likers.includes(userId)) likesGiven++;
      if (bookmarkers.includes(userId)) bookmarks++;
    }

    // Reading streak unavailable without timestamped views; return 0 for now
    const readingStreakDays = 0;

    return NextResponse.json({
      stats: {
        articlesRead,
        likesGiven,
        bookmarks,
        readingStreakDays,
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


