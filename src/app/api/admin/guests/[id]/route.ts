import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/guests/[id]
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const guest = await prisma.guest.findUnique({
      where: { id, deletedAt: null },
      include: {
        room: {
          include: {
            floor: { select: { id: true, name: true } },
          },
        },
        bed: true,
        onboardingData: true,
        ledger: { orderBy: { createdAt: "desc" } },
        payments: { orderBy: { createdAt: "desc" } },
        complaints: { orderBy: { createdAt: "desc" } },
        electricitySplits: {
          include: {
            bill: {
              include: {
                room: { select: { name: true } },
              },
            },
            bed: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    // Serialize Decimal values
    const serialized = {
      ...guest,
      monthlyRent: guest.monthlyRent ? Number(guest.monthlyRent) : null,
      deposit: guest.deposit ? Number(guest.deposit) : null,
      ledger: guest.ledger.map((l) => ({
        ...l,
        amount: Number(l.amount),
        paid: Number(l.paid),
        due: Number(l.due),
      })),
      payments: guest.payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
      electricitySplits: guest.electricitySplits.map((s) => ({
        ...s,
        amount: Number(s.amount),
        bill: s.bill
          ? {
              ...s.bill,
              totalAmount: Number(s.bill.totalAmount),
              prevReading: s.bill.prevReading ? Number(s.bill.prevReading) : null,
              currReading: s.bill.currReading ? Number(s.bill.currReading) : null,
              unitRate: s.bill.unitRate ? Number(s.bill.unitRate) : null,
            }
          : null,
      })),
    };

    return NextResponse.json(serialized);
  } catch (e) {
    console.error("GET /api/admin/guests/[id] error:", e);
    return NextResponse.json(
      { error: "Failed to fetch guest" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/guests/[id]
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.guest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    // Validate unique mobile
    if (body.mobile && body.mobile !== existing.mobile) {
      const dup = await prisma.guest.findFirst({
        where: {
          mobile: body.mobile,
          id: { not: id },
          status: { in: ['Active', 'Active (Pending Move-In)', 'Notice Period'] },
          deletedAt: null,
        },
      });
      if (dup) {
        return NextResponse.json({ error: "Mobile number already in use" }, { status: 409 });
      }
    }

    // Validate unique email
    if (body.email && body.email !== existing.email) {
      const dup = await prisma.guest.findUnique({ where: { email: body.email } });
      if (dup) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
    }

    const updated = await prisma.guest.update({
      where: { id },
      data: {
        name: body.name,
        mobile: body.mobile,
        email: body.email,
        monthlyRent: body.monthlyRent,
      },
    });

    return NextResponse.json({
      ...updated,
      monthlyRent: updated.monthlyRent ? Number(updated.monthlyRent) : null,
      deposit: updated.deposit ? Number(updated.deposit) : null,
    });
  } catch (e) {
    console.error("PATCH /api/admin/guests/[id] error:", e);
    return NextResponse.json(
      { error: "Failed to update guest" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/guests/[id] — soft delete
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const guest = await prisma.guest.findUnique({
      where: { id },
      include: { bed: true },
    });

    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    // Free the bed if assigned
    if (guest.bedId) {
      await prisma.bed.update({
        where: { id: guest.bedId },
        data: { status: "Available", currentGuestId: null },
      });
    }

    // Soft delete guest
    await prisma.guest.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: "Inactive",
        bedId: null,
        roomId: null,
      },
    });

    const admin = await getCurrentAdmin();
    await logAudit({
      adminId: admin?.id,
      adminName: admin?.name,
      action: "DEACTIVATE",
      entity: "Guest",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/admin/guests/[id] error:", e);
    return NextResponse.json(
      { error: "Failed to deactivate guest" },
      { status: 500 }
    );
  }
}
