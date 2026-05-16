import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bedSchema = z.object({
  roomId: z.string().uuid(),
  name: z.string().min(1).max(10),
  rent: z.number().positive(),
  deposit: z.number().positive(),
});

const bedUpdateSchema = z.object({
  id: z.string().uuid(),
  rent: z.number().positive().optional(),
  deposit: z.number().positive().optional(),
  status: z.enum(["Available", "Reserved", "Move-In Scheduled", "Occupied", "Notice Period", "Maintenance"]).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { deletedAt: null };
    if (roomId) where.roomId = roomId;
    if (status) where.status = status;

    const beds = await prisma.bed.findMany({
      where,
      include: {
        room: true,
        currentGuest: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      beds.map((bed) => ({
        ...bed,
        rent: Number(bed.rent),
        deposit: Number(bed.deposit),
      }))
    );
  } catch {
    return NextResponse.json({ error: "Failed to fetch beds" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = bedSchema.parse(body);
    const bed = await prisma.bed.create({ data });
    return NextResponse.json({
      ...bed,
      rent: Number(bed.rent),
      deposit: Number(bed.deposit),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create bed" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, rent, deposit, status } = bedUpdateSchema.parse(body);

    const existing = await prisma.bed.findUnique({
      where: { id, deletedAt: null },
      select: { status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Bed not found" }, { status: 404 });
    }

    if (status !== undefined) {
      const bed = await prisma.bed.update({
        where: { id },
        data: { status },
      });
      return NextResponse.json({
        ...bed,
        rent: Number(bed.rent),
        deposit: Number(bed.deposit),
      });
    }

    if (rent !== undefined || deposit !== undefined) {
      if (rent === undefined || deposit === undefined) {
        return NextResponse.json(
          { error: "Both rent and deposit are required" },
          { status: 400 }
        );
      }

      if (existing.status !== "Available" && existing.status !== "Maintenance") {
        return NextResponse.json(
          { error: "Can only edit Available or Maintenance beds" },
          { status: 400 }
        );
      }

      const bed = await prisma.bed.update({
        where: { id },
        data: { rent, deposit },
      });

      return NextResponse.json({
        ...bed,
        rent: Number(bed.rent),
        deposit: Number(bed.deposit),
      });
    }

    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update bed" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const existing = await prisma.bed.findUnique({
      where: { id, deletedAt: null },
      select: { status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Bed not found" }, { status: 404 });
    }

    if (existing.status !== "Available") {
      return NextResponse.json(
        { error: "Can only delete Available beds" },
        { status: 400 }
      );
    }

    const bed = await prisma.bed.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json(bed);
  } catch {
    return NextResponse.json({ error: "Failed to delete bed" }, { status: 500 });
  }
}
