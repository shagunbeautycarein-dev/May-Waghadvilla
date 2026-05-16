import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/electricity
// List all electricity bills with aggregated split data
export async function GET() {
  try {
    const bills = await prisma.electricityBill.findMany({
      include: {
        room: true,
        splits: {
          include: {
            bed: true,
            guest: true,
            payment: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = bills.map((bill) => {
      const totalCollected = bill.splits
        .filter((s) => s.status === "Paid")
        .reduce((sum, s) => sum + Number(s.amount), 0);
      const totalPending = bill.splits
        .filter((s) => s.status === "Pending")
        .reduce((sum, s) => sum + Number(s.amount), 0);
      const bedsCharged = bill.splits.length;

      return {
        ...bill,
        totalAmount: Number(bill.totalAmount),
        prevReading: bill.prevReading ? Number(bill.prevReading) : null,
        currReading: bill.currReading ? Number(bill.currReading) : null,
        unitRate: bill.unitRate ? Number(bill.unitRate) : null,
        totalCollected,
        totalPending,
        bedsCharged,
        splits: bill.splits.map((s) => ({
          ...s,
          amount: Number(s.amount),
        })),
      };
    });

    return NextResponse.json(enriched);
  } catch (e: any) {
    console.error("GET /api/admin/electricity error:", e);
    return NextResponse.json(
      { error: "Failed to fetch electricity bills" },
      { status: 500 }
    );
  }
}

// POST /api/admin/electricity
// Create a new electricity bill with bed splits
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      roomId,
      month,
      year,
      totalAmount,
      prevReading,
      currReading,
      unitRate,
      billImage,
      splits,
    } = body;

    if (!roomId || !month || !year || !totalAmount) {
      return NextResponse.json(
        { error: "Room, month, year, and total amount are required" },
        { status: 400 }
      );
    }

    if (!splits || !Array.isArray(splits) || splits.length === 0) {
      return NextResponse.json(
        { error: "At least one bed split is required" },
        { status: 400 }
      );
    }

    // Validate split total
    const chargeableSplits = splits.filter((s: any) => s.chargeable);
    const splitTotal = chargeableSplits.reduce(
      (sum: number, s: any) => sum + (Number(s.amount) || 0),
      0
    );
    const difference = Math.abs(splitTotal - Number(totalAmount));
    const hasWarning = difference > 1;

    // Create bill
    const bill = await prisma.electricityBill.create({
      data: {
        roomId,
        month: Number(month),
        year: Number(year),
        totalAmount: Number(totalAmount),
        prevReading: prevReading ? Number(prevReading) : null,
        currReading: currReading ? Number(currReading) : null,
        unitRate: unitRate ? Number(unitRate) : null,
        billImage: billImage || null,
      },
    });

    // Create splits for chargeable beds only
    if (chargeableSplits.length > 0) {
      await prisma.electricitySplit.createMany({
        data: chargeableSplits.map((split: any) => ({
          billId: bill.id,
          bedId: split.bedId,
          guestId: split.guestId || null,
          amount: Number(split.amount),
          status: "Pending",
        })),
      });
    }

    return NextResponse.json({
      bill,
      splitTotal,
      difference,
      warning: hasWarning
        ? `Split total (₹${splitTotal}) differs from bill total (₹${totalAmount}) by ₹${difference}`
        : null,
    });
  } catch (e: any) {
    console.error("POST /api/admin/electricity error:", e);
    return NextResponse.json(
      { error: "Failed to create electricity bill", details: e?.message },
      { status: 500 }
    );
  }
}
