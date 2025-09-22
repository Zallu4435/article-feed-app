import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/database";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();

    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ categories });

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
    const { name, description } = body as { name?: string; description?: string | null };

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const existingCategory = await prisma.category.findUnique({ where: { name } });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category with this name already exists" },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({ data: { name, description: description ?? null } });

    return NextResponse.json({
      message: "Category created successfully",
      category
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
