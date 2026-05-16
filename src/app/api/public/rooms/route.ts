import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const limit = await rateLimitResponse(request);
  if (limit) return limit;

  try {
    const { searchParams } = new URL(request.url);

    const sharingTypes = searchParams.getAll("sharingType");
    const acType = searchParams.get("acType");
    const mealsIncluded = searchParams.get("mealsIncluded");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const availableOnly = searchParams.get("availableOnly");
    const featured = searchParams.get("featured");

    const where: Record<string, unknown> = {
      status: "Active",
      deletedAt: null,
    };

    if (featured === "true") {
      where.showOnHomePage = true;
    }

    if (sharingTypes.length > 0) {
      where.sharingType = { in: sharingTypes };
    }

    if (acType) {
      where.acType = acType;
    }

    if (mealsIncluded === "true") {
      where.mealsIncluded = true;
    }

    const bedWhere: Record<string, unknown> = {
      deletedAt: null,
    };

    if (minPrice || maxPrice) {
      bedWhere.rent = {
        ...(minPrice ? { gte: parseInt(minPrice) } : {}),
        ...(maxPrice ? { lte: parseInt(maxPrice) } : {}),
      };
    }

    if (availableOnly === "true") {
      bedWhere.status = "Available";
    }

    const rooms = await prisma.room.findMany({
      where,
      include: {
        floor: true,
        beds: {
          where: bedWhere,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // If availableOnly or price filters are applied, only return rooms with at least one matching bed
    const filteredRooms = rooms.filter((room) => {
      if (availableOnly === "true" && room.beds.length === 0) return false;
      if ((minPrice || maxPrice) && room.beds.length === 0) return false;
      return true;
    });

    // Serialize Decimal values to numbers for JSON
    const serializedRooms = filteredRooms.map((room) => ({
      ...room,
      beds: room.beds.map((bed) => ({
        ...bed,
        rent: Number(bed.rent),
        deposit: Number(bed.deposit),
      })),
    }));

    return NextResponse.json(serializedRooms);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}
