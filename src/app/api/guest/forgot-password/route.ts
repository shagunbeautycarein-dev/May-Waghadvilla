import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function generateTempPassword(length = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email?: string };

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const guest = await prisma.guest.findUnique({
      where: { email },
    });

    if (!guest) {
      return NextResponse.json({
        success: true,
        message: "Password reset. Contact admin for your new password.",
      });
    }

    const tempPassword = generateTempPassword(8);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await prisma.guest.update({
      where: { id: guest.id },
      data: { passwordHash },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset. Contact admin for your new password.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("GUEST FORGOT PASSWORD ERROR:", message);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}
