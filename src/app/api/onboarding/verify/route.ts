import { NextResponse } from "next/server";
import { verifyOnboardingToken } from "@/lib/onboarding";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token required" },
        { status: 400 }
      );
    }

    const record = await verifyOnboardingToken(token);

    if (!record) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      guest: record.guest,
      onboardingData: record.guest?.onboardingData,
    });
  } catch {
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
