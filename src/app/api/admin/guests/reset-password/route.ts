import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function generatePassword(length = 10): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(request: Request) {
  try {
    const { guestId } = await request.json();

    if (!guestId) {
      return NextResponse.json(
        { error: "Guest ID required" },
        { status: 400 }
      );
    }

    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
    });

    if (!guest) {
      return NextResponse.json(
        { error: "Guest not found" },
        { status: 404 }
      );
    }

    const passwordPlain = generatePassword();
    const passwordHash = await bcrypt.hash(passwordPlain, 10);

    await prisma.guest.update({
      where: { id: guestId },
      data: { passwordHash },
    });

    return NextResponse.json({
      success: true,
      credentials: {
        email: guest.email,
        password: passwordPlain,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
