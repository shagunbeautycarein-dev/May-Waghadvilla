import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";

// GET /api/admin/expenses?categoryId=&from=&to=&mode=
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const mode = searchParams.get("mode");

    const where: Record<string, unknown> = { deletedAt: null };
    if (categoryId) where.categoryId = categoryId;
    if (mode) where.paymentMode = mode;
    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to);
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      include: { expenseCategory: true },
    });

    return NextResponse.json(expenses);
  } catch (e) {
    console.error("GET /api/admin/expenses error:", e);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

// POST /api/admin/expenses
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      categoryId,
      amount,
      date,
      vendorName,
      paymentMode,
      billImage,
      description,
      isRecurring,
    } = body;

    if (!categoryId || !amount || !date) {
      return NextResponse.json(
        { error: "Category, amount, and date are required" },
        { status: 400 }
      );
    }

    const category = await prisma.expenseCategory.findFirst({
      where: { id: categoryId, deletedAt: null },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    const expense = await prisma.$transaction(async (tx) => {
      const created = await tx.expense.create({
        data: {
          categoryId,
          category: category.name,
          amount: Number(amount),
          date: new Date(date),
          vendorName: vendorName || null,
          paymentMode: paymentMode || null,
          billImage: billImage || null,
          description: description || null,
          isRecurring: Boolean(isRecurring),
        },
      });

      if (isRecurring) {
        const nextMonth = new Date(date);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        await tx.expense.create({
          data: {
            categoryId,
            category: category.name,
            amount: Number(amount),
            date: nextMonth,
            vendorName: vendorName || null,
            paymentMode: paymentMode || null,
            billImage: billImage || null,
            description: description || null,
            isRecurring: false,
            parentId: created.id,
          },
        });
      }

      return created;
    });

    const admin = await getCurrentAdmin();
    await logAudit({
      adminId: admin?.id,
      adminName: admin?.name,
      action: "CREATE",
      entity: "Expense",
      entityId: expense.id,
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/expenses error:", e);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/expenses
export async function PATCH(request: Request) {
  try {
    const { id, ...updates } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "Expense ID required" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {
      amount: updates.amount ? Number(updates.amount) : undefined,
      date: updates.date ? new Date(updates.date) : undefined,
    };

    if (updates.categoryId !== undefined) {
      data.categoryId = updates.categoryId;
      if (updates.categoryId) {
        const cat = await prisma.expenseCategory.findFirst({
          where: { id: updates.categoryId, deletedAt: null },
        });
        if (cat) data.category = cat.name;
      }
    }
    if (updates.vendorName !== undefined) data.vendorName = updates.vendorName;
    if (updates.paymentMode !== undefined) data.paymentMode = updates.paymentMode;
    if (updates.billImage !== undefined) data.billImage = updates.billImage;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.isRecurring !== undefined) data.isRecurring = updates.isRecurring;

    // Remove undefined values
    Object.keys(data).forEach((key) => {
      if (data[key] === undefined) delete data[key];
    });

    const expense = await prisma.expense.update({
      where: { id },
      data,
    });

    const admin = await getCurrentAdmin();
    await logAudit({
      adminId: admin?.id,
      adminName: admin?.name,
      action: "UPDATE",
      entity: "Expense",
      entityId: id,
    });

    return NextResponse.json(expense);
  } catch (e) {
    console.error("PATCH /api/admin/expenses error:", e);
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/expenses (soft delete)
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "Expense ID required" },
        { status: 400 }
      );
    }

    await prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    const admin = await getCurrentAdmin();
    await logAudit({
      adminId: admin?.id,
      adminName: admin?.name,
      action: "DELETE",
      entity: "Expense",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/admin/expenses error:", e);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
