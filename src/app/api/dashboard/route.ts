import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/database";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();

    let token: string | undefined;
    const auth = request.headers.get('authorization');
    if (auth) token = auth.split(' ')[1];
    if (!token) token = request.cookies.get('access_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const userId = decoded.userId;

    const preferences = await prisma.userPreference.findMany({
      where: { userId },
      include: { category: true },
    });

    if (preferences.length === 0) {
      return NextResponse.json({
        articles: [],
        preferences: [],
        message: "No preferences selected. Please select your preferred categories to see personalized articles.",
        hasPreferences: false
      });
    }

    const preferredCategoryIds = preferences.map(p => p.categoryId);

    const [articles, allCategories, allArticles] = await Promise.all([
      prisma.article.findMany({
        where: { categoryId: { in: preferredCategoryIds }, isBlocked: false },
        include: { author: true, category: true },
        orderBy: { createdAt: 'desc' },
        take: 9,
      }),
      prisma.category.findMany({ orderBy: { name: 'asc' } }),
      prisma.article.findMany({ select: { id: true, viewers: true, likers: true, bookmarkers: true } }),
    ]);

    const toArray = (v: any): string[] => Array.isArray(v) ? v : (v ? String(v).split(',').filter(Boolean) : []);

    let articlesRead = 0;
    let likesGiven = 0;
    let bookmarks = 0;

    for (const a of allArticles as any[]) {
      const viewers = toArray(a.viewers);
      const likers = toArray(a.likers);
      const bookmarkers = toArray(a.bookmarkers);
      if (viewers.includes(userId)) articlesRead++;
      if (likers.includes(userId)) likesGiven++;
      if (bookmarkers.includes(userId)) bookmarks++;
    }

    const readingStreakDays = 0;

    const summarized = articles.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      imageUrl: a.imageUrl ?? null,
      createdAt: a.createdAt,
      author: a.author
        ? { id: a.author.id, firstName: a.author.firstName, lastName: a.author.lastName, profilePicture: a.author.profilePicture }
        : null,
      category: a.category
        ? { id: a.category.id, name: a.category.name }
        : null,
      viewsCount: Number(a.viewsCount || 0),
      likesCount: Number(a.likesCount || 0),
      likedByCurrentUser: toArray(a.likers).includes(userId),
      bookmarksCount: Number(a.bookmarksCount || 0),
      bookmarkedByCurrentUser: toArray(a.bookmarkers).includes(userId),
    }));

    return NextResponse.json({
      articles: summarized,
      preferences: preferences.map(p => ({
        id: p.id,
        categoryId: p.categoryId,
        categoryName: p.category?.name,
        createdAt: p.createdAt
      })),
      allCategories: allCategories.map(c => ({ id: c.id, name: c.name })),
      hasPreferences: true,
      stats: {
        articlesRead,
        likesGiven,
        bookmarks,
        readingStreakDays,
      }
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
