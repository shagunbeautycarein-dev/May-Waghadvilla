import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get("guestId");
    const email = searchParams.get("email");

    if (!guestId && !email) {
      return NextResponse.json(
        { error: "Guest ID or email required" },
        { status: 400 }
      );
    }

    const guest = await prisma.guest.findUnique({
      where: guestId ? { id: guestId } : { email: email! },
      include: {
        room: true,
        bed: true,
        onboardingData: true,
      },
    });

    if (!guest) {
      return NextResponse.json(
        { error: "Guest not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(guest);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
