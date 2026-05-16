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

    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
      select: { roomId: true, bed: { select: { roomId: true } } },
    });

    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    const roomId = guest.roomId || guest.bed?.roomId;

    // Get floorId from room
    let floorId: string | null = null;
    if (roomId) {
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        select: { floorId: true },
      });
      floorId = room?.floorId || null;
    }

    const now = new Date();

    const notices = await prisma.notice.findMany({
      where: {
        deletedAt: null,
        OR: [
          { type: "General" },
          { type: "Floor-wise", targetId: floorId || "__none__" },
          { type: "Room-wise", targetId: roomId || "__none__" },
          { type: "Guest-wise", targetId: guestId },
        ],
        AND: [
          {
            OR: [
              { expiryDate: { equals: null } },
              { expiryDate: { gt: now } },
            ],
          },
          {
            sendDate: { lte: now },
          },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    // Get read status for each notice
    const readRecords = await prisma.noticeRead.findMany({
      where: { guestId },
      select: { noticeId: true },
    });
    const readSet = new Set(readRecords.map((r) => r.noticeId));

    const enriched = notices.map((n) => ({
      ...n,
      isRead: readSet.has(n.id),
    }));

    return NextResponse.json(enriched);
  } catch (e: any) {
    console.error("GET /api/guest/notices error:", e);
    return NextResponse.json(
      { error: "Failed to fetch notices" },
      { status: 500 }
    );
  }
}
