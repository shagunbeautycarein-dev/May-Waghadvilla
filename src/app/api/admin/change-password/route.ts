import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const adminId = cookieStore.get("admin_session")?.value;
    if (!adminId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.admin.update({ where: { id: adminId }, data: { passwordHash: newHash } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
