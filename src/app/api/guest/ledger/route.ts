import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get("guestId");

    if (!guestId) {
      return NextResponse.json(
        { error: "Guest ID required" },
        { status: 400 }
      );
    }

    const ledger = await prisma.ledger.findMany({
      where: { guestId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(ledger);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch ledger" },
      { status: 500 }
    );
  }
}
