import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.expenseCategory.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(categories);
  } catch (e) {
    console.error("GET /api/admin/expense-categories error:", e);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, color } = body;
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }
    const existing = await prisma.expenseCategory.findFirst({
      where: {
        name: { equals: name.trim(), mode: "insensitive" },
        deletedAt: null,
      },
    });
    if (existing) {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 });
    }
    const category = await prisma.expenseCategory.create({
      data: { name: name.trim(), color: color || null },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/expense-categories error:", e);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, name, color } = await request.json();
    if (!id) return NextResponse.json({ error: "Category ID required" }, { status: 400 });
    if (name !== undefined) {
      const existing = await prisma.expenseCategory.findFirst({
        where: {
          name: { equals: name.trim(), mode: "insensitive" },
          deletedAt: null,
          id: { not: id },
        },
      });
      if (existing) {
        return NextResponse.json({ error: "Category name already exists" }, { status: 409 });
      }
    }
    const category = await prisma.expenseCategory.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(color !== undefined ? { color: color || null } : {}),
      },
    });
    return NextResponse.json(category);
  } catch (e) {
    console.error("PATCH /api/admin/expense-categories error:", e);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "Category ID required" }, { status: 400 });
    const inUse = await prisma.expense.count({
      where: { categoryId: id, deletedAt: null },
    });
    if (inUse > 0) {
      return NextResponse.json(
        { error: "Cannot delete category that is in use by expenses" },
        { status: 409 }
      );
    }
    await prisma.expenseCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/admin/expense-categories error:", e);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
