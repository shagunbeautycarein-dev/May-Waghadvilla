import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/accounting?month=&year=
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    const now = new Date();
    const month = monthParam ? Number(monthParam) : now.getMonth() + 1;
    const year = yearParam ? Number(yearParam) : now.getFullYear();

    let startDate: Date;
    let endDate: Date;
    if (month === 0) {
      // All months
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    } else {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59, 999);
    }

    // === INCOME ===
    const approvedPayments = await prisma.payment.findMany({
      where: {
        status: "Approved",
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    let rentIncome = 0;
    let depositIncome = 0;

    for (const p of approvedPayments) {
      const depAmt = Number(p.depositAmount || 0);
      const rentAmt = Number(p.rentAmount || 0);

      if (depAmt > 0 || rentAmt > 0) {
        // Use split fields
        rentIncome += rentAmt;
        depositIncome += depAmt;
      } else {
        // Fallback: classify by type
        if (p.type === "Rent") rentIncome += Number(p.amount);
        else if (p.type === "Deposit") depositIncome += Number(p.amount);
        else if (p.type === "onboarding") {
          // For onboarding without splits, we can't reliably classify
          // Count as rent for now (conservative)
          rentIncome += Number(p.amount);
        }
      }
    }

    const paidElectricity = await prisma.electricitySplit.findMany({
      where: {
        status: "Paid",
        createdAt: { gte: startDate, lte: endDate },
      },
    });
    const electricityIncome = paidElectricity.reduce(
      (sum, s) => sum + Number(s.amount),
      0
    );

    const totalIncome = rentIncome + electricityIncome;

    const incomeMap = new Map<string, { date: string; amount: number; type: string }>();
    approvedPayments.forEach((p) => {
      const d = p.createdAt.toISOString().split("T")[0];
      const depAmt = Number(p.depositAmount || 0);
      const rentAmt = Number(p.rentAmount || 0);

      if (depAmt > 0) {
        const key = `${d}-deposit`;
        const existing = incomeMap.get(key);
        if (existing) {
          existing.amount += depAmt;
        } else {
          incomeMap.set(key, { date: d, amount: depAmt, type: "deposit" });
        }
      }
      if (rentAmt > 0) {
        const key = `${d}-rent`;
        const existing = incomeMap.get(key);
        if (existing) {
          existing.amount += rentAmt;
        } else {
          incomeMap.set(key, { date: d, amount: rentAmt, type: "rent" });
        }
      }
      if (depAmt === 0 && rentAmt === 0) {
        const key = `${d}-${p.type}`;
        const existing = incomeMap.get(key);
        if (existing) {
          existing.amount += Number(p.amount);
        } else {
          incomeMap.set(key, { date: d, amount: Number(p.amount), type: p.type.toLowerCase() });
        }
      }
    });
    paidElectricity.forEach((s) => {
      const d = s.createdAt.toISOString().split("T")[0];
      const key = `${d}-electricity`;
      const existing = incomeMap.get(key);
      if (existing) {
        existing.amount += Number(s.amount);
      } else {
        incomeMap.set(key, { date: d, amount: Number(s.amount), type: "electricity" });
      }
    });

    // === EXPENSES ===
    const expenses = await prisma.expense.findMany({
      where: {
        deletedAt: null,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: "asc" },
      include: { expenseCategory: true },
    });

    const totalExpense = expenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0
    );

    const expenseBreakdown = expenses.map((e) => ({
      date: e.date.toISOString().split("T")[0],
      amount: Number(e.amount),
      category: e.expenseCategory?.name || "Unknown",
      categoryColor: e.expenseCategory?.color || null,
    }));

    // === OCCUPANCY ===
    const totalBeds = await prisma.bed.count({
      where: { deletedAt: null },
    });
    const occupiedBeds = await prisma.bed.count({
      where: { deletedAt: null, status: { in: ["Occupied", "Move-In Scheduled"] } },
    });
    const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

    // === DEPOSITS HELD ===
    const depositsHeldResult = await prisma.ledger.aggregate({
      _sum: { paid: true },
      where: {
        description: { contains: "Security Deposit" },
        status: { in: ["Pending", "Partial", "Paid"] },
      },
    });
    const depositsHeld = Number(depositsHeldResult._sum.paid || 0);

    // === PROFIT ===
    const profit = totalIncome - totalExpense;

    return NextResponse.json({
      income: {
        total: totalIncome,
        rent: rentIncome,
        deposit: depositIncome,
        electricity: electricityIncome,
        breakdown: Array.from(incomeMap.values()),
      },
      expense: {
        total: totalExpense,
        breakdown: expenseBreakdown,
      },
      profit,
      depositsHeld,
      occupancyRate: Math.round(occupancyRate * 10) / 10,
    });
  } catch (e) {
    console.error("GET /api/admin/accounting error:", e);
    return NextResponse.json(
      { error: "Failed to fetch accounting data" },
      { status: 500 }
    );
  }
}
