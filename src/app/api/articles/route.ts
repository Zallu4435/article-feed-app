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

    let token: string | undefined;
    const auth = request.headers.get('authorization');
    if (auth) token = auth.split(' ')[1];
    if (!token) token = request.cookies.get('access_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const currentUserId = decoded.userId;

    const { Article } = await import("@/entities/Article");
    const articleRepository = getDatabase().getRepository(Article);
    const queryBuilder = articleRepository
      .createQueryBuilder("article")
      .leftJoinAndSelect("article.category", "category")
      .select([
        "article.id",
        "article.title", 
        "article.description",
        "article.createdAt",
        "article.isBlocked",
        "category.id",
        "category.name"
      ]);

    if (excludeBlocked) {
      queryBuilder.andWhere('article."isBlocked" = false');
    }
    queryBuilder.andWhere('article.authorId = :authorId', { authorId: currentUserId });

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
        "(article.title ILIKE :search OR article.description ILIKE :search OR article.content ILIKE :search OR article.tags ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    const total = await queryBuilder.getCount();

    const articles = await queryBuilder
      .orderBy("article.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const summarized = articles.map((a: any) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      createdAt: a.createdAt,
      category: a.category
        ? { id: a.category.id, name: a.category.name }
        : null,
      isBlocked: !!a.isBlocked,
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
