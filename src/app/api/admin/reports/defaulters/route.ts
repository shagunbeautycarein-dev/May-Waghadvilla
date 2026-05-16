import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const today = new Date();

    const guests = await prisma.guest.findMany({
      where: {
        status: { in: ["Active", "Notice Period"] },
        deletedAt: null,
        ledger: {
          some: {
            status: { in: ["Pending", "Partial"] },
          },
        },
      },
      include: {
        room: true,
        bed: true,
        ledger: {
          where: {
            status: { in: ["Pending", "Partial"] },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const defaulters = guests.map((guest) => {
      const totalDue = guest.ledger.reduce((sum, l) => sum + Number(l.due), 0);
      const oldestLedger = guest.ledger[0];
      const daysOverdue = oldestLedger
        ? Math.floor(
            (today.getTime() - new Date(oldestLedger.createdAt).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0;

      return {
        id: guest.id,
        name: guest.name,
        mobile: guest.mobile,
        email: guest.email,
        room: guest.room?.name || "-",
        bed: guest.bed?.name || "-",
        daysOverdue,
        totalDue,
        ledgerCount: guest.ledger.length,
      };
    });

    defaulters.sort((a, b) => b.daysOverdue - a.daysOverdue);

    const buckets = {
      "0-30": { count: 0, total: 0, items: [] as typeof defaulters },
      "30-60": { count: 0, total: 0, items: [] as typeof defaulters },
      "60-90": { count: 0, total: 0, items: [] as typeof defaulters },
      "90+": { count: 0, total: 0, items: [] as typeof defaulters },
    };

    for (const d of defaulters) {
      if (d.daysOverdue <= 30) {
        buckets["0-30"].count++;
        buckets["0-30"].total += d.totalDue;
        buckets["0-30"].items.push(d);
      } else if (d.daysOverdue <= 60) {
        buckets["30-60"].count++;
        buckets["30-60"].total += d.totalDue;
        buckets["30-60"].items.push(d);
      } else if (d.daysOverdue <= 90) {
        buckets["60-90"].count++;
        buckets["60-90"].total += d.totalDue;
        buckets["60-90"].items.push(d);
      } else {
        buckets["90+"].count++;
        buckets["90+"].total += d.totalDue;
        buckets["90+"].items.push(d);
      }
    }

    return NextResponse.json({ defaulters, buckets });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch defaulters" },
      { status: 500 }
    );
  }
}
