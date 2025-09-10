import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, initializeDatabase } from '@/lib/database';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function isUuid(id: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id);
}

function getCloudinaryPublicIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const path = u.pathname; 
    const marker = '/upload/';
    const idx = path.indexOf(marker);
    if (idx === -1) return null;
    let sub = path.substring(idx + marker.length); 
    const parts = sub.split('/');
    if (parts[0] && /^v\d+$/.test(parts[0])) parts.shift();
    const withoutVersion = parts.join('/');
    return withoutVersion.replace(/\.[^/.]+$/, '') || null; 
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    // Authenticate user
    let token: string | undefined;
    const auth = request.headers.get('authorization');
    if (auth) token = auth.split(' ')[1];
    else token = request.cookies.get('access_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const userId = decoded?.userId;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const ids = (body?.ids as string[])?.filter((v) => typeof v === 'string') ?? [];
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: { code: 'validation_error', message: 'ids must be a non-empty string array' } },
        { status: 400 }
      );
    }
    const validIds = ids.filter(isUuid);
    if (validIds.length === 0) {
      return NextResponse.json(
        { error: { code: 'validation_error', message: 'No valid UUIDs provided' } },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const { Article } = await import('@/entities/Article');
    const articleRepository = db.getRepository(Article);

    const articles = await articleRepository
      .createQueryBuilder('article')
      .where('article.authorId = :userId', { userId })
      .andWhere('article.id IN (:...ids)', { ids: validIds })
      .getMany();

    if (articles.length === 0) {
      return NextResponse.json({ deleted: 0, message: 'No articles found or you lack permission' });
    }

    await Promise.all(
      articles.map(async (a: any) => {
        const img = a.imageUrl as string | undefined;
        if (!img) return;
        const publicId = getCloudinaryPublicIdFromUrl(img);
        if (!publicId) return;
        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
        } catch {}
      })
    );

    await articleRepository.remove(articles);

    return NextResponse.json({ deleted: articles.length });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


