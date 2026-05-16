import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const notices = await prisma.notice.findMany({
      where: { deletedAt: null },
      include: {
        _count: { select: { reads: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = notices.map((n) => ({
      ...n,
      status:
        n.expiryDate && new Date(n.expiryDate) < new Date()
          ? "Expired"
          : "Active",
    }));

    return NextResponse.json(enriched);
  } catch (e: any) {
    console.error("GET /api/admin/notices error:", e);
    return NextResponse.json(
      { error: "Failed to fetch notices" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, message, type, targetId, sendDate, expiryDate } = body;

    if (!title || !message || !type) {
      return NextResponse.json(
        { error: "Title, message, and type are required" },
        { status: 400 }
      );
    }

    const notice = await prisma.notice.create({
      data: {
        title,
        message,
        type,
        targetId: targetId || null,
        sendDate: sendDate ? new Date(sendDate) : new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
    });

    return NextResponse.json(notice, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/admin/notices error:", e);
    return NextResponse.json(
      { error: "Failed to create notice" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "Notice ID is required" },
        { status: 400 }
      );
    }

    const notice = await prisma.notice.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json(notice);
  } catch (e: any) {
    console.error("PATCH /api/admin/notices error:", e);
    return NextResponse.json(
      { error: "Failed to delete notice" },
      { status: 500 }
    );
  }
}
