import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// GET /api/guest/visitors
export async function GET() {
  try {
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_session")?.value;
    if (!guestId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const visitors = await prisma.visitorLog.findMany({
      where: { guestId },
      orderBy: { visitDate: "desc" },
    });

    return NextResponse.json(visitors);
  } catch (e: any) {
    console.error("GET /api/guest/visitors error:", e);
    return NextResponse.json(
      { error: "Failed to fetch visitors" },
      { status: 500 }
    );
  }
}

// POST /api/guest/visitors
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_session")?.value;
    if (!guestId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { visitorName, mobile, relation, visitDate, entryTime, exitTime } =
      await request.json();

    if (!visitorName || !visitDate) {
      return NextResponse.json(
        { error: "Visitor name and visit date are required" },
        { status: 400 }
      );
    }

    const visitor = await prisma.visitorLog.create({
      data: {
        guestId,
        visitorName,
        mobile: mobile || null,
        relation: relation || null,
        visitDate: new Date(visitDate),
        entryTime: entryTime ? new Date(`${visitDate}T${entryTime}`) : null,
        exitTime: exitTime ? new Date(`${visitDate}T${exitTime}`) : null,
        status: "expected",
      },
    });

    return NextResponse.json(visitor, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/guest/visitors error:", e);
    return NextResponse.json(
      { error: "Failed to add visitor" },
      { status: 500 }
    );
  }
}
