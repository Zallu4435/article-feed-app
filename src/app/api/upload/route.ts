import { NextRequest } from "next/server";
import { authenticateRequest } from "@/helpers/auth";
import { validateFileType, validateFileSize } from "@/helpers/validation";
import { createSuccessResponse, createErrorResponse, withErrorHandling } from "@/helpers/response";
import { HttpStatusCode, ErrorCode } from "@/constants/status-codes";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "@/constants/messages";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const POST = withErrorHandling(async (request: NextRequest) => {
  const authResult = authenticateRequest(request);
  if (!authResult.success) {
    return createErrorResponse(
      authResult.error!.code,
      authResult.error!.message,
      { statusCode: authResult.error!.statusCode }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return createErrorResponse(
      ErrorCode.MISSING_REQUIRED_FIELD,
      'No file provided',
      { statusCode: HttpStatusCode.BAD_REQUEST }
    );
  }

  if (!validateFileType(file, ALLOWED_IMAGE_TYPES)) {
    return createErrorResponse(
      ErrorCode.VALIDATION_ERROR,
      ERROR_MESSAGES.INVALID_FILE_TYPE,
      { statusCode: HttpStatusCode.BAD_REQUEST }
    );
  }

  if (!validateFileSize(file, MAX_FILE_SIZE)) {
    return createErrorResponse(
      ErrorCode.VALIDATION_ERROR,
      ERROR_MESSAGES.FILE_TOO_LARGE,
      { statusCode: HttpStatusCode.BAD_REQUEST }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await new Promise<any>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: "article-feeds-app",
        resource_type: "auto",
        transformation: [
          { width: 1200, height: 800, crop: "limit" },
          { quality: "auto:good" },
          { format: "auto" }
        ]
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });

  return createSuccessResponse({
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes
  }, {
    message: SUCCESS_MESSAGES.FILE_UPLOADED,
  });
});
