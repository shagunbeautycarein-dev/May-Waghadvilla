import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/visitors?date=&room=&status=
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const room = searchParams.get("room");
    const status = searchParams.get("status");

    const where: any = {};
    if (status) where.status = status;
    if (date) {
      const d = new Date(date);
      where.visitDate = {
        gte: d,
        lt: new Date(d.getTime() + 24 * 60 * 60 * 1000),
      };
    }

    const visitors = await prisma.visitorLog.findMany({
      where,
      orderBy: { visitDate: "desc" },
    });

    // Fetch guest data separately
    const guestIds = [...new Set(visitors.map((v) => v.guestId))];
    const guests = await prisma.guest.findMany({
      where: { id: { in: guestIds } },
      select: {
        id: true,
        name: true,
        room: { select: { name: true } },
        bed: { select: { name: true } },
      },
    });
    const guestMap = new Map(guests.map((g) => [g.id, g]));

    let result = visitors.map((v) => ({
      ...v,
      guest: guestMap.get(v.guestId),
    }));

    // Filter by room if specified
    if (room) {
      result = result.filter((v) => v.guest?.room?.name === room);
    }

    return NextResponse.json(result);
  } catch (e: any) {
    console.error("GET /api/admin/visitors error:", e);
    return NextResponse.json(
      { error: "Failed to fetch visitor logs" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/visitors
export async function PATCH(request: Request) {
  try {
    const { id, status, entryTime, exitTime } = await request.json();
    if (!id || !status) {
      return NextResponse.json(
        { error: "ID and status required" },
        { status: 400 }
      );
    }

    const updateData: any = { status };
    if (entryTime) updateData.entryTime = new Date(entryTime);
    if (exitTime) updateData.exitTime = new Date(exitTime);

    const updated = await prisma.visitorLog.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("PATCH /api/admin/visitors error:", e);
    return NextResponse.json(
      { error: "Failed to update visitor" },
      { status: 500 }
    );
  }
}
