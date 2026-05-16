import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, items } = body;

    if (!date || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Date and at least one expense item are required" },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (!item.categoryId || !item.amount || item.amount <= 0) {
        return NextResponse.json(
          { error: "Each expense must have a category and positive amount" },
          { status: 400 }
        );
      }
    }

    const categoryIds = [...new Set(items.map((i) => i.categoryId))];
    const categories = await prisma.expenseCategory.findMany({
      where: { id: { in: categoryIds }, deletedAt: null },
    });

    if (categories.length !== categoryIds.length) {
      return NextResponse.json(
        { error: "One or more invalid category IDs" },
        { status: 400 }
      );
    }

    const catMap: Record<string, string> = {};
    for (const c of categories) catMap[c.id] = c.name;

    const baseDate = new Date(date);
    const created = await prisma.$transaction(
      items.map((item) =>
        prisma.expense.create({
          data: {
            categoryId: item.categoryId,
            category: catMap[item.categoryId] || null,
            amount: Number(item.amount),
            date: baseDate,
            vendorName: item.vendorName || null,
            paymentMode: item.paymentMode || null,
            description: item.description || null,
            billImage: item.billImage || null,
            isRecurring: false,
          },
        })
      )
    );

    return NextResponse.json(
      { count: created.length, expenses: created },
      { status: 201 }
    );
  } catch (e) {
    console.error("POST /api/admin/expenses/bulk error:", e);
    return NextResponse.json(
      { error: "Failed to create expenses" },
      { status: 500 }
    );
  }
}
