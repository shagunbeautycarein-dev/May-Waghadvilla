import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const roomId = searchParams.get("roomId") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { mobile: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    } else {
      // By default, hide guests who are approved but haven't moved in yet
      // They belong in the Approval Center, not the Guest List
      where.NOT = { status: "Active (Pending Move-In)" };
    }

    if (roomId) {
      where.roomId = roomId;
    }

    const orderBy: Record<string, string> = {};
    if (sortBy === "dueAmount") {
      // Can't order by aggregate in Prisma directly, sort in JS after
      orderBy.createdAt = sortOrder;
    } else if (sortBy === "name") {
      orderBy.name = sortOrder;
    } else if (sortBy === "joiningDate") {
      orderBy.joiningDate = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const [guests, total] = await Promise.all([
      prisma.guest.findMany({
        where,
        include: {
          room: { select: { id: true, name: true, floor: { select: { name: true } } } },
          bed: { select: { id: true, name: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.guest.count({ where }),
    ]);

    // Get ledger due amounts
    const guestIds = guests.map((g) => g.id);
    const ledgerData = await prisma.ledger.groupBy({
      by: ["guestId"],
      where: { guestId: { in: guestIds } },
      _sum: { due: true },
    });

    const dueMap = new Map(ledgerData.map((l) => [l.guestId, Number(l._sum.due || 0)]));

    const enriched = guests.map((g) => ({
      ...g,
      monthlyRent: g.monthlyRent ? Number(g.monthlyRent) : null,
      deposit: g.deposit ? Number(g.deposit) : null,
      totalDue: dueMap.get(g.id) || 0,
    }));

    // Post-sort by due amount if requested
    if (sortBy === "dueAmount") {
      enriched.sort((a, b) =>
        sortOrder === "asc" ? a.totalDue - b.totalDue : b.totalDue - a.totalDue
      );
    }

    return NextResponse.json({
      guests: enriched,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error("GET /api/admin/guests error:", e);
    return NextResponse.json(
      { error: "Failed to fetch guests" },
      { status: 500 }
    );
  }
}
