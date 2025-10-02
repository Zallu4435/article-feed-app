import { NextRequest } from "next/server";
import { ensureDatabaseConnection } from "@/helpers/database";
import { authenticateRequest, optionalAuthentication, isValidUUID } from "@/helpers/auth";
import { createSuccessResponse, createErrorResponse, createNotFoundResponse, withErrorHandling } from "@/helpers/response";
import { ArticleService } from "@/services/article.service";
import { HttpStatusCode, ErrorCode } from "@/constants/status-codes";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants/messages";
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

export const GET = withErrorHandling(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  await ensureDatabaseConnection();
  
    const { id } = await context.params;
  
  if (!isValidUUID(id)) {
    return createErrorResponse(
      ErrorCode.VALIDATION_ERROR,
      ERROR_MESSAGES.INVALID_UUID,
      {
        statusCode: HttpStatusCode.BAD_REQUEST,
        details: { id: "Must be a valid UUID" },
      }
    );
  }

  const currentUserId = optionalAuthentication(request);
  const article = await ArticleService.getArticleById(id, currentUserId!);

    if (!article) {
    return createNotFoundResponse(ERROR_MESSAGES.ARTICLE_NOT_FOUND);
  }

  return createSuccessResponse({ article });
});

export const PUT = withErrorHandling(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  await ensureDatabaseConnection();
  
  const authResult = authenticateRequest(request);
  if (!authResult.success) {
    return createErrorResponse(
      authResult.error!.code,
      authResult.error!.message,
      { statusCode: authResult.error!.statusCode }
    );
  }

    const { id } = await context.params;
  
  if (!isValidUUID(id)) {
    return createErrorResponse(
      ErrorCode.VALIDATION_ERROR,
      ERROR_MESSAGES.INVALID_UUID,
      {
        statusCode: HttpStatusCode.BAD_REQUEST,
        details: { id: "Must be a valid UUID" },
      }
    );
  }

  const body = await request.json();
  const { title, description, content, imageUrl, tags, categoryId } = body;

  if (imageUrl !== undefined) {
    const existingArticle = await ArticleService.getArticleById(id, authResult.userId);
    if (existingArticle && existingArticle.imageUrl && imageUrl !== existingArticle.imageUrl) {
      const publicId = getCloudinaryPublicIdFromUrl(existingArticle.imageUrl);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
      }
    }
  }

  const result = await ArticleService.updateArticle(
    id,
    { title, description, content, imageUrl, tags, categoryId },
    authResult.userId!
  );

  if (!result.success) {
    if (result.errors?.some(e => e.code === ErrorCode.NOT_FOUND)) {
      return createNotFoundResponse(ERROR_MESSAGES.ARTICLE_NOT_FOUND);
    }

    const validationDetails: Record<string, string> = {};
    result.errors?.forEach(error => {
      validationDetails[error.field] = error.message;
    });

    return createErrorResponse(
      ErrorCode.VALIDATION_ERROR,
      ERROR_MESSAGES.ARTICLE_UPDATE_FAILED,
      {
        statusCode: HttpStatusCode.BAD_REQUEST,
        details: validationDetails,
      }
    );
  }

  return createSuccessResponse(result.article, {
    message: SUCCESS_MESSAGES.ARTICLE_UPDATED,
  });
});

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  await ensureDatabaseConnection();
  
  const authResult = authenticateRequest(request);
  if (!authResult.success) {
    return createErrorResponse(
      authResult.error!.code,
      authResult.error!.message,
      { statusCode: authResult.error!.statusCode }
    );
  }

    const { id } = await context.params;
  
  if (!isValidUUID(id)) {
    return createErrorResponse(
      ErrorCode.VALIDATION_ERROR,
      ERROR_MESSAGES.INVALID_UUID,
      {
        statusCode: HttpStatusCode.BAD_REQUEST,
        details: { id: "Must be a valid UUID" },
      }
    );
  }

  const existingArticle = await ArticleService.getArticleById(id, authResult.userId);
  if (existingArticle && existingArticle.imageUrl) {
    const publicId = getCloudinaryPublicIdFromUrl(existingArticle.imageUrl);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
      }
    }

  const result = await ArticleService.deleteArticle(id, authResult.userId!);

  if (!result.success) {
    return createNotFoundResponse(ERROR_MESSAGES.ARTICLE_NOT_FOUND);
  }

  return createSuccessResponse(null, {
    message: SUCCESS_MESSAGES.ARTICLE_DELETED,
  });
});
