import { NextRequest, NextResponse } from "next/server";
import { getDatabase, initializeDatabase } from "@/lib/database";
import { UserPreference } from "@/entities/UserPreference";
import { Category } from "@/entities/Category";
import jwt from "jsonwebtoken";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    // Prefer cookie, fallback to Authorization header
    const cookieToken = request.cookies.get('access_token')?.value;
    const auth = request.headers.get('authorization');
    const headerToken = auth?.startsWith('Bearer ')? auth.slice('Bearer '.length) : undefined;
    const token = cookieToken || headerToken;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const userId = decoded?.userId;
    const preferenceRepository = getDatabase().getRepository(UserPreference);

    const preferences = await preferenceRepository.find({
      where: { userId },
      relations: ["category"]
    });

    return NextResponse.json({ preferences });

  } catch (error) {
    console.error("Get preferences error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const body = await request.json();
    const { categoryId } = body;
    // Prefer cookie, fallback to Authorization header
    const cookieToken = request.cookies.get('access_token')?.value;
    const auth = request.headers.get('authorization');
    const headerToken = auth?.startsWith('Bearer ')? auth.slice('Bearer '.length) : undefined;
    const token = cookieToken || headerToken;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const userId = decoded?.userId;

    if (!categoryId) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const preferenceRepository = db.getRepository(UserPreference);
    const categoryRepository = db.getRepository(Category);

    // Resolve category: allow UUID id or name string (e.g., "business")
    let resolvedCategoryId: string | null = null;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(String(categoryId))) {
      resolvedCategoryId = String(categoryId);
    } else {
      const cat = await categoryRepository.findOne({ where: { name: String(categoryId) } });
      if (!cat) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
      resolvedCategoryId = cat.id;
    }

    // Check if preference already exists
    const existingPreference = await preferenceRepository.findOne({ where: { userId, categoryId: resolvedCategoryId } });

    if (existingPreference) {
      return NextResponse.json(
        { error: "Preference already exists" },
        { status: 409 }
      );
    }

    // Create preference
    const preference = preferenceRepository.create({ userId, categoryId: resolvedCategoryId });

    await preferenceRepository.save(preference);

    return NextResponse.json({
      message: "Preference added successfully",
      preference
    }, { status: 201 });

  } catch (error) {
    console.error("Add preference error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await initializeDatabase();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    // Prefer cookie, fallback to Authorization header
    const cookieToken = request.cookies.get('access_token')?.value;
    const auth = request.headers.get('authorization');
    const headerToken = auth?.startsWith('Bearer ')? auth.slice('Bearer '.length) : undefined;
    const token = cookieToken || headerToken;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const userId = decoded?.userId;

    if (!categoryId) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const preferenceRepository = db.getRepository(UserPreference);
    const categoryRepository = db.getRepository(Category);

    // Resolve category: allow UUID id or name string
    let resolvedCategoryId: string | null = null;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(String(categoryId))) {
      resolvedCategoryId = String(categoryId);
    } else {
      const cat = await categoryRepository.findOne({ where: { name: String(categoryId) } });
      if (!cat) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
      resolvedCategoryId = cat.id;
    }

    // Find and delete preference
    const preference = await preferenceRepository.findOne({ where: { userId, categoryId: resolvedCategoryId } });

    if (!preference) {
      return NextResponse.json(
        { error: "Preference not found" },
        { status: 404 }
      );
    }

    await preferenceRepository.remove(preference);

    return NextResponse.json({
      message: "Preference removed successfully"
    });

  } catch (error) {
    console.error("Remove preference error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
