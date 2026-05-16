import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateRentDifference } from "@/lib/rent-calculator";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      onboardingId,
      depositAmount: manualDeposit,
      rentDifferenceAmount: manualRentDiff,
      advanceRentAmount: manualAdvanceRent,
      advanceRentMonth,
      advanceRentYear,
    } = body;

    console.log("[APPROVE] Request body:", JSON.stringify(body));

    if (!onboardingId || typeof onboardingId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid onboardingId" },
        { status: 400 }
      );
    }

    const admin = await getCurrentAdmin();

    const onboarding = await prisma.onboardingData.findUnique({
      where: { id: onboardingId },
      include: { guest: { include: { room: true, bed: true } } },
    });

    if (!onboarding || onboarding.status !== "Submitted") {
      return NextResponse.json(
        { error: "Invalid onboarding" },
        { status: 400 }
      );
    }

    const guest = onboarding.guest;
    const joiningDate = guest.joiningDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Normalize joining date to midnight for accurate date-only comparison
    const joinDateNormalized = joiningDate ? new Date(joiningDate) : null;
    if (joinDateNormalized) joinDateNormalized.setHours(0, 0, 0, 0);

    const bedStatus =
      joinDateNormalized && joinDateNormalized > today
        ? "Move-In Scheduled"
        : "Occupied";
    const guestStatus =
      joinDateNormalized && joinDateNormalized > today
        ? "Active (Pending Move-In)"
        : "Active";

    const tempPassword = randomBytes(4).toString("hex");
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await prisma.guest.update({
      where: { id: guest.id },
      data: { status: guestStatus, passwordHash },
    });

    if (guest.bedId) {
      await prisma.bed.update({
        where: { id: guest.bedId },
        data: { status: bedStatus, currentGuestId: guest.id },
      });
    }

    await prisma.onboardingData.update({
      where: { id: onboardingId },
      data: { status: "Approved" },
    });

    const monthlyRent = Number(guest.monthlyRent);
    const deposit = Number(guest.deposit);
    const rentCycleDate = guest.rentCycleDate || 5;

    // Get the onboarding payment
    const onboardingPayment = await prisma.payment.findFirst({
      where: { guestId: guest.id, status: "Uploaded" },
      orderBy: { createdAt: "desc" },
    });

    const totalPaid = onboardingPayment ? Number(onboardingPayment.amount) : 0;
    const depInput = Number(manualDeposit || 0);
    const rentDiffInput = Number(manualRentDiff || 0);
    const advanceRentInput = Number(manualAdvanceRent || 0);
    const totalSplit = depInput + rentDiffInput + advanceRentInput;
    const hasSplit = totalSplit > 0 && totalSplit === totalPaid;

    // Update payment with split data if provided
    if (onboardingPayment && totalPaid > 0) {
      await prisma.payment.update({
        where: { id: onboardingPayment.id },
        data: {
          status: "Approved",
          approvedBy: admin?.name || "admin",
          depositAmount: hasSplit && depInput > 0 ? depInput : null,
          rentAmount: hasSplit && (rentDiffInput + advanceRentInput) > 0 ? rentDiffInput + advanceRentInput : null,
          rentForMonth: hasSplit && advanceRentInput > 0 ? advanceRentMonth : null,
          rentForYear: hasSplit && advanceRentInput > 0 ? advanceRentYear : null,
        },
      });
    }

    if (joiningDate && monthlyRent > 0) {
      const { differenceAmount } = calculateRentDifference(
        monthlyRent,
        joiningDate,
        rentCycleDate
      );

      const monthLabel = advanceRentMonth && advanceRentYear
        ? `${new Date(advanceRentYear, advanceRentMonth - 1).toLocaleString("en-IN", { month: "long" })} ${advanceRentYear}`
        : "Advance Rent";

      // Step 1: Create all ledger entries with paid=0, due=full amount
      if (differenceAmount > 0) {
        await prisma.ledger.create({
          data: {
            guestId: guest.id,
            description: `Rent Difference (${joiningDate.toDateString()} - Cycle Date)`,
            amount: differenceAmount,
            paid: 0,
            due: differenceAmount,
            status: "Pending",
          },
        });
      }

      await prisma.ledger.create({
        data: {
          guestId: guest.id,
          description: `Advance Rent (${monthLabel})`,
          amount: monthlyRent,
          paid: 0,
          due: monthlyRent,
          status: "Pending",
        },
      });

      if (deposit > 0) {
        await prisma.ledger.create({
          data: {
            guestId: guest.id,
            description: "Security Deposit",
            amount: deposit,
            paid: 0,
            due: deposit,
            status: "Pending",
          },
        });
      }

      // Step 2: Fetch all pending ledgers for this guest, ordered by creation
      const ledgerEntries = await prisma.ledger.findMany({
        where: { guestId: guest.id, status: { in: ["Pending", "Partial"] } },
        orderBy: { createdAt: "asc" },
      });

      // Step 3: Distribute payment using split amounts directly
      if (hasSplit) {
        let depositRemaining = depInput;
        let rentDiffRemaining = rentDiffInput;
        let advanceRentRemaining = advanceRentInput;

        for (const entry of ledgerEntries) {
          const entryAmount = Number(entry.amount);
          const entryDue = Number(entry.due);
          let toApply = 0;

          const isDeposit = entry.description.includes("Security Deposit");
          const isRentDiff = entry.description.includes("Rent Difference");
          const isAdvanceRent = entry.description.includes("Advance Rent");

          if (isDeposit && depositRemaining > 0) {
            toApply = Math.min(depositRemaining, entryDue);
            depositRemaining -= toApply;
          } else if (isRentDiff && rentDiffRemaining > 0) {
            toApply = Math.min(rentDiffRemaining, entryDue);
            rentDiffRemaining -= toApply;
          } else if (isAdvanceRent && advanceRentRemaining > 0) {
            toApply = Math.min(advanceRentRemaining, entryDue);
            advanceRentRemaining -= toApply;
          }

          if (toApply > 0) {
            const newPaid = Number(entry.paid) + toApply;
            const newDue = Math.max(0, entryAmount - newPaid);
            await prisma.ledger.update({
              where: { id: entry.id },
              data: {
                paid: newPaid,
                due: newDue,
                status: newDue <= 0 ? "Paid" : "Partial",
                paymentId: onboardingPayment?.id || null,
              },
            });
          }
        }
      } else if (totalPaid > 0) {
        // Auto-allocate: distribute total payment across all ledgers in FIFO order
        let remaining = totalPaid;
        for (const entry of ledgerEntries) {
          if (remaining <= 0) break;
          const entryDue = Number(entry.due);
          const toApply = Math.min(remaining, entryDue);

          await prisma.ledger.update({
            where: { id: entry.id },
            data: {
              paid: { increment: toApply },
              due: { decrement: toApply },
              status: toApply >= entryDue ? "Paid" : "Partial",
              paymentId: onboardingPayment?.id || null,
            },
          });

          remaining -= toApply;
        }
      }
    }

    await logAudit({
      adminId: admin?.id,
      adminName: admin?.name,
      action: "APPROVE",
      entity: "Guest",
      entityId: guest.id,
      details: {
        before: { status: onboarding.status },
        after: { status: "Approved", guestStatus, bedStatus },
      },
    });

    return NextResponse.json({
      success: true,
      bedStatus,
      guestStatus,
      credentials: {
        email: guest.email,
        password: tempPassword,
      },
    });
  } catch (e: any) {
    console.error("[APPROVE] Uncaught error:", e);
    return NextResponse.json(
      { error: "Approval failed", details: e?.message || String(e) },
      { status: 500 }
    );
  }
}
