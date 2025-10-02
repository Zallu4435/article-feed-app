import { NextRequest } from "next/server";
import { ensureDatabaseConnection } from "@/helpers/database";
import { authenticateRequest, isValidUUID } from "@/helpers/auth";
import { createSuccessResponse, createErrorResponse, withErrorHandling } from "@/helpers/response";
import { UserService } from "@/services/user.service";
import { HttpStatusCode, ErrorCode } from "@/constants/status-codes";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "@/constants/messages";
import prisma from "@/lib/prisma";

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

  const result = await UserService.getUserPreferences(authResult.userId!);

  if (!result.success) {
    return createErrorResponse(
      ErrorCode.OPERATION_FAILED,
      result.error!,
      { statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR }
    );
  }

  return createSuccessResponse({ preferences: result.preferences });
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
  const { categoryId } = body;

  if (!categoryId) {
    return createErrorResponse(
      ErrorCode.MISSING_REQUIRED_FIELD,
      'Category ID is required',
      { statusCode: HttpStatusCode.BAD_REQUEST }
    );
  }

  let resolvedCategoryId: string;
  if (isValidUUID(categoryId)) {
    resolvedCategoryId = categoryId;
  } else {
    const category = await prisma.category.findUnique({ where: { name: categoryId } });
    if (!category) {
      return createErrorResponse(
        ErrorCode.NOT_FOUND,
        'Category not found',
        { statusCode: HttpStatusCode.NOT_FOUND }
      );
    }
    resolvedCategoryId = category.id;
  }

  const result = await UserService.addUserPreference(authResult.userId!, resolvedCategoryId);

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

  return createSuccessResponse(result.preference, {
    message: SUCCESS_MESSAGES.PREFERENCES_UPDATED,
    statusCode: HttpStatusCode.CREATED,
  });
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
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
  const categoryId = searchParams.get("categoryId");

  if (!categoryId) {
    return createErrorResponse(
      ErrorCode.MISSING_REQUIRED_FIELD,
      'Category ID is required',
      { statusCode: HttpStatusCode.BAD_REQUEST }
    );
  }

  let resolvedCategoryId: string;
  if (isValidUUID(categoryId)) {
    resolvedCategoryId = categoryId;
  } else {
    const category = await prisma.category.findUnique({ where: { name: categoryId } });
    if (!category) {
      return createErrorResponse(
        ErrorCode.NOT_FOUND,
        'Category not found',
        { statusCode: HttpStatusCode.NOT_FOUND }
      );
    }
    resolvedCategoryId = category.id;
  }

  const result = await UserService.removeUserPreference(authResult.userId!, resolvedCategoryId);

  if (!result.success) {
    return createErrorResponse(
      ErrorCode.OPERATION_FAILED,
      result.error!,
      { statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR }
    );
  }

  return createSuccessResponse(null, {
    message: SUCCESS_MESSAGES.PREFERENCES_UPDATED,
  });
});
