import { NextRequest } from 'next/server';
import { ensureDatabaseConnection } from '@/helpers/database';
import { authenticateRequest, isValidUUID } from '@/helpers/auth';
import { createSuccessResponse, createErrorResponse, withErrorHandling } from '@/helpers/response';
import { ArticleService } from '@/services/article.service';
import { HttpStatusCode, ErrorCode } from '@/constants/status-codes';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/constants/messages';
import { v2 as cloudinary } from 'cloudinary';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

export const POST = withErrorHandling(async (request: NextRequest) => {
  await ensureDatabaseConnection();
  
  const authResult = authenticateRequest(request);
  if (!authResult.success) {
    return createErrorResponse(
      authResult.error!.code,
      authResult.error!.message,
      { statusCode: authResult.error!.statusCode }
    );
  }

  const body = await request.json();
  const ids = (body?.ids as string[])?.filter((v) => typeof v === 'string') ?? [];
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return createErrorResponse(
      ErrorCode.VALIDATION_ERROR,
      'Article IDs must be provided as a non-empty array',
      { statusCode: HttpStatusCode.BAD_REQUEST }
    );
  }

  const validIds = ids.filter(isValidUUID);
  if (validIds.length === 0) {
    return createErrorResponse(
      ErrorCode.VALIDATION_ERROR,
      'No valid article IDs provided',
      { statusCode: HttpStatusCode.BAD_REQUEST }
    );
  }

  const articles = await prisma.article.findMany({
    where: { authorId: authResult.userId, id: { in: validIds } },
    select: { id: true, imageUrl: true }
  });

  if (articles.length === 0) {
    return createSuccessResponse({ deletedCount: 0 }, {
      message: 'No articles found or you lack permission to delete them'
    });
  }

  await Promise.all(
    articles.map(async (article) => {
      if (article.imageUrl) {
        const publicId = getCloudinaryPublicIdFromUrl(article.imageUrl);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
        }
      }
    })
  );

  const result = await ArticleService.bulkDeleteArticles(
    articles.map(a => a.id),
    authResult.userId!
  );

  if (!result.success) {
    return createErrorResponse(
      ErrorCode.OPERATION_FAILED,
      result.error!,
      { statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR }
    );
  }

  return createSuccessResponse({ deletedCount: result.deletedCount }, {
    message: SUCCESS_MESSAGES.ARTICLES_BULK_DELETED,
  });
});


