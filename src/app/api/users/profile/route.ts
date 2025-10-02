import { NextRequest, NextResponse } from "next/server";
import { ensureDatabaseConnection } from "@/helpers/database";
import { authenticateRequest } from "@/helpers/auth";
import { createSuccessResponse, createErrorResponse, createNotFoundResponse, withErrorHandling } from "@/helpers/response";
import { UserService } from "@/services/user.service";
import { HttpStatusCode, ErrorCode } from "@/constants/status-codes";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "@/constants/messages";
import { v2 as cloudinary } from "cloudinary";
import prisma from "@/lib/prisma";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

  const result = await UserService.getUserProfile(authResult.userId!);

  if (!result.success) {
    return createNotFoundResponse(ERROR_MESSAGES.PROFILE_UPDATE_FAILED);
  }

  return createSuccessResponse({ user: result.user });
});

export const PUT = withErrorHandling(async (request: NextRequest) => {
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
  const { firstName, lastName, phone, dateOfBirth, profilePicture } = body;

  if (profilePicture === null) {
    const existingUser = await prisma.user.findUnique({ 
      where: { id: authResult.userId },
      select: { profilePicture: true }
    });
    
    if (existingUser?.profilePicture) {
      const urlParts = existingUser.profilePicture.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      if (uploadIndex !== -1 && urlParts[uploadIndex + 2]) {
        const publicIdWithFolder = urlParts.slice(uploadIndex + 2).join('/');
        const publicId = publicIdWithFolder.replace(/\.[^/.]+$/, '');
        await cloudinary.uploader.destroy(publicId);
      }
    }
  }

  const result = await UserService.updateUserProfile(authResult.userId!, {
    firstName,
    lastName,
    phone,
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    profilePictureUrl: profilePicture !== undefined ? profilePicture : undefined,
  });

  if (!result.success) {
    return createErrorResponse(
      ErrorCode.OPERATION_FAILED,
      result.error!,
      { statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR }
    );
  }

  return createSuccessResponse({ user: result.user }, {
    message: SUCCESS_MESSAGES.PROFILE_UPDATED,
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

  const userId = authResult.userId!;

  const existingUser = await prisma.user.findUnique({ 
    where: { id: userId },
    select: { id: true, profilePicture: true }
  });
  
  if (!existingUser) {
    return createNotFoundResponse('User not found');
  }

  if (existingUser.profilePicture) {
    const urlParts = existingUser.profilePicture.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    if (uploadIndex !== -1 && urlParts[uploadIndex + 2]) {
      const publicIdWithFolder = urlParts.slice(uploadIndex + 2).join('/');
      const publicId = publicIdWithFolder.replace(/\.[^/.]+$/, '');
      await cloudinary.uploader.destroy(publicId);
    }
  }

    await prisma.$transaction([
      prisma.userPreference.deleteMany({ where: { userId } }),
      prisma.refreshToken.deleteMany({ where: { userId } }),
      prisma.article.deleteMany({ where: { authorId: userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

  const response = NextResponse.json({
    success: true,
    data: null,
    message: 'Account deleted successfully',
  });

  response.cookies.set('access_token', '', { httpOnly: true, maxAge: 0, path: '/' });
  response.cookies.set('refresh_token', '', { httpOnly: true, maxAge: 0, path: '/' });
  
  return response;
});
