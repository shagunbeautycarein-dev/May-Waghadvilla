import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * One-time setup endpoint.
 * Creates the default Super Admin if no admin exists in the database.
 * Safe to call multiple times â€” it only creates if none exist.
 */
export async function GET() {
  try {
    const adminCount = await prisma.admin.count();

    if (adminCount > 0) {
      const admin = await prisma.admin.findFirst({
        select: { id: true, email: true, role: true },
      });
      return NextResponse.json({
        message: "Admin already exists",
        admin,
        loginUrl: "/admin/login",
        credentials: "Use your existing admin password",
      });
    }

    const hashedPassword = await bcrypt.hash("admin123", 12);
    const admin = await prisma.admin.create({
      data: {
        name: "Super Admin",
        email: "admin@Waghadvilla.com",
        passwordHash: hashedPassword,
        role: "Super Admin",
        isActive: true,
      },
    });

    return NextResponse.json({
      message: "Default Super Admin created successfully",
      admin: { id: admin.id, email: admin.email, role: admin.role },
      loginUrl: "/admin/login",
      credentials: "admin@Waghadvilla.com / admin123",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Setup failed", detail: error?.message || String(error) },
      { status: 500 }
    );
  }
}
