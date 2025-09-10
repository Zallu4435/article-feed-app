import { NextRequest, NextResponse } from "next/server";
import { getDatabase, initializeDatabase } from "@/lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    const { Category } = await import("@/entities/Category");
    const categoryRepository = getDatabase().getRepository(Category);

    const categories = await categoryRepository.find({
      order: { name: "ASC" }
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
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const { Category } = await import("@/entities/Category");
    const categoryRepository = getDatabase().getRepository(Category);

    const existingCategory = await categoryRepository.findOne({
      where: { name }
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category with this name already exists" },
        { status: 409 }
      );
    }

    const category = categoryRepository.create({
      name,
      description
    });

    await categoryRepository.save(category);

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
