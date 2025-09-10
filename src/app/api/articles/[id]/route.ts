import { NextRequest, NextResponse } from "next/server";
import { getDatabase, initializeDatabase } from "@/lib/database";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function getCloudinaryPublicIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const path = u.pathname; 
    const marker = "/upload/";
    const idx = path.indexOf(marker);
    if (idx === -1) return null;
    let sub = path.substring(idx + marker.length); 
    const parts = sub.split("/");
    if (parts[0] && /^v\d+$/.test(parts[0])) {
      parts.shift(); 
    }
    const withoutVersion = parts.join("/"); 
    const withoutExt = withoutVersion.replace(/\.[^/.]+$/, ""); 
    return withoutExt || null;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await context.params;
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id);
    if (!isUuid) {
      return NextResponse.json(
        { error: { code: "validation_error", message: "Invalid article id", details: { id: "Must be a UUID" } } },
        { status: 400 }
      );
    }

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

    const article = await articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.category', 'category')
      .where('article.id = :id', { id })
      .andWhere('article."isBlocked" = false')
      .getOne();

    if (!article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    const articleWithFlags = {
      ...article,
      likedByCurrentUser: currentUserId ? (Array.isArray((article as any).likers) ? (article as any).likers.includes(currentUserId) : ((article as any).likers ? String((article as any).likers).split(',').filter(Boolean).includes(currentUserId) : false)) : false,
      bookmarkedByCurrentUser: currentUserId ? (Array.isArray((article as any).bookmarkers) ? (article as any).bookmarkers.includes(currentUserId) : ((article as any).bookmarkers ? String((article as any).bookmarkers).split(',').filter(Boolean).includes(currentUserId) : false)) : false,
    };

    return NextResponse.json({ article: articleWithFlags });

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();

    let token: string | undefined;
    const auth = request.headers.get('authorization');
    if (auth) {
      token = auth.split(' ')[1];
    } else {
      token = request.cookies.get('access_token')?.value;
    }
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const { Article } = await import("@/entities/Article");
    const body = await request.json();
    const { title, description, content, imageUrl, tags, categoryId } = body as {
      title?: string; description?: string; content?: string; imageUrl?: string | null; tags?: string[]; categoryId?: string;
    };
    const decoded = token ? (jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }) : undefined;
    const userId = decoded?.userId;

    const articleRepository = getDatabase().getRepository(Article);

    const article = await articleRepository.findOne({ where: { id, authorId: userId } });

    if (!article) {
      return NextResponse.json(
        { error: "Article not found or you don't have permission to edit it" },
        { status: 404 }
      );
    }

    if (imageUrl !== undefined && imageUrl !== null && imageUrl !== (article as any).imageUrl && (article as any).imageUrl) {
      const oldUrl = (article as any).imageUrl as string;
      const publicId = getCloudinaryPublicIdFromUrl(oldUrl);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
        } catch (e) {
          console.warn('Failed to delete image from Cloudinary:', e);
        }
      }
    }

    Object.assign(article, {
      title: title || article.title,
      description: description || article.description,
      content: content || article.content,
      imageUrl: imageUrl !== undefined ? imageUrl : article.imageUrl,
      tags: tags || article.tags,
      categoryId: categoryId || article.categoryId
    });

    await articleRepository.save(article);

    return NextResponse.json({
      message: "Article updated successfully",
      article
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();

    let token: string | undefined;
    const auth = request.headers.get('authorization');
    if (auth) {
      token = auth.split(' ')[1];
    } else {
      token = request.cookies.get('access_token')?.value;
    }
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const { Article } = await import("@/entities/Article");
    const decoded = token ? (jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }) : undefined;
    const userId = decoded?.userId;

    const articleRepository = getDatabase().getRepository(Article);

    const article = await articleRepository.findOne({ where: { id, authorId: userId } });

    if (!article) {
      return NextResponse.json(
        { error: "Article not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }

    if ((article as any).imageUrl) {
      const publicId = getCloudinaryPublicIdFromUrl((article as any).imageUrl as string);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
        } catch (e) {
            console.warn('Failed to delete image from Cloudinary:', e);
        }
      }
    }

    await articleRepository.remove(article);

    return NextResponse.json({
      message: "Article deleted successfully"
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
