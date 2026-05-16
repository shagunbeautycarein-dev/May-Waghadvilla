import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_session")?.value;

    if (!guestId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Find existing unused token
    let token = await prisma.onboardingToken.findFirst({
      where: { guestId, used: false },
      orderBy: { createdAt: "desc" },
    });

    // Create new token if none exists or expired
    if (!token || token.expiresAt < new Date()) {
      const newToken = randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      token = await prisma.onboardingToken.create({
        data: {
          guestId,
          token: newToken,
          expiresAt,
          used: false,
        },
      });
    }

    return NextResponse.json({
      token: token.token,
      link: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/${token.token}`,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to get onboarding token" },
      { status: 500 }
    );
  }
}
