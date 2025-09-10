import { NextRequest, NextResponse } from "next/server";
import { getDatabase, initializeDatabase } from "@/lib/database";
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
    const { User } = await import("@/entities/User");
    const userRepository = getDatabase().getRepository(User);

    const userWithPreferences = await userRepository.findOne({
      where: { id: userId },
      relations: ["preferences", "preferences.category"]
    });
    if (!userWithPreferences) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { password: _, ...userWithoutPassword } = userWithPreferences;
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
    const { User } = await import("@/entities/User");
    const userRepository = getDatabase().getRepository(User);
    const body = await request.json();
    const { firstName, lastName, phone, dateOfBirth, profilePicture } = body as { 
      firstName?: string; 
      lastName?: string; 
      phone?: string; 
      dateOfBirth?: string;
      profilePicture?: string;
    };

    const existingUser = await userRepository.findOne({
      where: { id: userId }
    });
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

    Object.assign(existingUser, {
      firstName: firstName || existingUser.firstName,
      lastName: lastName || existingUser.lastName,
      phone: phone || existingUser.phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : existingUser.dateOfBirth,
      profilePicture: profilePicture !== undefined ? profilePicture : existingUser.profilePicture
    });

    await userRepository.save(existingUser);
    const { password: _, ...userWithoutPassword } = existingUser;
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
    const db = getDatabase();
    const { User } = await import("@/entities/User");
    const { RefreshToken } = await import("@/entities/RefreshToken");
    const { UserPreference } = await import("@/entities/UserPreference");
    const { Article } = await import("@/entities/Article");

    const userRepo = db.getRepository(User);
    const refreshRepo = db.getRepository(RefreshToken);
    const prefRepo = db.getRepository(UserPreference);
    const articleRepo = db.getRepository(Article);

    const existingUser = await userRepo.findOne({ where: { id: userId } });
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prefRepo.delete({ userId });
    await refreshRepo.delete({ user: { id: userId } as any });
    await articleRepo.delete({ authorId: userId });

    await userRepo.delete({ id: userId });

    const res = NextResponse.json({ message: 'Account deleted' });

    res.cookies.set('access_token', '', { httpOnly: true, maxAge: 0, path: '/' });
    res.cookies.set('refresh_token', '', { httpOnly: true, maxAge: 0, path: '/' });
    return res;
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
