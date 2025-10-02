import { NextRequest } from 'next/server';
import { ensureDatabaseConnection } from '@/helpers/database';
import { authenticateRequest, isValidUUID } from '@/helpers/auth';
import { createSuccessResponse, createErrorResponse, createNotFoundResponse, withErrorHandling } from '@/helpers/response';
import { HttpStatusCode, ErrorCode } from '@/constants/status-codes';
import { ERROR_MESSAGES } from '@/constants/messages';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
  const { articleId } = body as { articleId?: string };

  if (!articleId) {
    return createErrorResponse(
      ErrorCode.MISSING_REQUIRED_FIELD,
      'Article ID is required',
      { statusCode: HttpStatusCode.BAD_REQUEST }
    );
  }

  if (!isValidUUID(articleId)) {
    return createErrorResponse(
      ErrorCode.VALIDATION_ERROR,
      ERROR_MESSAGES.INVALID_UUID,
      { statusCode: HttpStatusCode.BAD_REQUEST }
    );
  }

  const article = await prisma.article.findUnique({ 
    where: { id: articleId },
    select: { id: true, viewers: true, viewsCount: true }
  });

  if (!article) {
    return createNotFoundResponse(ERROR_MESSAGES.ARTICLE_NOT_FOUND);
  }

  const viewers: string[] = Array.isArray(article.viewers) ? article.viewers : [];
  
  if (viewers.includes(authResult.userId!)) {
    return createSuccessResponse({ 
      viewed: false, 
      viewsCount: article.viewsCount || viewers.length 
    }, {
      message: 'Article already viewed by user'
    });
  }

  viewers.push(authResult.userId!);
  const newViewsCount = viewers.length;

  await prisma.article.update({ 
    where: { id: articleId }, 
    data: { 
      viewers, 
      viewsCount: newViewsCount 
    } 
  });

  return createSuccessResponse({ 
    viewed: true, 
    viewsCount: newViewsCount 
  }, {
    message: 'Article view recorded successfully'
  });
});


