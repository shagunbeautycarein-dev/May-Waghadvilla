import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bedInputSchema = z.object({
  name: z.string().min(1).max(10),
  rent: z.number().positive(),
  deposit: z.number().positive(),
});

const roomSchema = z.object({
  floorId: z.string().uuid().optional(),
  floorName: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(50),
  sharingType: z.enum(["1-sharing", "2-sharing", "3-sharing", "4-sharing", "5-sharing", "6-sharing", "7-sharing", "8-sharing", "9-sharing", "10-sharing"]),
  acType: z.enum(["AC", "Non-AC"]),
  mealsIncluded: z.boolean().default(false),
  electricityIncluded: z.boolean().default(false),
  wifiName: z.string().optional(),
  wifiPassword: z.string().optional(),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  coverImage: z.string().optional(),
  description: z.string().optional(),
  showOnHomePage: z.boolean().default(false),
  beds: z.array(bedInputSchema).min(1, "At least one bed is required"),
});

const roomUpdateSchema = z.object({
  id: z.string().uuid(),
  floorId: z.string().uuid().optional(),
  floorName: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(50),
  sharingType: z.enum(["1-sharing", "2-sharing", "3-sharing", "4-sharing", "5-sharing", "6-sharing", "7-sharing", "8-sharing", "9-sharing", "10-sharing"]),
  acType: z.enum(["AC", "Non-AC"]),
  mealsIncluded: z.boolean().default(false),
  electricityIncluded: z.boolean().default(false),
  wifiName: z.string().optional(),
  wifiPassword: z.string().optional(),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  coverImage: z.string().optional(),
  description: z.string().optional(),
  showOnHomePage: z.boolean().default(false),
  beds: z.array(bedInputSchema).optional(),
});

export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      where: { deletedAt: null },
      include: {
        floor: true,
        beds: { where: { deletedAt: null } },
        _count: { select: { beds: { where: { deletedAt: null } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(rooms);
  } catch {
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = roomSchema.parse(body);

    if (!data.floorId && !data.floorName) {
      return NextResponse.json({ error: "Either floorId or floorName is required" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create or use existing floor
      let floorId = data.floorId;
      if (!floorId && data.floorName) {
        const maxOrder = await tx.floor.aggregate({
          where: { deletedAt: null },
          _max: { sortOrder: true },
        });
        const floor = await tx.floor.create({
          data: {
            name: data.floorName,
            sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
          },
        });
        floorId = floor.id;
      }

      // Create room
      const room = await tx.room.create({
        data: {
          floorId: floorId!,
          name: data.name,
          sharingType: data.sharingType,
          acType: data.acType,
          mealsIncluded: data.mealsIncluded,
          electricityIncluded: data.electricityIncluded,
          wifiName: data.wifiName,
          wifiPassword: data.wifiPassword,
          amenities: data.amenities,
          images: data.images,
          coverImage: data.coverImage,
          description: data.description,
          showOnHomePage: data.showOnHomePage,
        },
      });

      // Create beds
      await tx.bed.createMany({
        data: data.beds.map((bed) => ({
          roomId: room.id,
          name: bed.name,
          rent: bed.rent,
          deposit: bed.deposit,
        })),
      });

      return tx.room.findUnique({
        where: { id: room.id },
        include: { floor: true, beds: true },
      });
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Create room error:", error);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, floorId, floorName, beds: incomingBeds, ...data } = roomUpdateSchema.parse(body);

    const room = await prisma.room.update({
      where: { id },
      data: {
        ...data,
        ...(floorId ? { floorId } : {}),
      },
    });

    // ── Sync beds if the caller sent a beds array ─────────────────────────
    if (incomingBeds && incomingBeds.length > 0) {
      const existingBeds = await prisma.bed.findMany({
        where: { roomId: id, deletedAt: null },
        orderBy: { name: "asc" },
      });

      const existingNames = new Set(existingBeds.map((b) => b.name));
      const incomingNames = new Set(incomingBeds.map((b) => b.name));

      // 1. Update rent/deposit for beds that already exist
      await Promise.all(
        incomingBeds
          .filter((b) => existingNames.has(b.name))
          .map((b) => {
            const existing = existingBeds.find((e) => e.name === b.name)!;
            return prisma.bed.update({
              where: { id: existing.id },
              data: { rent: b.rent, deposit: b.deposit },
            });
          })
      );

      // 2. Create new beds that don't exist yet
      const newBeds = incomingBeds.filter((b) => !existingNames.has(b.name));
      if (newBeds.length > 0) {
        await prisma.bed.createMany({
          data: newBeds.map((b) => ({
            roomId: id,
            name: b.name,
            rent: b.rent,
            deposit: b.deposit,
          })),
        });
      }

      // 3. Soft-delete beds that were removed — ONLY if Available
      //    Occupied/Reserved beds are kept to avoid orphaning guests
      const removedNames = [...existingNames].filter((n) => !incomingNames.has(n));
      if (removedNames.length > 0) {
        await prisma.bed.updateMany({
          where: {
            roomId: id,
            name: { in: removedNames },
            deletedAt: null,
            status: "Available", // never remove occupied/reserved beds
          },
          data: { deletedAt: new Date() },
        });
      }
    }

    return NextResponse.json(room);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update room" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const nonAvailableBeds = await prisma.bed.count({
      where: {
        roomId: id,
        deletedAt: null,
        status: { not: "Available" },
      },
    });

    if (nonAvailableBeds > 0) {
      return NextResponse.json(
        { error: "Cannot delete room with occupied or reserved beds" },
        { status: 400 }
      );
    }

    const room = await prisma.room.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json(room);
  } catch {
    return NextResponse.json({ error: "Failed to delete room" }, { status: 500 });
  }
}
