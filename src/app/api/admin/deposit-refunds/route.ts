import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/deposit-refunds
export async function GET() {
  try {
    const refunds = await prisma.depositRefund.findMany({
      orderBy: { createdAt: "desc" },
    });

    const guestIds = [...new Set(refunds.map((r) => r.guestId))];
    const guests = await prisma.guest.findMany({
      where: { id: { in: guestIds } },
      select: { id: true, name: true, room: { select: { name: true } }, bed: { select: { name: true } } },
    });
    const guestMap = new Map(guests.map((g) => [g.id, g]));

    const enriched = refunds.map((r) => ({
      ...r,
      guest: guestMap.get(r.guestId),
    }));

    return NextResponse.json(enriched);
  } catch (e: any) {
    console.error("GET /api/admin/deposit-refunds error:", e);
    return NextResponse.json(
      { error: "Failed to fetch refunds" },
      { status: 500 }
    );
  }
}

// POST /api/admin/deposit-refunds
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { guestId, amount, method, proofImage, deductionReason } = body;

    if (!guestId || !amount || !method) {
      return NextResponse.json(
        { error: "Guest, amount, and method are required" },
        { status: 400 }
      );
    }

    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
      select: { deposit: true },
    });

    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    if (Number(amount) > Number(guest.deposit || 0)) {
      return NextResponse.json(
        { error: "Refund amount cannot exceed deposit" },
        { status: 400 }
      );
    }

    const refund = await prisma.depositRefund.create({
      data: {
        guestId,
        amount: Number(amount),
        method,
        proofImage: proofImage || null,
        deductionReason: deductionReason || null,
        status: "Completed",
      },
    });

    // Update ledger deposit entry to Refunded
    await prisma.ledger.updateMany({
      where: {
        guestId,
        description: { contains: "Deposit", mode: "insensitive" },
      },
      data: { status: "Refunded" },
    });

    return NextResponse.json(refund, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/admin/deposit-refunds error:", e);
    return NextResponse.json(
      { error: "Failed to process refund" },
      { status: 500 }
    );
  }
}
