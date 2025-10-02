import { NextRequest } from "next/server";
import { ensureDatabaseConnection } from "@/helpers/database";
import { authenticateRequest, isValidUUID } from "@/helpers/auth";
import { createSuccessResponse, createErrorResponse, createNotFoundResponse, createForbiddenResponse, withErrorHandling } from "@/helpers/response";
import { ArticleService } from "@/services/article.service";
import { HttpStatusCode, ErrorCode } from "@/constants/status-codes";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "@/constants/messages";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type InteractionType = 'like' | 'unlike' | 'bookmark' | 'unbookmark' | 'block' | 'unblock';

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
  const { articleId, type } = body as { articleId?: string; type?: InteractionType };

  // Validate input
  if (!articleId || !type) {
    return createErrorResponse(
      ErrorCode.MISSING_REQUIRED_FIELD,
      'Article ID and interaction type are required',
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

  const validTypes: InteractionType[] = ['like', 'unlike', 'bookmark', 'unbookmark', 'block', 'unblock'];
  if (!validTypes.includes(type)) {
    return createErrorResponse(
      ErrorCode.VALIDATION_ERROR,
      'Invalid interaction type',
      { statusCode: HttpStatusCode.BAD_REQUEST }
    );
  }

  if (type === 'block' || type === 'unblock') {
    const article = await prisma.article.findUnique({ 
      where: { id: articleId }, 
      select: { authorId: true } 
    });
    
    if (!article) {
      return createNotFoundResponse(ERROR_MESSAGES.ARTICLE_NOT_FOUND);
    }
    
    if (article.authorId !== authResult.userId) {
      return createForbiddenResponse('Only the author can block/unblock their articles');
    }

    await prisma.article.update({ 
      where: { id: articleId }, 
      data: { isBlocked: type === 'block' } 
    });

    return createSuccessResponse(null, {
      message: type === 'block' ? 'Article blocked successfully' : 'Article unblocked successfully',
    });
  }

    if (type === 'like') {
    const result = await ArticleService.likeArticle(articleId, authResult.userId!);
    if (!result.success) {
      return createErrorResponse(
        ErrorCode.OPERATION_FAILED,
        result.error!,
        { statusCode: HttpStatusCode.BAD_REQUEST }
      );
    }
    return createSuccessResponse({ newCount: result.newCount }, {
      message: SUCCESS_MESSAGES.ARTICLE_LIKED,
    });
  }

  if (type === 'unlike') {
    const result = await ArticleService.unlikeArticle(articleId, authResult.userId!);
    if (!result.success) {
      return createErrorResponse(
        ErrorCode.OPERATION_FAILED,
        result.error!,
        { statusCode: HttpStatusCode.BAD_REQUEST }
      );
    }
    return createSuccessResponse({ newCount: result.newCount }, {
      message: SUCCESS_MESSAGES.ARTICLE_UNLIKED,
    });
  }

  if (type === 'bookmark') {
    const result = await ArticleService.bookmarkArticle(articleId, authResult.userId!);
    if (!result.success) {
      return createErrorResponse(
        ErrorCode.OPERATION_FAILED,
        result.error!,
        { statusCode: HttpStatusCode.BAD_REQUEST }
      );
    }
    return createSuccessResponse({ newCount: result.newCount }, {
      message: SUCCESS_MESSAGES.ARTICLE_BOOKMARKED,
    });
  }

  if (type === 'unbookmark') {
    const result = await ArticleService.unbookmarkArticle(articleId, authResult.userId!);
    if (!result.success) {
      return createErrorResponse(
        ErrorCode.OPERATION_FAILED,
        result.error!,
        { statusCode: HttpStatusCode.BAD_REQUEST }
      );
    }
    return createSuccessResponse({ newCount: result.newCount }, {
      message: SUCCESS_MESSAGES.ARTICLE_UNBOOKMARKED,
    });
  }

  return createErrorResponse(
    ErrorCode.INVALID_OPERATION,
    'Invalid interaction type',
    { statusCode: HttpStatusCode.BAD_REQUEST }
  );
});
