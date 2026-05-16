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

    let floorId: string | null = null;
    if (roomId) {
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        select: { floorId: true },
      });
      floorId = room?.floorId || null;
    }

    const now = new Date();

    const [unreadNotices, pendingComplaints, pendingElectricity] = await Promise.all([
      prisma.notice.count({
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
            { sendDate: { lte: now } },
          ],
          NOT: { reads: { some: { guestId } } },
        },
      }),
      prisma.complaint.count({ where: { guestId, status: "Pending" } }),
      prisma.electricitySplit.count({ where: { guestId, status: "Pending" } }),
    ]);

    return NextResponse.json({ unreadNotices, pendingComplaints, pendingElectricity });
  } catch (e: any) {
    console.error("GET /api/guest/notifications error:", e);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
