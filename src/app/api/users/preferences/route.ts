import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/database";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();

    const cookieToken = request.cookies.get('access_token')?.value;
    const auth = request.headers.get('authorization');
    const headerToken = auth?.startsWith('Bearer ')? auth.slice('Bearer '.length) : undefined;
    const token = cookieToken || headerToken;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const userId = decoded?.userId;

    const preferences = await prisma.userPreference.findMany({
      where: { userId },
      include: { category: true }
    });

    return NextResponse.json({ preferences });

  } catch (error) {
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
    const { categoryId } = body as { categoryId?: string };
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

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    let resolvedCategoryId: string | null = null;
    if (uuidRegex.test(String(categoryId))) {
      resolvedCategoryId = String(categoryId);
    } else {
      const cat = await prisma.category.findUnique({ where: { name: String(categoryId) } });
      if (!cat) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
      resolvedCategoryId = cat.id;
    }

    const existingPreference = await prisma.userPreference.findFirst({ where: { userId, categoryId: resolvedCategoryId } });

    if (existingPreference) {
      return NextResponse.json(
        { error: "Preference already exists" },
        { status: 409 }
      );
    }

    const preference = await prisma.userPreference.create({ data: { userId, categoryId: resolvedCategoryId } });

    return NextResponse.json({
      message: "Preference added successfully",
      preference
    }, { status: 201 });

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
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

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

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    let resolvedCategoryId: string | null = null;
    if (uuidRegex.test(String(categoryId))) {
      resolvedCategoryId = String(categoryId);
    } else {
      const cat = await prisma.category.findUnique({ where: { name: String(categoryId) } });
      if (!cat) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
      resolvedCategoryId = cat.id;
    }

    const preference = await prisma.userPreference.findFirst({ where: { userId, categoryId: resolvedCategoryId } });

    if (!preference) {
      return NextResponse.json(
        { error: "Preference not found" },
        { status: 404 }
      );
    }

    await prisma.userPreference.delete({ where: { id: preference.id } });

    return NextResponse.json({
      message: "Preference removed successfully"
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
