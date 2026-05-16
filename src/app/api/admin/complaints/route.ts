import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");

    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        guest: {
          select: { id: true, name: true, mobile: true, room: { select: { name: true } }, bed: { select: { name: true } } },
        },
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(complaints);
  } catch (e: any) {
    console.error("GET /api/admin/complaints error:", e);
    return NextResponse.json(
      { error: "Failed to fetch complaints" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, priority, assignedStaffId, remarks } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Complaint ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedStaffId !== undefined) updateData.assignedStaffId = assignedStaffId || null;
    if (remarks !== undefined) updateData.remarks = remarks;

    const complaint = await prisma.complaint.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(complaint);
  } catch (e: any) {
    console.error("PATCH /api/admin/complaints error:", e);
    return NextResponse.json(
      { error: "Failed to update complaint" },
      { status: 500 }
    );
  }
}
