import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/database";
import prisma from "@/lib/prisma";
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
    const owner = (searchParams.get("owner") || 'me').toLowerCase();

    let token: string | undefined;
    const auth = request.headers.get('authorization');
    if (auth) token = auth.split(' ')[1];
    if (!token) token = request.cookies.get('access_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const currentUserId = decoded.userId;

    const where: any = {};
    if (owner !== 'all') {
      where.authorId = currentUserId;
    }
    if (excludeBlocked) where.isBlocked = false;

    if (categoryId) {
      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(categoryId);
      if (isUuid) {
        where.categoryId = categoryId;
      } else {
        where.category = { name: { equals: categoryId, mode: 'insensitive' as const } };
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    const [total, articles] = await Promise.all([
      prisma.article.count({ where }),
      prisma.article.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          createdAt: true,
          isBlocked: true,
          category: { select: { id: true, name: true } },
          author: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      })
    ]);

    const summarized = articles.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      imageUrl: a.imageUrl ?? null,
      createdAt: a.createdAt,
      category: a.category ? { id: a.category.id, name: a.category.name } : null,
      isBlocked: !!a.isBlocked,
      author: a.author ? { firstName: a.author.firstName || '', lastName: a.author.lastName || '' } : null,
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

    const decoded = token ? (jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }) : undefined;
    const userId = decoded?.userId!;

    const article = await prisma.article.create({
      data: {
        title,
        description,
        content,
        imageUrl: imageUrl ?? null,
        tags: tags || [],
        authorId: userId,
        categoryId,
        isBlocked: false,
        viewers: [],
        likers: [],
        bookmarkers: [],
        viewsCount: 0,
        likesCount: 0,
        bookmarksCount: 0,
      }
    });

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
