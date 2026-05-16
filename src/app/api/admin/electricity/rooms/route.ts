import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      where: { deletedAt: null },
      include: {
        floor: true,
        beds: {
          where: { deletedAt: null },
          include: {
            currentGuest: {
              select: { id: true, name: true, mobile: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(rooms);
  } catch (e: any) {
    console.error("GET /api/admin/electricity/rooms error:", e);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}
