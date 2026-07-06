import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const { onboardingId, reason } = await request.json();

    if (!onboardingId || !reason) {
      return NextResponse.json(
        { error: "Onboarding ID and reason required" },
        { status: 400 }
      );
    }

    const onboarding = await prisma.onboardingData.update({
      where: { id: onboardingId },
      data: { status: "Rejected", rejectionReason: reason },
      include: { guest: { select: { bedId: true } } },
    });

    // Free the bed when onboarding is rejected so it becomes available again
    if (onboarding.guest?.bedId) {
      await prisma.bed.update({
        where: { id: onboarding.guest.bedId },
        data: { status: "Available", currentGuestId: null },
      });
    }

    const admin = await getCurrentAdmin();
    await logAudit({
      adminId: admin?.id,
      adminName: admin?.name,
      action: "REJECT",
      entity: "Guest",
      entityId: onboarding.guestId,
      details: { rejectionReason: reason },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Rejection failed" },
      { status: 500 }
    );
  }
}
