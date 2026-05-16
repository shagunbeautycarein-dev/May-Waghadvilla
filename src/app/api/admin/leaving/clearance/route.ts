import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/leaving/clearance?requestId=
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("requestId");
    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID required" },
        { status: 400 }
      );
    }

    const leavingRequest = await prisma.leavingRequest.findUnique({
      where: { id: requestId },
    });

    if (!leavingRequest) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const guest = await prisma.guest.findUnique({
      where: { id: leavingRequest.guestId },
      include: {
        room: true,
        bed: true,
        ledger: true,
        electricitySplits: { where: { status: "Pending" } },
      },
    });

    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    const pendingRent = guest.ledger
      .filter((l) => l.status !== "Paid" && l.status !== "Refunded")
      .reduce((sum, l) => sum + Number(l.due), 0);

    const pendingElectricity = guest.electricitySplits.reduce(
      (sum, s) => sum + Number(s.amount),
      0
    );

    const depositPaid = Number(guest.deposit || 0);

    return NextResponse.json({
      leavingRequest: { ...leavingRequest, guest },
      pendingRent,
      pendingElectricity,
      depositPaid,
      totalDeductions:
        pendingRent + pendingElectricity + Number(leavingRequest.damageDeductionAmount),
      refundDue:
        depositPaid -
        pendingRent -
        pendingElectricity -
        Number(leavingRequest.damageDeductionAmount),
    });
  } catch (e: any) {
    console.error("GET /api/admin/leaving/clearance error:", e);
    return NextResponse.json(
      { error: "Failed to fetch clearance data" },
      { status: 500 }
    );
  }
}

// POST /api/admin/leaving/clearance
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      requestId,
      pendingRentAmount,
      pendingElectricityAmount,
      damageDeductionAmount,
      refundAmount,
      inspectionPassed,
      keysReturned,
    } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID required" },
        { status: 400 }
      );
    }

    const leavingRequest = await prisma.leavingRequest.findUnique({
      where: { id: requestId },
    });
    if (!leavingRequest) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const guest = await prisma.guest.findUnique({
      where: { id: leavingRequest.guestId },
      include: { bed: true },
    });

    // Update leaving request
    await prisma.leavingRequest.update({
      where: { id: requestId },
      data: {
        pendingRentAmount: Number(pendingRentAmount || 0),
        pendingElectricityAmount: Number(pendingElectricityAmount || 0),
        damageDeductionAmount: Number(damageDeductionAmount || 0),
        refundAmount: refundAmount ? Number(refundAmount) : null,
        inspectionPassed: Boolean(inspectionPassed),
        keysReturned: Boolean(keysReturned),
        status: "completed",
      },
    });

    // Free the bed
    if (guest?.bedId) {
      await prisma.bed.update({
        where: { id: guest.bedId },
        data: { status: "Available", currentGuestId: null },
      });
    }

    // Mark guest inactive
    await prisma.guest.update({
      where: { id: leavingRequest.guestId },
      data: {
        status: "Inactive",
        leavingDate: new Date(),
        bedId: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("POST /api/admin/leaving/clearance error:", e);
    return NextResponse.json(
      { error: "Failed to process clearance" },
      { status: 500 }
    );
  }
}
