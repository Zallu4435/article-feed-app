import { NextRequest, NextResponse } from "next/server";
import { getDatabase, initializeDatabase } from "@/lib/database";
import jwt from "jsonwebtoken";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const excludeBlocked = (searchParams.get("excludeBlocked") || 'true') === 'true';

    // Try to resolve current user for likedByCurrentUser flag
    let currentUserId: string | undefined;
    const auth = request.headers.get('authorization');
    let token: string | undefined = auth ? auth.split(' ')[1] : request.cookies.get('access_token')?.value;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId?: string };
        if (decoded?.userId) currentUserId = decoded.userId;
      } catch {}
    }

    const { Article } = await import("@/entities/Article");
    const articleRepository = getDatabase().getRepository(Article);
    const queryBuilder = articleRepository
      .createQueryBuilder("article")
      .leftJoinAndSelect("article.author", "author")
      .leftJoinAndSelect("article.category", "category");

    if (excludeBlocked) {
      queryBuilder.andWhere('article."isBlocked" = false');
    }

    // Apply filters
    if (categoryId) {
      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(categoryId);
      if (isUuid) {
        queryBuilder.andWhere("article.categoryId = :categoryId", { categoryId });
      } else {
        queryBuilder.andWhere("LOWER(category.name) = LOWER(:categoryName)", { categoryName: categoryId });
      }
    }

    if (search) {
      queryBuilder.andWhere(
        "(article.title ILIKE :search OR article.description ILIKE :search OR article.content ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const articles = await queryBuilder
      .orderBy("article.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Summarize payload for list views
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
      isBlocked: !!a.isBlocked,
      viewsCount: Number(a.viewsCount || 0),
      likesCount: Number(a.likesCount || 0),
      likedByCurrentUser: currentUserId ? (Array.isArray(a.likers) ? a.likers.includes(currentUserId) : (a.likers ? String(a.likers).split(',').filter(Boolean).includes(currentUserId) : false)) : false,
      bookmarksCount: Number(a.bookmarksCount || 0),
      bookmarkedByCurrentUser: currentUserId ? (Array.isArray(a.bookmarkers) ? a.bookmarkers.includes(currentUserId) : (a.bookmarkers ? String(a.bookmarkers).split(',').filter(Boolean).includes(currentUserId) : false)) : false,
    }));

    return NextResponse.json({
      articles: summarized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Get articles error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    // Authenticate user via Authorization header or access_token cookie
    let token: string | undefined;
    const auth = request.headers.get('authorization');
    if (auth) {
      token = auth.split(' ')[1];
    } else {
      token = request.cookies.get('access_token')?.value;
    }
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, content, imageUrl, tags, categoryId } = body as {
      title?: string; description?: string; content?: string; imageUrl?: string | null; tags?: string[]; categoryId?: string;
    };

    // Validation
    if (!title || !description || !content || !categoryId) {
      return NextResponse.json(
        { error: "Title, description, content, and categoryId are required" },
        { status: 400 }
      );
    }

    const { Article } = await import("@/entities/Article");
    const articleRepository = getDatabase().getRepository(Article);
    const decoded = token ? (jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }) : undefined;
    const userId = decoded?.userId;

    // Create article
    const article = articleRepository.create({
      title,
      description,
      content,
      imageUrl,
      tags: tags || [],
      authorId: userId!,
      categoryId,
      isBlocked: false,
      viewers: [],
      likers: [],
      bookmarkers: [],
      viewsCount: 0,
      likesCount: 0,
      bookmarksCount: 0,
    });

    await articleRepository.save(article);

    return NextResponse.json({
      message: "Article created successfully",
      article
    }, { status: 201 });

  } catch (error) {
    console.error("Create article error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
