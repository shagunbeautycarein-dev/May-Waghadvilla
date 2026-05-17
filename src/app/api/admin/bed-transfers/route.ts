import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/bed-transfers
export async function GET() {
  try {
    const transfers = await prisma.bedTransfer.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Fetch related data separately
    const guestIds = [...new Set(transfers.map((t) => t.guestId))];
    const bedIds = [
      ...new Set([...transfers.map((t) => t.oldBedId), ...transfers.map((t) => t.newBedId)]),
    ];

    const guests = await prisma.guest.findMany({
      where: { id: { in: guestIds } },
      select: { id: true, name: true, room: { select: { name: true } }, bed: { select: { name: true } } },
    });

    const beds = await prisma.bed.findMany({
      where: { id: { in: bedIds } },
      include: { room: { select: { name: true } } },
    });

    const guestMap = new Map(guests.map((g) => [g.id, g]));
    const bedMap = new Map(beds.map((b) => [b.id, b]));

    const enriched = transfers.map((t) => ({
      ...t,
      guest: guestMap.get(t.guestId),
      oldBed: bedMap.get(t.oldBedId),
      newBed: bedMap.get(t.newBedId),
    }));

    return NextResponse.json(enriched);
  } catch (e: any) {
    console.error("GET /api/admin/bed-transfers error:", e);
    return NextResponse.json(
      { error: "Failed to fetch transfers" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/bed-transfers
export async function PATCH(request: Request) {
  try {
    const { id, status, rejectionReason } = await request.json();
    if (!id || !status) {
      return NextResponse.json(
        { error: "ID and status required" },
        { status: 400 }
      );
    }

    const transfer = await prisma.bedTransfer.findUnique({
      where: { id },
    });
    if (!transfer) {
      return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
    }

    if (status === "completed") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const effective = new Date(transfer.effectiveDate);
      effective.setHours(0, 0, 0, 0);
      const isFuture = effective > today;

      // Fetch both beds with room info in one parallel query
      const [oldBed, newBed] = await Promise.all([
        prisma.bed.findUnique({
          where: { id: transfer.oldBedId },
          include: { room: { select: { name: true } } },
        }),
        prisma.bed.findUnique({
          where: { id: transfer.newBedId },
          include: { room: { select: { name: true } } },
        }),
      ]);

      // Update old bed
      await prisma.bed.update({
        where: { id: transfer.oldBedId },
        data: { status: "Available", currentGuestId: null },
      });

      // Update new bed
      await prisma.bed.update({
        where: { id: transfer.newBedId },
        data: {
          status: isFuture ? "Move-In Scheduled" : "Occupied",
          currentGuestId: transfer.guestId,
        },
      });

      // Update guest
      await prisma.guest.update({
        where: { id: transfer.guestId },
        data: {
          roomId: newBed?.roomId,
          bedId: transfer.newBedId,
          monthlyRent: transfer.newRent,
        },
      });

      // Create ledger adjustment for rent difference
      const rentDiffNum = Number(transfer.rentDifference || 0);
      if (rentDiffNum !== 0) {
        const oldRoomName = oldBed?.room?.name || "";
        const newRoomName = newBed?.room?.name || "";

        if (rentDiffNum > 0) {
          // Guest owes more
          await prisma.ledger.create({
            data: {
              guestId: transfer.guestId,
              description: `Transfer Charge — Additional rent due after bed transfer (${oldRoomName} → ${newRoomName})`,
              amount: rentDiffNum,
              paid: 0,
              due: rentDiffNum,
              status: "Pending",
            },
          });
        } else {
          // Guest gets credit
          const absDiff = Math.abs(rentDiffNum);
          await prisma.ledger.create({
            data: {
              guestId: transfer.guestId,
              description: `Transfer Credit — Rent decrease applied as pre-paid credit (${oldRoomName} → ${newRoomName})`,
              amount: absDiff,
              paid: absDiff,
              due: 0,
              status: "Paid",
            },
          });
        }
      }
    }

    const updated = await prisma.bedTransfer.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("PATCH /api/admin/bed-transfers error:", e);
    return NextResponse.json(
      { error: "Failed to update transfer" },
      { status: 500 }
    );
  }
}
