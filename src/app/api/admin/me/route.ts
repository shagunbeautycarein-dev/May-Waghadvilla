import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/db-safe";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminId = cookieStore.get("admin_session")?.value;

    if (!adminId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = await safeQuery(
      async () =>
        prisma.admin.findUnique({
          where: { id: adminId },
          select: { id: true, name: true, email: true, role: true },
        }),
      null
    );

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json(admin);
  } catch (error: any) {
    const msg = error?.message || "";
    if (
      msg.includes("ENOTFOUND") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("can't reach database")
    ) {
      return NextResponse.json(
        { error: "Database is currently unreachable. Please try again later." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Failed to fetch admin" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const adminId = cookieStore.get("admin_session")?.value;
    if (!adminId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { name, email } = await request.json();
    const admin = await prisma.admin.update({
      where: { id: adminId },
      data: { name, email },
      select: { id: true, name: true, email: true, role: true },
    });
    return NextResponse.json(admin);
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
