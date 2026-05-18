import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_session")?.value;

    if (!guestId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const complaints = await prisma.complaint.findMany({
      where: { guestId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(complaints);
  } catch (e: any) {
    console.error("GET /api/guest/complaints error:", e);
    return NextResponse.json(
      { error: "Failed to fetch complaints" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_session")?.value;

    if (!guestId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { category, priority, description, images } = body;

    if (!category || !description) {
      return NextResponse.json(
        { error: "Category and description are required" },
        { status: 400 }
      );
    }

    const complaint = await prisma.complaint.create({
      data: {
        guestId,
        category,
        priority: priority || "Medium",
        description,
        images: images || [],
        status: "Pending",
      },
    });

    return NextResponse.json(complaint, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/guest/complaints error:", e);
    return NextResponse.json(
      { error: "Failed to create complaint" },
      { status: 500 }
    );
  }
}
