import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const floorSchema = z.object({
  name: z.string().min(1).max(50),
  sortOrder: z.number().int().min(0),
});

const floorUpdateSchema = floorSchema.extend({
  id: z.string().uuid(),
});

export async function GET() {
  try {
    const floors = await prisma.floor.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { rooms: { where: { deletedAt: null } } } } },
    });
    return NextResponse.json(floors);
  } catch {
    return NextResponse.json({ error: "Failed to fetch floors" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = floorSchema.parse(body);
    const floor = await prisma.floor.create({ data });
    return NextResponse.json(floor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create floor" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = floorUpdateSchema.parse(body);
    const floor = await prisma.floor.update({
      where: { id },
      data,
    });
    return NextResponse.json(floor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update floor" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const roomCount = await prisma.room.count({
      where: { floorId: id, deletedAt: null },
    });

    if (roomCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete floor with rooms" },
        { status: 400 }
      );
    }

    const floor = await prisma.floor.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json(floor);
  } catch {
    return NextResponse.json({ error: "Failed to delete floor" }, { status: 500 });
  }
}
