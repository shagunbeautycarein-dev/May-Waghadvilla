import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/db-safe";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const guest = await safeQuery(
      async () =>
        prisma.guest.findUnique({
          where: { email },
          include: { onboardingData: true },
        }),
      null
    );

    if (!guest || !guest.passwordHash) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, guest.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Set guest_session cookie
    const response = NextResponse.json({
      success: true,
      guest: {
        id: guest.id,
        name: guest.name,
        email: guest.email,
        onboardingStatus: guest.onboardingData?.status || "Draft",
      },
    });

    response.cookies.set("guest_session", guest.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
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
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
