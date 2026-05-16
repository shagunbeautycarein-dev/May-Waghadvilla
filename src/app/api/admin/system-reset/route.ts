import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/admin-auth";

const RESET_TARGETS = [
  "guests",
  "inquiries",
  "rooms_and_beds",
  "onboarding_tokens",
  "onboarding_data",
  "payments",
  "ledger",
  "complaints",
  "notices",
  "electricity",
  "expenses",
  "expense_categories",
  "visitors",
  "bed_transfers",
  "deposit_refunds",
  "leaving_requests",
] as const;

type ResetTarget = (typeof RESET_TARGETS)[number];

export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (admin.role !== "Super Admin") {
      return NextResponse.json(
        { error: "Only Super Admin can perform system reset" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { mode, targets, confirmText } = body;

    if (mode === "full") {
      if (confirmText !== "RESET EVERYTHING") {
        return NextResponse.json(
          { error: "Confirmation text does not match" },
          { status: 400 }
        );
      }
      await performFullReset();
      return NextResponse.json({
        success: true,
        message: "Full system reset completed. Admin accounts and settings preserved.",
      });
    }

    if (mode === "selective") {
      if (!Array.isArray(targets) || targets.length === 0) {
        return NextResponse.json(
          { error: "No targets selected" },
          { status: 400 }
        );
      }
      const invalid = targets.filter((t: string) => !RESET_TARGETS.includes(t as ResetTarget));
      if (invalid.length > 0) {
        return NextResponse.json(
          { error: `Invalid targets: ${invalid.join(", ")}` },
          { status: 400 }
        );
      }
      const results = await performSelectiveReset(targets as ResetTarget[]);
      return NextResponse.json({
        success: true,
        message: "Selective reset completed.",
        results,
      });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (e) {
    console.error("System reset error:", e);
    return NextResponse.json(
      { error: "Reset failed", details: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

async function performFullReset() {
  await prisma.$transaction([
    // Soft delete all guests (this also frees beds via trigger logic if any)
    prisma.guest.updateMany({
      where: { deletedAt: null },
      data: { deletedAt: new Date(), status: "Inactive", bedId: null, roomId: null },
    }),
    // Reset all beds to Available
    prisma.bed.updateMany({
      where: {},
      data: { status: "Available", currentGuestId: null },
    }),
    // Delete data tables
    prisma.inquiry.deleteMany({}),
    prisma.onboardingToken.deleteMany({}),
    prisma.onboardingData.deleteMany({}),
    prisma.payment.deleteMany({}),
    prisma.ledger.deleteMany({}),
    prisma.complaint.deleteMany({}),
    prisma.noticeRead.deleteMany({}),
    prisma.notice.deleteMany({}),
    prisma.electricitySplit.deleteMany({}),
    prisma.electricityBill.deleteMany({}),
    prisma.expense.updateMany({ where: { deletedAt: null }, data: { deletedAt: new Date() } }),
    prisma.expenseCategory.updateMany({ where: { deletedAt: null }, data: { deletedAt: new Date() } }),
    prisma.visitorLog.deleteMany({}),
    prisma.bedTransfer.deleteMany({}),
    prisma.depositRefund.deleteMany({}),
    prisma.leavingRequest.deleteMany({}),
  ]);
}

async function performSelectiveReset(targets: ResetTarget[]) {
  const results: Record<string, number> = {};

  for (const target of targets) {
    switch (target) {
      case "guests": {
        const res = await prisma.guest.updateMany({
          where: { deletedAt: null },
          data: { deletedAt: new Date(), status: "Inactive", bedId: null, roomId: null },
        });
        await prisma.bed.updateMany({ where: {}, data: { status: "Available", currentGuestId: null } });
        results.guests = res.count;
        break;
      }
      case "inquiries": {
        const res = await prisma.inquiry.deleteMany({});
        results.inquiries = res.count;
        break;
      }
      case "rooms_and_beds": {
        await prisma.bed.updateMany({ where: {}, data: { status: "Available", currentGuestId: null } });
        const beds = await prisma.bed.updateMany({ where: { deletedAt: null }, data: { deletedAt: new Date() } });
        const rooms = await prisma.room.updateMany({ where: { deletedAt: null }, data: { deletedAt: new Date() } });
        results.rooms = rooms.count;
        results.beds = beds.count;
        break;
      }
      case "onboarding_tokens": {
        const res = await prisma.onboardingToken.deleteMany({});
        results.onboarding_tokens = res.count;
        break;
      }
      case "onboarding_data": {
        const res = await prisma.onboardingData.deleteMany({});
        results.onboarding_data = res.count;
        break;
      }
      case "payments": {
        const res = await prisma.payment.deleteMany({});
        results.payments = res.count;
        break;
      }
      case "ledger": {
        const res = await prisma.ledger.deleteMany({});
        results.ledger = res.count;
        break;
      }
      case "complaints": {
        const res = await prisma.complaint.deleteMany({});
        results.complaints = res.count;
        break;
      }
      case "notices": {
        await prisma.noticeRead.deleteMany({});
        const res = await prisma.notice.deleteMany({});
        results.notices = res.count;
        break;
      }
      case "electricity": {
        await prisma.electricitySplit.deleteMany({});
        const res = await prisma.electricityBill.deleteMany({});
        results.electricity = res.count;
        break;
      }
      case "expenses": {
        const res = await prisma.expense.updateMany({
          where: { deletedAt: null },
          data: { deletedAt: new Date() },
        });
        results.expenses = res.count;
        break;
      }
      case "expense_categories": {
        const res = await prisma.expenseCategory.updateMany({
          where: { deletedAt: null },
          data: { deletedAt: new Date() },
        });
        results.expense_categories = res.count;
        break;
      }
      case "visitors": {
        const res = await prisma.visitorLog.deleteMany({});
        results.visitors = res.count;
        break;
      }
      case "bed_transfers": {
        const res = await prisma.bedTransfer.deleteMany({});
        results.bed_transfers = res.count;
        break;
      }
      case "deposit_refunds": {
        const res = await prisma.depositRefund.deleteMany({});
        results.deposit_refunds = res.count;
        break;
      }
      case "leaving_requests": {
        const res = await prisma.leavingRequest.deleteMany({});
        results.leaving_requests = res.count;
        break;
      }
    }
  }

  return results;
}
