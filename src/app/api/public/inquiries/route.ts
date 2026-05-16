import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limit = await rateLimitResponse(request);
  if (limit) return limit;

  try {
    const body = await request.json();

    const inquiry = await prisma.inquiry.create({
      data: {
        name: body.name,
        mobile: body.mobile,
        email: body.email || null,
        visitDate: new Date(body.visitDate),
        timeSlot: body.timeSlot,
        roomId: body.roomId || null,
        bedId: body.bedId || null,
        status: "New Inquiry",
      },
    });

    return NextResponse.json(inquiry, { status: 201 });
  } catch (e: any) {
    console.error("Inquiry create error:", e);
    return NextResponse.json(
      { error: "Failed to create inquiry", details: e?.message || String(e) },
      { status: 500 }
    );
  }
}
