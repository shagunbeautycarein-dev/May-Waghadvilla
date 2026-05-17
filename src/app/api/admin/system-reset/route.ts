import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/admin-auth";

const RESET_TARGETS = [
  "guests",
  "inquiries",
  "rooms_and_beds",
  "floors",
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
  "password_resets",
  "audit_logs",
  "staff",
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
        message: "Full system reset completed. Admin accounts and settings preserved. All guest data permanently erased.",
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
    // 1. Junction / child records first
    prisma.noticeRead.deleteMany({}),
    prisma.electricitySplit.deleteMany({}),

    // 2. Delete all records with explicit FK relations to Guest
    prisma.onboardingData.deleteMany({}),
    prisma.onboardingToken.deleteMany({}),
    prisma.payment.deleteMany({}),
    prisma.ledger.deleteMany({}),
    prisma.complaint.deleteMany({}),
    prisma.visitorLog.deleteMany({}),

    // 3. Delete records referencing Bed / Room / Guest (no explicit Prisma relations)
    prisma.bedTransfer.deleteMany({}),
    prisma.depositRefund.deleteMany({}),
    prisma.leavingRequest.deleteMany({}),
    prisma.passwordReset.deleteMany({}),

    // 4. Delete electricity bills (referenced by splits, already deleted)
    prisma.electricityBill.deleteMany({}),

    // 5. Clear bed guest references before hard-deleting guests
    prisma.bed.updateMany({ where: {}, data: { currentGuestId: null } }),

    // 6. HARD DELETE all guests — emails, passwords, everything permanently gone
    prisma.guest.deleteMany({}),

    // 7. Delete expenses before categories
    prisma.expense.deleteMany({}),

    // 8. Delete remaining independent records
    prisma.inquiry.deleteMany({}),
    prisma.notice.deleteMany({}),
    prisma.expenseCategory.deleteMany({}),
    prisma.staff.deleteMany({}),
    prisma.auditLog.deleteMany({}),

    // 9. Delete beds
    prisma.bed.deleteMany({}),

    // 10. Delete rooms
    prisma.room.deleteMany({}),

    // 11. Delete floors
    prisma.floor.deleteMany({}),
  ]);
}

async function performSelectiveReset(targets: ResetTarget[]) {
  const results: Record<string, number> = {};

  for (const target of targets) {
    switch (target) {
      case "guests": {
        // Hard-delete guests: first clear child records, then guests
        await prisma.onboardingData.deleteMany({});
        await prisma.onboardingToken.deleteMany({});
        await prisma.payment.deleteMany({});
        await prisma.ledger.deleteMany({});
        await prisma.complaint.deleteMany({});
        await prisma.visitorLog.deleteMany({});
        await prisma.bedTransfer.deleteMany({});
        await prisma.depositRefund.deleteMany({});
        await prisma.leavingRequest.deleteMany({});
        await prisma.passwordReset.deleteMany({});
        await prisma.electricitySplit.deleteMany({});
        await prisma.electricityBill.deleteMany({});
        await prisma.bed.updateMany({ where: {}, data: { currentGuestId: null } });
        const res = await prisma.guest.deleteMany({});
        await prisma.bed.updateMany({ where: {}, data: { status: "Available" } });
        results.guests = res.count;
        break;
      }
      case "inquiries": {
        const res = await prisma.inquiry.deleteMany({});
        results.inquiries = res.count;
        break;
      }
      case "rooms_and_beds": {
        await prisma.electricitySplit.deleteMany({});
        await prisma.electricityBill.deleteMany({});
        await prisma.bed.updateMany({ where: {}, data: { currentGuestId: null } });
        const beds = await prisma.bed.deleteMany({});
        const rooms = await prisma.room.deleteMany({});
        results.rooms = rooms.count;
        results.beds = beds.count;
        break;
      }
      case "floors": {
        const res = await prisma.floor.deleteMany({});
        results.floors = res.count;
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
        await prisma.electricitySplit.deleteMany({});
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
        const res = await prisma.expense.deleteMany({});
        results.expenses = res.count;
        break;
      }
      case "expense_categories": {
        await prisma.expense.deleteMany({});
        const res = await prisma.expenseCategory.deleteMany({});
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
      case "password_resets": {
        const res = await prisma.passwordReset.deleteMany({});
        results.password_resets = res.count;
        break;
      }
      case "audit_logs": {
        const res = await prisma.auditLog.deleteMany({});
        results.audit_logs = res.count;
        break;
      }
      case "staff": {
        const res = await prisma.staff.deleteMany({});
        results.staff = res.count;
        break;
      }
    }
  }

  return results;
}
