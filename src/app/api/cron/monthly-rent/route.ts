import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const today = new Date();
    const currentMonth = today.toLocaleString("en-US", { month: "long", year: "numeric" });
    const activeGuests = await prisma.guest.findMany({
      where: { status: { in: ["Active", "Notice Period"] }, deletedAt: null },
    });
    let created = 0;
    let skipped = 0;
    for (const guest of activeGuests) {
      const existing = await prisma.ledger.findFirst({
        where: {
          guestId: guest.id,
          description: { contains: currentMonth },
          createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) },
        },
      });
      if (existing) {
        skipped++;
        continue;
      }
      await prisma.ledger.create({
        data: {
          guestId: guest.id,
          description: `Monthly Rent - ${currentMonth}`,
          amount: guest.monthlyRent || 0,
          paid: 0,
          due: guest.monthlyRent || 0,
          status: "Pending",
        },
      });
      created++;
    }
    return NextResponse.json({
      success: true,
      month: currentMonth,
      created,
      skipped,
    });
  } catch (error) {
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
