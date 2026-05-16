import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

/**
 * Admin Password Reset
 * POST { email }
 * Finds admin by email, generates a new random password, hashes & saves it.
 * Returns the new plaintext password (one-time display).
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "No admin found with that email" },
        { status: 404 }
      );
    }

    // Generate a secure random 12-character hex password
    const newPassword = randomBytes(6).toString("hex");
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.admin.update({
      where: { id: admin.id },
      data: { passwordHash: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
      admin: { id: admin.id, name: admin.name, email: admin.email },
      newPassword,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Reset failed", detail: error?.message || String(error) },
      { status: 500 }
    );
  }
}
