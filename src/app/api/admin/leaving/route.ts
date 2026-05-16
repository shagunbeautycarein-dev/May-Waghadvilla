import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/leaving
export async function GET() {
  try {
    const requests = await prisma.leavingRequest.findMany({
      orderBy: { createdAt: "desc" },
    });

    const guestIds = [...new Set(requests.map((r) => r.guestId))];
    const guests = await prisma.guest.findMany({
      where: { id: { in: guestIds } },
      select: {
        id: true,
        name: true,
        mobile: true,
        room: { select: { name: true } },
        bed: { select: { name: true } },
      },
    });
    const guestMap = new Map(guests.map((g) => [g.id, g]));

    const enriched = requests.map((r) => ({
      ...r,
      guest: guestMap.get(r.guestId),
    }));

    return NextResponse.json(enriched);
  } catch (e: any) {
    console.error("GET /api/admin/leaving error:", e);
    return NextResponse.json(
      { error: "Failed to fetch leaving requests" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/leaving
export async function PATCH(request: Request) {
  try {
    const { id, status, rejectionReason } = await request.json();
    if (!id || !status) {
      return NextResponse.json(
        { error: "ID and status required" },
        { status: 400 }
      );
    }

    const updateData: any = { status };
    if (rejectionReason) updateData.rejectionReason = rejectionReason;

    const updated = await prisma.leavingRequest.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("PATCH /api/admin/leaving error:", e);
    return NextResponse.json(
      { error: "Failed to update leaving request" },
      { status: 500 }
    );
  }
}
