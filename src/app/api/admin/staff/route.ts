import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const staff = await prisma.staff.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(staff);
  } catch (e: any) {
    console.error("GET /api/admin/staff error:", e);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, mobile, role } = await request.json();
    if (!name || !role) {
      return NextResponse.json(
        { error: "Name and role are required" },
        { status: 400 }
      );
    }
    const staff = await prisma.staff.create({
      data: { name, mobile: mobile || null, role },
    });
    return NextResponse.json(staff, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/admin/staff error:", e);
    return NextResponse.json(
      { error: "Failed to create staff" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, name, mobile, role } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "Staff ID is required" },
        { status: 400 }
      );
    }
    const staff = await prisma.staff.update({
      where: { id },
      data: { name, mobile: mobile || null, role },
    });
    return NextResponse.json(staff);
  } catch (e: any) {
    console.error("PATCH /api/admin/staff error:", e);
    return NextResponse.json(
      { error: "Failed to update staff" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "Staff ID is required" },
        { status: 400 }
      );
    }
    await prisma.staff.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("DELETE /api/admin/staff error:", e);
    return NextResponse.json(
      { error: "Failed to delete staff" },
      { status: 500 }
    );
  }
}
