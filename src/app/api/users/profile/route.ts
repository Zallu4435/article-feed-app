import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/database";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();

    let token: string | undefined;
    const auth = request.headers.get('authorization');
    if (auth) {
      token = auth.split(' ')[1];
    } else {
      token = request.cookies.get('access_token')?.value;
    }
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    } catch {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }
    const userId = decoded.userId;

    const userWithPreferences = await prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: { include: { category: true } } }
    });
    if (!userWithPreferences) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { password: _, ...userWithoutPassword } = userWithPreferences as any;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await initializeDatabase();
    let token: string | undefined;
    const auth = request.headers.get('authorization');
    if (auth) {
      token = auth.split(' ')[1];
    } else {
      token = request.cookies.get('access_token')?.value;
    }
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    } catch {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }
    const userId = decoded.userId;
    const body = await request.json();
    const { firstName, lastName, phone, dateOfBirth, profilePicture } = body as { 
      firstName?: string; 
      lastName?: string; 
      phone?: string; 
      dateOfBirth?: string;
      profilePicture?: string | null;
    };

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    if (profilePicture === null && existingUser.profilePicture) {
      try {
        const urlParts = existingUser.profilePicture.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        if (uploadIndex !== -1 && urlParts[uploadIndex + 2]) {
          const publicIdWithFolder = urlParts.slice(uploadIndex + 2).join('/');
          const publicId = publicIdWithFolder.replace(/\.[^/.]+$/, '');
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (error) {
        console.warn('Failed to delete profile picture from Cloudinary:', error);
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName ?? existingUser.firstName,
        lastName: lastName ?? existingUser.lastName,
        phone: phone ?? existingUser.phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : existingUser.dateOfBirth,
        profilePicture: profilePicture !== undefined ? profilePicture : existingUser.profilePicture
      }
    });

    const { password: _, ...userWithoutPassword } = updated as any;
    return NextResponse.json({
      message: "Profile updated successfully",
      user: userWithoutPassword
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await initializeDatabase();
    
    let token: string | undefined;
    const auth = request.headers.get('authorization');
    if (auth) {
      token = auth.split(' ')[1];
    } else {
      token = request.cookies.get('access_token')?.value;
    }
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    } catch {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const userId = decoded.userId;

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.userPreference.deleteMany({ where: { userId } }),
      prisma.refreshToken.deleteMany({ where: { userId } }),
      prisma.article.deleteMany({ where: { authorId: userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    const res = NextResponse.json({ message: 'Account deleted' });

    res.cookies.set('access_token', '', { httpOnly: true, maxAge: 0, path: '/' });
    res.cookies.set('refresh_token', '', { httpOnly: true, maxAge: 0, path: '/' });
    return res;
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
