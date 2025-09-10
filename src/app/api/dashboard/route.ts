import { NextRequest, NextResponse } from "next/server";
import { getDatabase, initializeDatabase } from "@/lib/database";
import jwt from "jsonwebtoken";
import { UserPreference } from "@/entities/UserPreference";

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

    const { Article } = await import("@/entities/Article");
    const { Category } = await import("@/entities/Category");
    const articleRepository = getDatabase().getRepository(Article);
    const preferenceRepository = getDatabase().getRepository(UserPreference);
    const categoryRepository = getDatabase().getRepository(Category);

    const preferences = await preferenceRepository
      .createQueryBuilder("preference")
      .leftJoinAndSelect("preference.category", "category")
      .where("preference.userId = :userId", { userId })
      .getMany();

    if (preferences.length === 0) {
      return NextResponse.json({
        articles: [],
        preferences: [],
        message: "No preferences selected. Please select your preferred categories to see personalized articles.",
        hasPreferences: false
      });
    }

    const preferredCategoryIds = preferences.map(p => p.categoryId);

      const articles = await articleRepository
        .createQueryBuilder("article")
        .leftJoinAndSelect("article.author", "author")
        .leftJoinAndSelect("article.category", "category")
        .where("article.categoryId IN (:...categoryIds)", { categoryIds: preferredCategoryIds })
        .andWhere("article.isBlocked = false")
        .orderBy("article.createdAt", "DESC")
        .limit(9)
        .getMany();

    const allCategories = await categoryRepository.find({
      order: { name: "ASC" }
    });

    const allArticles = await articleRepository
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

    for (const a of allArticles as any[]) {
      const viewers = toArray(a.viewers);
      const likers = toArray(a.likers);
      const bookmarkers = toArray(a.bookmarkers);
      if (viewers.includes(userId)) articlesRead++;
      if (likers.includes(userId)) likesGiven++;
      if (bookmarkers.includes(userId)) bookmarks++;
    }

    const readingStreakDays = 0;

    const summarized = articles.map((a: any) => ({
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
      likedByCurrentUser: Array.isArray(a.likers) ? a.likers.includes(userId) : (a.likers ? String(a.likers).split(',').filter(Boolean).includes(userId) : false),
      bookmarksCount: Number(a.bookmarksCount || 0),
      bookmarkedByCurrentUser: Array.isArray(a.bookmarkers) ? a.bookmarkers.includes(userId) : (a.bookmarkers ? String(a.bookmarkers).split(',').filter(Boolean).includes(userId) : false),
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
