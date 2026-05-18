import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function deriveSource(method: string | null | undefined): "Bank" | "Cash" {
  if (!method) return "Bank";
  return method === "Cash" ? "Cash" : "Bank";
}

function storeValue(source: "Bank" | "Cash"): string {
  return source === "Cash" ? "Cash" : "Bank Transfer";
}

type StatementItem = {
  id: string;
  date: string;
  description: string;
  type: "incoming" | "outgoing";
  category: string;
  amount: number;
  source: "Bank" | "Cash";
  recordType: "payment" | "expense" | "electricity";
  parentId?: string | null;
  balance: number;
};

// GET /api/admin/accounting/statement?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    if (!fromParam || !toParam) {
      return NextResponse.json(
        { error: "from and to dates are required" },
        { status: 400 }
      );
    }

    const fromDate = new Date(fromParam);
    const toDate = new Date(toParam);
    toDate.setHours(23, 59, 59, 999);

    // === INCOMING: Approved Payments ===
    const payments = await prisma.payment.findMany({
      where: {
        status: "Approved",
        createdAt: { gte: fromDate, lte: toDate },
      },
      include: { guest: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    });

    // === INCOMING: Paid Electricity Splits ===
    const electricitySplits = await prisma.electricitySplit.findMany({
      where: {
        status: "Paid",
        createdAt: { gte: fromDate, lte: toDate },
      },
      include: {
        guest: { select: { name: true } },
        bed: { select: { name: true } },
        payment: { select: { method: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // === OUTGOING: Expenses ===
    const expenses = await prisma.expense.findMany({
      where: {
        deletedAt: null,
        date: { gte: fromDate, lte: toDate },
      },
      include: { expenseCategory: true },
      orderBy: { date: "asc" },
    });

    const items: Omit<StatementItem, "balance">[] = [];

    payments.forEach((p) => {
      const depAmt = Number(p.depositAmount || 0);
      const rentAmt = Number(p.rentAmount || 0);
      const totalSplit = depAmt + rentAmt;
      const guestName = p.guest?.name || "Guest";
      const source = deriveSource(p.method);

      if (totalSplit > 0) {
        if (rentAmt > 0) {
          items.push({
            id: `${p.id}-rent`,
            date: p.createdAt.toISOString(),
            description: `Rent from ${guestName}`,
            type: "incoming",
            category: "Rent",
            amount: rentAmt,
            source,
            recordType: "payment",
            parentId: p.id,
          });
        }
        if (depAmt > 0) {
          items.push({
            id: `${p.id}-deposit`,
            date: p.createdAt.toISOString(),
            description: `Deposit from ${guestName}`,
            type: "incoming",
            category: "Deposit",
            amount: depAmt,
            source,
            recordType: "payment",
            parentId: p.id,
          });
        }
      } else {
        items.push({
          id: p.id,
          date: p.createdAt.toISOString(),
          description: `${p.type} from ${guestName}`,
          type: "incoming",
          category: p.type,
          amount: Number(p.amount),
          source,
          recordType: "payment",
        });
      }
    });

    electricitySplits.forEach((e) => {
      const guestName = e.guest?.name || "Guest";
      const bedName = e.bed?.name || "Bed";
      const source = deriveSource(e.payment?.method);
      items.push({
        id: e.id,
        date: e.createdAt.toISOString(),
        description: `Electricity - ${guestName} (${bedName})`,
        type: "incoming",
        category: "Electricity",
        amount: Number(e.amount),
        source,
        recordType: "electricity",
        parentId: e.paymentId,
      });
    });

    expenses.forEach((e) => {
      items.push({
        id: e.id,
        date: e.date.toISOString(),
        description: e.description || e.expenseCategory?.name || "Expense",
        type: "outgoing",
        category: e.expenseCategory?.name || e.category || "Unknown",
        amount: Number(e.amount),
        source: deriveSource(e.paymentMode),
        recordType: "expense",
      });
    });

    // Sort chronologically
    items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Compute running balance
    let balance = 0;
    const itemsWithBalance: StatementItem[] = items.map((item) => {
      if (item.type === "incoming") {
        balance += item.amount;
      } else {
        balance -= item.amount;
      }
      return { ...item, balance };
    });

    const totalIncoming = items
      .filter((i) => i.type === "incoming")
      .reduce((s, i) => s + i.amount, 0);

    const totalOutgoing = items
      .filter((i) => i.type === "outgoing")
      .reduce((s, i) => s + i.amount, 0);

    return NextResponse.json({
      items: itemsWithBalance,
      summary: {
        totalIncoming,
        totalOutgoing,
        openingBalance: 0,
        closingBalance: balance,
      },
    });
  } catch (e) {
    console.error("GET /api/admin/accounting/statement error:", e);
    return NextResponse.json(
      { error: "Failed to fetch statement" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/accounting/statement
// Body: { id, source, recordType }
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, source, recordType } = body;

    if (!id || !source || !recordType) {
      return NextResponse.json(
        { error: "id, source, and recordType are required" },
        { status: 400 }
      );
    }

    const storedMethod = storeValue(source);

    if (recordType === "payment") {
      // For split payment items (id like "uuid-rent" or "uuid-deposit"), extract base id
      const baseId = id.includes("-") ? id.split("-")[0] : id;
      await prisma.payment.update({
        where: { id: baseId },
        data: { method: storedMethod },
      });
    } else if (recordType === "expense") {
      await prisma.expense.update({
        where: { id },
        data: { paymentMode: storedMethod },
      });
    } else if (recordType === "electricity") {
      // For electricity, update the linked payment if available
      const split = await prisma.electricitySplit.findUnique({
        where: { id },
        select: { paymentId: true },
      });
      if (split?.paymentId) {
        await prisma.payment.update({
          where: { id: split.paymentId },
          data: { method: storedMethod },
        });
      } else {
        return NextResponse.json(
          { error: "No linked payment to update" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("PATCH /api/admin/accounting/statement error:", e);
    return NextResponse.json(
      { error: "Failed to update source" },
      { status: 500 }
    );
  }
}
