import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// POST /api/guest/bed-transfers
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_session")?.value;
    if (!guestId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { newBedId, effectiveDate, reason } = await request.json();
    if (!newBedId || !effectiveDate) {
      return NextResponse.json(
        { error: "New bed and effective date are required" },
        { status: 400 }
      );
    }

    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
      include: { bed: true },
    });
    if (!guest || !guest.bedId) {
      return NextResponse.json({ error: "Guest not assigned to a bed" }, { status: 400 });
    }

    const newBed = await prisma.bed.findUnique({
      where: { id: newBedId },
      include: { room: true },
    });
    if (!newBed || newBed.status !== "Available") {
      return NextResponse.json(
        { error: "Selected bed is not available" },
        { status: 400 }
      );
    }

    const effective = new Date(effectiveDate);
    if (effective < new Date(new Date().setHours(0, 0, 0, 0))) {
      return NextResponse.json(
        { error: "Effective date must be today or later" },
        { status: 400 }
      );
    }

    const oldRent = Number(guest.monthlyRent || guest.bed?.rent || 0);
    const newRent = Number(newBed.rent);
    const rentDifference = newRent - oldRent;

    const transfer = await prisma.bedTransfer.create({
      data: {
        guestId,
        oldBedId: guest.bedId,
        newBedId,
        requestDate: new Date(),
        effectiveDate: effective,
        oldRent,
        newRent,
        rentDifference,
        reason: reason || null,
        status: "requested",
      },
    });

    return NextResponse.json({ transfer, rentDifference });
  } catch (e: any) {
    console.error("POST /api/guest/bed-transfers error:", e);
    return NextResponse.json(
      { error: "Transfer request failed" },
      { status: 500 }
    );
  }
}
