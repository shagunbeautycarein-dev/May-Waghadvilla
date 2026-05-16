import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const inquiryUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["New Inquiry", "Follow Up", "Visited", "Confirmed", "Cancelled"]).optional(),
  roomId: z.string().uuid().nullable().optional(),
  bedId: z.string().uuid().nullable().optional(),
  joiningDate: z.string().nullable().optional(),
  monthlyRent: z.number().positive().nullable().optional(),
  deposit: z.number().positive().nullable().optional(),
  rentCycleDate: z.number().int().positive().nullable().optional(),
  cancellationReason: z.string().nullable().optional(),
});

function serializeInquiry(inquiry: any) {
  return {
    id: inquiry.id,
    name: inquiry.name,
    mobile: inquiry.mobile,
    email: inquiry.email,
    visitDate: inquiry.visitDate,
    timeSlot: inquiry.timeSlot,
    status: inquiry.status,
    roomId: inquiry.roomId,
    bedId: inquiry.bedId,
    joiningDate: inquiry.joiningDate,
    monthlyRent: inquiry.monthlyRent ? Number(inquiry.monthlyRent) : null,
    deposit: inquiry.deposit ? Number(inquiry.deposit) : null,
    rentCycleDate: inquiry.rentCycleDate,
    cancellationReason: inquiry.cancellationReason,
    createdAt: inquiry.createdAt,
    updatedAt: inquiry.updatedAt,
    guestOnboardingStatus: inquiry.guest?.onboardingData?.status || null,
    guestHasPassword: !!inquiry.guest?.passwordHash,
    guestId: inquiry.guest?.id || null,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: { status?: string } = {};
    if (status) where.status = status;

    const inquiries = await prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Fetch guest data for converted inquiries
    const mobiles = inquiries.map((i) => i.mobile).filter(Boolean);
    const guests = await prisma.guest.findMany({
      where: { mobile: { in: mobiles } },
      include: { onboardingData: true },
    });

    const guestByMobile = new Map(guests.map((g) => [g.mobile, g]));

    const enriched = inquiries.map((inquiry) => {
      const guest = guestByMobile.get(inquiry.mobile);
      return serializeInquiry({ ...inquiry, guest });
    });

    return NextResponse.json(enriched);
  } catch {
    return NextResponse.json({ error: "Failed to fetch inquiries" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const parsed = inquiryUpdateSchema.parse(body);

    const { id, ...rest } = parsed;

    const updateData: {
      status?: string;
      roomId?: string | null;
      bedId?: string | null;
      joiningDate?: Date | null;
      monthlyRent?: number | null;
      deposit?: number | null;
      rentCycleDate?: number | null;
      cancellationReason?: string | null;
    } = {};

    if (rest.status !== undefined) updateData.status = rest.status;
    if (rest.roomId !== undefined) updateData.roomId = rest.roomId;
    if (rest.bedId !== undefined) updateData.bedId = rest.bedId;
    if (rest.joiningDate !== undefined) {
      updateData.joiningDate = rest.joiningDate ? new Date(rest.joiningDate) : null;
    }
    if (rest.monthlyRent !== undefined) updateData.monthlyRent = rest.monthlyRent;
    if (rest.deposit !== undefined) updateData.deposit = rest.deposit;
    if (rest.rentCycleDate !== undefined) updateData.rentCycleDate = rest.rentCycleDate;
    if (rest.cancellationReason !== undefined) updateData.cancellationReason = rest.cancellationReason;

    const inquiry = await prisma.inquiry.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(serializeInquiry(inquiry));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update inquiry" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.inquiry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete inquiry" }, { status: 500 });
  }
}
