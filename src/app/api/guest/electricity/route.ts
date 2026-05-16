import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_session")?.value;

    if (!guestId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const splits = await prisma.electricitySplit.findMany({
      where: { guestId },
      include: {
        bill: {
          include: {
            room: true,
          },
        },
        bed: true,
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = splits.map((s) => ({
      ...s,
      amount: Number(s.amount),
      bill: {
        ...s.bill,
        totalAmount: Number(s.bill.totalAmount),
        prevReading: s.bill.prevReading ? Number(s.bill.prevReading) : null,
        currReading: s.bill.currReading ? Number(s.bill.currReading) : null,
        unitRate: s.bill.unitRate ? Number(s.bill.unitRate) : null,
      },
    }));

    return NextResponse.json(enriched);
  } catch (e: any) {
    console.error("GET /api/guest/electricity error:", e);
    return NextResponse.json(
      { error: "Failed to fetch electricity data" },
      { status: 500 }
    );
  }
}
