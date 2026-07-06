import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { markTokenUsed } from "@/lib/onboarding";
import { calculateRentDifference } from "@/lib/rent-calculator";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { getCurrentAdmin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const { token, data, autoApprove } = await request.json();
    const admin = await getCurrentAdmin();

    const tokenRecord = await prisma.onboardingToken.findUnique({
      where: { token },
      include: { guest: { include: { bed: true } } },
    });

    if (!tokenRecord || tokenRecord.used) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 400 }
      );
    }

    // Validate documents are uploaded
    const docs = data.step4 || {};
    if (!docs.aadhar || !docs.aadharBack || !docs.pan || !docs.photo) {
      return NextResponse.json(
        { error: "Please upload Aadhar Card (Front & Back), PAN Card, and Passport Photo before submitting." },
        { status: 400 }
      );
    }

    const guest = tokenRecord.guest;

    // Check for duplicate active mobile
    const duplicateActive = await prisma.guest.findFirst({
      where: {
        mobile: guest.mobile,
        id: { not: guest.id },
        status: { in: ['Active', 'Active (Pending Move-In)', 'Notice Period'] },
        deletedAt: null,
      },
    });
    if (duplicateActive) {
      return NextResponse.json(
        { error: "An active guest with this mobile number already exists" },
        { status: 409 }
      );
    }

    const joiningDate = guest.joiningDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Normalize joining date to midnight for accurate date-only comparison
    const joinDateNormalized = joiningDate ? new Date(joiningDate) : null;
    if (joinDateNormalized) joinDateNormalized.setHours(0, 0, 0, 0);

    const bedStatus =
      joinDateNormalized && joinDateNormalized > today
        ? "Move-In Scheduled"
        : "Reserved";

    await prisma.onboardingData.upsert({
      where: { guestId: guest.id },
      update: {
        step1Personal: data.step1,
        step2Emergency: data.step2,
        step3Job: data.step3,
        step4Documents: data.step4,
        step5RulesAgreed: data.step5,
        step6TermsAgreed: data.step6,
        step7LeavingAgreed: data.step7,
        step8Payment: data.step8,
        status: autoApprove ? "Approved" : "Submitted",
      },
      create: {
        guestId: guest.id,
        step1Personal: data.step1,
        step2Emergency: data.step2,
        step3Job: data.step3,
        step4Documents: data.step4,
        step5RulesAgreed: data.step5,
        step6TermsAgreed: data.step6,
        step7LeavingAgreed: data.step7,
        step8Payment: data.step8,
        status: autoApprove ? "Approved" : "Submitted",
      },
    });

    if (data.step8) {
      const step8 = data.step8 as {
        amountPaid?: number | string;
        method?: string;
        transactionId?: string;
        proofUrl?: string;
        proofImages?: string[];
      };
      const proofImages = step8.proofImages
        ? step8.proofImages
        : step8.proofUrl
        ? [step8.proofUrl]
        : [];

      if (proofImages.length > 0 || Number(step8.amountPaid || 0) > 0) {
        await prisma.payment.create({
          data: {
            guestId: guest.id,
            amount: Number(step8.amountPaid) || 0,
            type: "onboarding",
            method: step8.method || "UPI",
            transactionId: step8.transactionId || null,
            proofImages,
            status: autoApprove ? "Approved" : "Uploaded",
            approvedBy: autoApprove ? (admin?.name || "admin") : null,
          },
        });
      }
    }

    if (guest.bedId) {
      await prisma.bed.update({
        where: { id: guest.bedId },
        data: { status: bedStatus, currentGuestId: guest.id },
      });
    }

    if (autoApprove) {
      const monthlyRent = Number(guest.monthlyRent);
      const deposit = Number(guest.deposit);
      const rentCycleDate = guest.rentCycleDate || 5;

      if (joiningDate && monthlyRent > 0) {
        const { differenceAmount } = calculateRentDifference(
          monthlyRent,
          joiningDate,
          rentCycleDate
        );

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

        await prisma.ledger.create({
          data: {
            guestId: guest.id,
            description: "Advance Rent",
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
      }

      const onboardingPayment = await prisma.payment.findFirst({
        where: { guestId: guest.id, status: "Approved" },
        orderBy: { createdAt: "desc" },
      });

      if (onboardingPayment) {
        let remaining = Number(onboardingPayment.amount);
        if (remaining > 0) {
          const ledgerEntries = await prisma.ledger.findMany({
            where: { guestId: guest.id, status: { in: ["Pending", "Partial"] } },
            orderBy: { createdAt: "asc" },
          });

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
                paymentId: onboardingPayment.id,
              },
            });

            remaining -= toApply;
          }
        }
      }

      const finalBedStatus =
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
          data: { status: finalBedStatus, currentGuestId: guest.id },
        });
      }

      await markTokenUsed(token);

      return NextResponse.json({
        success: true,
        bedStatus: finalBedStatus,
        guestStatus,
        credentials: {
          email: guest.email,
          password: tempPassword,
        },
      });
    }

    await markTokenUsed(token);

    return NextResponse.json({ success: true, bedStatus });
  } catch (e: any) {
    console.error("Submit error:", e);
    return NextResponse.json(
      { error: "Submit failed", details: e?.message || String(e) },
      { status: 500 }
    );
  }
}
