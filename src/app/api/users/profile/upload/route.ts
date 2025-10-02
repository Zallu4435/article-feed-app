import { NextRequest } from "next/server";
import { ensureDatabaseConnection } from "@/helpers/database";
import { authenticateRequest } from "@/helpers/auth";
import { validateFileType, validateFileSize } from "@/helpers/validation";
import { createSuccessResponse, createErrorResponse, withErrorHandling } from "@/helpers/response";
import { HttpStatusCode, ErrorCode } from "@/constants/status-codes";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "@/constants/messages";
import { v2 as cloudinary } from "cloudinary";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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
      'Invalid file type. Only JPEG and PNG are allowed.',
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

  const user = await prisma.user.findUnique({
    where: { id: authResult.userId },
    select: { profilePicture: true }
  });

  if (!user) {
    return createErrorResponse(
      ErrorCode.USER_NOT_FOUND,
      ERROR_MESSAGES.USER_NOT_FOUND,
      { statusCode: HttpStatusCode.NOT_FOUND }
    );
  }

  if (user.profilePicture) {
    const urlParts = user.profilePicture.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    if (uploadIndex !== -1 && urlParts[uploadIndex + 2]) {
      const publicIdWithFolder = urlParts.slice(uploadIndex + 2).join('/');
      const oldPublicId = publicIdWithFolder.replace(/\.[^/.]+$/, '');
      await cloudinary.uploader.destroy(oldPublicId);
    }
  }

  const result = await new Promise<any>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: "article-feeds-app/profiles",
        resource_type: "image",
        transformation: [
          { width: 400, height: 400, crop: "fill", gravity: "face" },
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

  const profilePictureUrl = result.secure_url;

  await prisma.user.update({
    where: { id: authResult.userId },
    data: { profilePicture: profilePictureUrl }
  });

  return createSuccessResponse({
    profilePictureUrl,
    publicId: result.public_id,
    width: result.width,
    height: result.height
  }, {
    message: SUCCESS_MESSAGES.AVATAR_UPLOADED,
  });
});