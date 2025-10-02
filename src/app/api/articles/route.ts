import { NextRequest } from "next/server";
import { ensureDatabaseConnection } from "@/helpers/database";
import { authenticateRequest } from "@/helpers/auth";
import { extractPaginationParams, extractSearchParams, createSuccessResponse, createErrorResponse, withErrorHandling } from "@/helpers/response";
import { ArticleService } from "@/services/article.service";
import { HttpStatusCode, ErrorCode } from "@/constants/status-codes";
import { ERROR_MESSAGES } from "@/constants/messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async (request: NextRequest) => {
  await ensureDatabaseConnection();
  
  const authResult = authenticateRequest(request);
  if (!authResult.success) {
    return createErrorResponse(
      authResult.error!.code,
      authResult.error!.message,
      { statusCode: authResult.error!.statusCode }
    );
  }

  const { searchParams } = new URL(request.url);
  const { page, limit } = extractPaginationParams(searchParams);
  const searchOptions = extractSearchParams(searchParams, {
    categoryId: undefined,
    search: undefined,
    excludeBlocked: true,
    owner: 'me',
  });

  const result = await ArticleService.getArticles({
        page,
        limit,
    currentUserId: authResult.userId,
    ...searchOptions,
  });

  return createSuccessResponse(result.data, {
    pagination: result.pagination,
  });
});

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
  const { title, description, content, imageUrl, tags, categoryId } = body;

  const result = await ArticleService.createArticle(
    { title, description, content, imageUrl, tags, categoryId },
    authResult.userId!
  );

  if (!result.success) {
    const validationDetails: Record<string, string> = {};
    result.errors?.forEach(error => {
      validationDetails[error.field] = error.message;
    });

    return createErrorResponse(
      ErrorCode.VALIDATION_ERROR,
      ERROR_MESSAGES.INVALID_ARTICLE_DATA,
      {
        statusCode: HttpStatusCode.BAD_REQUEST,
        details: validationDetails,
      }
    );
  }

  return createSuccessResponse(result.article, {
    message: "Article created successfully",
    statusCode: HttpStatusCode.CREATED,
  });
});
