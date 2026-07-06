import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(100),
  mobile: z.string().regex(/^[0-9]{10}$/),
  email: z.string().email(),
  roomId: z.string().uuid(),
  bedId: z.string().uuid(),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  monthlyRent: z.number().positive(),
  deposit: z.number().positive(),
  rentCycleDate: z.number().min(1).max(28).default(5),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = schema.parse(body);

    const bed = await prisma.bed.findUnique({
      where: { id: data.bedId },
    });

    if (!bed || bed.status !== "Available") {
      return NextResponse.json(
        { error: "Bed is not available" },
        { status: 400 }
      );
    }

    const existingActive = await prisma.guest.findFirst({
      where: {
        mobile: data.mobile,
        status: { in: ['Active', 'Active (Pending Move-In)', 'Notice Period'] },
        deletedAt: null,
      },
    });
    if (existingActive) {
      return NextResponse.json(
        { error: "An active guest with this mobile number already exists" },
        { status: 409 }
      );
    }

    const existingEmail = await prisma.guest.findUnique({
      where: { email: data.email } });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const guest = await prisma.guest.create({
      data: {
        name: data.name,
        mobile: data.mobile,
        email: data.email,
        status: "Onboarding Started",
        roomId: data.roomId,
        bedId: data.bedId,
        joiningDate: new Date(data.joiningDate),
        monthlyRent: data.monthlyRent,
        deposit: data.deposit,
        rentCycleDate: data.rentCycleDate,
      },
    });

    await prisma.onboardingData.create({
      data: {
        guestId: guest.id,
        status: "Draft",
      },
    });

    await prisma.bed.update({
      where: { id: data.bedId },
      data: { status: "Reserved", currentGuestId: guest.id },
    });

    return NextResponse.json({ guest }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("Quick create error:", error);
    return NextResponse.json(
      { error: "Failed to create guest" },
      { status: 500 }
    );
  }
}
