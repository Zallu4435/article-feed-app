import { NextRequest } from "next/server";
import { ensureDatabaseConnection } from "@/helpers/database";
import { authenticateRequest } from "@/helpers/auth";
import { createSuccessResponse, createErrorResponse, withErrorHandling } from "@/helpers/response";
import { UserService } from "@/services/user.service";
import { HttpStatusCode, ErrorCode } from "@/constants/status-codes";

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

  const result = await UserService.getDashboardStats(authResult.userId!);

  if (!result.success) {
    return createErrorResponse(
      ErrorCode.OPERATION_FAILED,
      result.error!,
      { statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR }
    );
  }

  return createSuccessResponse(result.stats);
});
