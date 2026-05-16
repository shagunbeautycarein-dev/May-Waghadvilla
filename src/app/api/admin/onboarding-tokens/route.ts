import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get("guestId");

    if (!guestId) {
      return NextResponse.json(
        { error: "Guest ID required" },
        { status: 400 }
      );
    }

    // Find the latest unused token for this guest
    const token = await prisma.onboardingToken.findFirst({
      where: { guestId, used: false },
      orderBy: { createdAt: "desc" },
    });

    if (!token) {
      return NextResponse.json(
        { error: "No active token found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      token: token.token,
      link: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/${token.token}`,
      expiresAt: token.expiresAt,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch token" },
      { status: 500 }
    );
  }
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

    // Generate secure random token
    const token = randomBytes(32).toString("hex");

    // Expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const onboardingToken = await prisma.onboardingToken.create({
      data: {
        guestId,
        token,
        expiresAt,
        used: false,
      },
    });

    return NextResponse.json({
      token: onboardingToken.token,
      link: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/${token}`,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create token" },
      { status: 500 }
    );
  }
}
