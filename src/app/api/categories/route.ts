import { NextRequest } from "next/server";
import { ensureDatabaseConnection } from "@/helpers/database";
import { authenticateRequest } from "@/helpers/auth";
import { createSuccessResponse, createErrorResponse, withErrorHandling } from "@/helpers/response";
import { CategoryService } from "@/services/category.service";
import { HttpStatusCode, ErrorCode } from "@/constants/status-codes";
import { SUCCESS_MESSAGES } from "@/constants/messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async (request: NextRequest) => {
  await ensureDatabaseConnection();

  const result = await CategoryService.getAllCategories();

  if (!result.success) {
    return createErrorResponse(
      ErrorCode.OPERATION_FAILED,
      result.error!,
      { statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR }
    );
  }

  return createSuccessResponse({ categories: result.categories });
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
  const { name, description } = body;

  if (!name) {
    return createErrorResponse(
      ErrorCode.MISSING_REQUIRED_FIELD,
      "Category name is required",
      { statusCode: HttpStatusCode.BAD_REQUEST }
    );
  }

  const result = await CategoryService.createCategory({ name, description });

  if (!result.success) {
    const statusCode = result.error?.includes('already exists') 
      ? HttpStatusCode.CONFLICT 
      : HttpStatusCode.INTERNAL_SERVER_ERROR;
    
    return createErrorResponse(
      result.error?.includes('already exists') ? ErrorCode.ALREADY_EXISTS : ErrorCode.OPERATION_FAILED,
      result.error!,
      { statusCode }
    );
  }

  return createSuccessResponse(result.category, {
    message: SUCCESS_MESSAGES.CATEGORY_CREATED,
    statusCode: HttpStatusCode.CREATED,
  });
});
