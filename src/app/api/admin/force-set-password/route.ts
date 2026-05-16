import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * Force Set Admin Password
 * POST { email, password }
 * Finds or creates admin by email, sets password to exact value provided.
 * Use this to fix login when seed/reset didn't work.
 */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find existing admin
    let admin = await prisma.admin.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, role: true },
    });

    const hashedPassword = await bcrypt.hash(password, 12);

    if (admin) {
      // Update existing admin password
      await prisma.admin.update({
        where: { id: admin.id },
        data: { passwordHash: hashedPassword },
      });
    } else {
      // Create new admin if not found
      admin = await prisma.admin.create({
        data: {
          name: "Super Admin",
          email,
          passwordHash: hashedPassword,
          role: "Super Admin",
          isActive: true,
        },
        select: { id: true, name: true, email: true, role: true },
      });
    }

    return NextResponse.json({
      success: true,
      message: admin
        ? "Password updated successfully"
        : "Admin created and password set",
      admin,
      credentials: { email, password },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed", detail: error?.message || String(error) },
      { status: 500 }
    );
  }
}
