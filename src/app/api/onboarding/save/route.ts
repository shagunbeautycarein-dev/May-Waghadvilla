import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { token, step, data } = await request.json();

    const tokenRecord = await prisma.onboardingToken.findUnique({
      where: { token },
      include: { guest: true },
    });

    if (!tokenRecord || tokenRecord.used) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 400 }
      );
    }

    const guestId = tokenRecord.guestId;

    // Build update data dynamically based on step
    const updateData: Record<string, unknown> = { status: "Draft" };
    if (step === 1) updateData.step1Personal = data.step1;
    if (step === 2) updateData.step2Emergency = data.step2;
    if (step === 3) updateData.step3Job = data.step3;
    if (step === 4) updateData.step4Documents = data.step4;
    if (step === 5) updateData.step5RulesAgreed = data.step5;
    if (step === 6) updateData.step6TermsAgreed = data.step6;
    if (step === 7) updateData.step7LeavingAgreed = data.step7;
    if (step === 8) updateData.step8Payment = data.step8;

    await prisma.onboardingData.upsert({
      where: { guestId },
      update: updateData,
      create: {
        guestId,
        ...updateData,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Save error:", e);
    return NextResponse.json(
      { error: "Save failed", details: e?.message || String(e) },
      { status: 500 }
    );
  }
}
