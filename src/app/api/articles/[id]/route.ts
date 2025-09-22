import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/database";
import prisma from "@/lib/prisma";
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

    const article = await prisma.article.findFirst({
      where: { id, isBlocked: false },
      include: {
        author: true,
        category: true,
      },
    });

    if (!article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    const articleWithFlags = {
      ...article,
      likedByCurrentUser: currentUserId ? (article.likers ?? []).includes(currentUserId) : false,
      bookmarkedByCurrentUser: currentUserId ? (article.bookmarkers ?? []).includes(currentUserId) : false,
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
    const body = await request.json();
    const { title, description, content, imageUrl, tags, categoryId } = body as {
      title?: string; description?: string; content?: string; imageUrl?: string | null; tags?: string[]; categoryId?: string;
    };
    const decoded = token ? (jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }) : undefined;
    const userId = decoded?.userId;

    const existing = await prisma.article.findFirst({ where: { id, authorId: userId } });

    if (!existing) {
      return NextResponse.json(
        { error: "Article not found or you don't have permission to edit it" },
        { status: 404 }
      );
    }

    if (imageUrl !== undefined && imageUrl !== null && imageUrl !== existing.imageUrl && existing.imageUrl) {
      const oldUrl = existing.imageUrl as string;
      const publicId = getCloudinaryPublicIdFromUrl(oldUrl);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
        } catch (e) {
          console.warn('Failed to delete image from Cloudinary:', e);
        }
      }
    }

    const updated = await prisma.article.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        description: description ?? existing.description,
        content: content ?? existing.content,
        imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
        tags: tags ?? existing.tags,
        categoryId: categoryId ?? existing.categoryId
      }
    });

    return NextResponse.json({
      message: "Article updated successfully",
      article: updated
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
    const decoded = token ? (jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }) : undefined;
    const userId = decoded?.userId;

    const existing = await prisma.article.findFirst({ where: { id, authorId: userId } });

    if (!existing) {
      return NextResponse.json(
        { error: "Article not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }

    if (existing.imageUrl) {
      const publicId = getCloudinaryPublicIdFromUrl(existing.imageUrl as string);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
        } catch (e) {
            console.warn('Failed to delete image from Cloudinary:', e);
        }
      }
    }

    await prisma.article.delete({ where: { id } });

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
