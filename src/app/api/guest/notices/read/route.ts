import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_session")?.value;

    if (!guestId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { noticeId } = await request.json();
    if (!noticeId) {
      return NextResponse.json(
        { error: "Notice ID is required" },
        { status: 400 }
      );
    }

    await prisma.noticeRead.create({
      data: { noticeId, guestId },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    // Ignore unique constraint violations (already read)
    if (e.code === "P2002") {
      return NextResponse.json({ success: true });
    }
    console.error("POST /api/guest/notices/read error:", e);
    return NextResponse.json(
      { error: "Failed to mark as read" },
      { status: 500 }
    );
  }
}
