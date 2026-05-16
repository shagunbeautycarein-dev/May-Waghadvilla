import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// GET /api/guest/leaving
export async function GET() {
  try {
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_session")?.value;
    if (!guestId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const requests = await prisma.leavingRequest.findMany({
      where: { guestId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (e: any) {
    console.error("GET /api/guest/leaving error:", e);
    return NextResponse.json(
      { error: "Failed to fetch leaving requests" },
      { status: 500 }
    );
  }
}

// POST /api/guest/leaving
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_session")?.value;
    if (!guestId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { lastDate, reason } = await request.json();
    if (!lastDate || !reason) {
      return NextResponse.json(
        { error: "Last date and reason are required" },
        { status: 400 }
      );
    }

    // Check notice period
    const noticePeriodSetting = await prisma.setting.findUnique({
      where: { key: "notice_period_days" },
    });
    const noticePeriodDays = noticePeriodSetting?.value
      ? Number(noticePeriodSetting.value)
      : 30;

    const minDate = new Date();
    minDate.setDate(minDate.getDate() + noticePeriodDays);
    minDate.setHours(0, 0, 0, 0);

    const selectedDate = new Date(lastDate);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < minDate) {
      return NextResponse.json(
        { error: `Minimum ${noticePeriodDays} days notice required` },
        { status: 400 }
      );
    }

    // Check for existing request
    const existing = await prisma.leavingRequest.findFirst({
      where: { guestId, status: { in: ["submitted", "approved"] } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You already have a pending leaving request" },
        { status: 400 }
      );
    }

    const requestRecord = await prisma.leavingRequest.create({
      data: {
        guestId,
        requestDate: new Date(),
        lastDate: selectedDate,
        reason,
        status: "submitted",
      },
    });

    return NextResponse.json(requestRecord, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/guest/leaving error:", e);
    return NextResponse.json(
      { error: "Failed to submit leaving notice" },
      { status: 500 }
    );
  }
}
