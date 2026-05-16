import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateRentDifference } from "@/lib/rent-calculator";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";

const directEntrySchema = z.object({
  roomId: z.string().uuid(),
  bedId: z.string().uuid(),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  monthlyRent: z.number().positive(),
  deposit: z.number().positive(),
  rentCycleDate: z.number().min(1).max(28).default(5),

  name: z.string().min(2).max(100),
  mobile: z.string().regex(/^[0-9]{10}$/),
  email: z.string().email(),
  address: z.string().min(5).max(500).optional(),

  idType: z.enum(["Aadhaar", "PAN", "Passport", "Other"]).optional(),
  idNumber: z.string().optional(),
  idImage: z.string().optional(),

  amountPaid: z.number().min(0),
  paymentMethod: z.enum(["Cash", "UPI", "Bank Transfer", "Card"]).default("Cash"),
  paymentProof: z.string().optional(),

  depositAmount: z.number().min(0).optional(),
  rentAmount: z.number().min(0).optional(),
  rentForMonth: z.number().min(1).max(12).optional(),
  rentForYear: z.number().min(2020).max(2030).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = directEntrySchema.parse(body);

    const bed = await prisma.bed.findUnique({
      where: { id: data.bedId },
    });

    if (!bed || bed.status !== "Available") {
      return NextResponse.json(
        { error: "Bed is not available" },
        { status: 400 }
      );
    }

    const existingActive = await prisma.guest.findFirst({
      where: {
        mobile: data.mobile,
        status: { in: ['Active', 'Active (Pending Move-In)', 'Notice Period'] },
        deletedAt: null,
      },
    });
    if (existingActive) {
      return NextResponse.json(
        { error: "An active guest with this mobile number already exists" },
        { status: 409 }
      );
    }

    const existingEmail = await prisma.guest.findUnique({
      where: { email: data.email } });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const joiningDate = new Date(data.joiningDate);
    joiningDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tempPassword = randomBytes(4).toString("hex");
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const guestStatus = joiningDate > today
      ? "Active (Pending Move-In)"
      : "Active";

    const guest = await prisma.guest.create({
      data: {
        name: data.name,
        mobile: data.mobile,
        email: data.email,
        status: guestStatus,
        roomId: data.roomId,
        bedId: data.bedId,
        joiningDate,
        monthlyRent: data.monthlyRent,
        deposit: data.deposit,
        rentCycleDate: data.rentCycleDate,
        passwordHash,
      },
    });

    const { differenceAmount } = calculateRentDifference(
      data.monthlyRent,
      joiningDate,
      data.rentCycleDate
    );

    await prisma.onboardingData.create({
      data: {
        guestId: guest.id,
        step1Personal: {
          fullName: data.name,
          mobile: data.mobile,
          email: data.email,
          address: data.address || "",
        },
        step4Documents: data.idType
          ? {
              idType: data.idType,
              idNumber: data.idNumber,
              idFrontUrl: data.idImage,
            }
          : undefined,
        step5RulesAgreed: true,
        step6TermsAgreed: true,
        step7LeavingAgreed: true,
        step8Payment: {
          amountPaid: data.amountPaid,
          method: data.paymentMethod,
          proofImages: data.paymentProof ? [data.paymentProof] : [],
        },
        status: "Approved",
      },
    });

    const depInput = Number(data.depositAmount || 0);
    const rentInput = Number(data.rentAmount || 0);
    const hasSplit = depInput + rentInput > 0 && depInput + rentInput === data.amountPaid;

    if (data.amountPaid > 0) {
      const monthLabel = data.rentForMonth && data.rentForYear
        ? `${new Date(data.rentForYear, data.rentForMonth - 1).toLocaleString("en-IN", { month: "long" })} ${data.rentForYear}`
        : undefined;

      await prisma.payment.create({
        data: {
          guestId: guest.id,
          amount: data.amountPaid,
          type: "onboarding",
          method: data.paymentMethod,
          proofImages: data.paymentProof ? [data.paymentProof] : [],
          status: "Approved",
          approvedBy: "admin",
          depositAmount: hasSplit && depInput > 0 ? depInput : null,
          rentAmount: hasSplit && rentInput > 0 ? rentInput : null,
          rentForMonth: hasSplit && rentInput > 0 ? data.rentForMonth : null,
          rentForYear: hasSplit && rentInput > 0 ? data.rentForYear : null,
        },
      });
    }

    // Step 1: Create all ledger entries with paid=0, due=full amount
    if (differenceAmount > 0) {
      await prisma.ledger.create({
        data: {
          guestId: guest.id,
          description: "Rent Difference",
          amount: differenceAmount,
          paid: 0,
          due: differenceAmount,
          status: "Pending",
        },
      });
    }

    const monthLabel = data.rentForMonth && data.rentForYear
      ? `${new Date(data.rentForYear, data.rentForMonth - 1).toLocaleString("en-IN", { month: "long" })} ${data.rentForYear}`
      : "Advance Rent";

    await prisma.ledger.create({
      data: {
        guestId: guest.id,
        description: `Advance Rent (${monthLabel})`,
        amount: data.monthlyRent,
        paid: 0,
        due: data.monthlyRent,
        status: "Pending",
      },
    });

    await prisma.ledger.create({
      data: {
        guestId: guest.id,
        description: "Security Deposit",
        amount: data.deposit,
        paid: 0,
        due: data.deposit,
        status: "Pending",
      },
    });

    // Step 2: Fetch all pending ledgers for this guest
    const ledgerEntries = await prisma.ledger.findMany({
      where: { guestId: guest.id, status: { in: ["Pending", "Partial"] } },
      orderBy: { createdAt: "asc" },
    });

    // Step 3: Distribute payment using FIFO
    if (hasSplit) {
      let depositRemaining = depInput;
      let rentRemaining = rentInput;

      for (const entry of ledgerEntries) {
        const entryAmount = Number(entry.amount);
        const entryDue = Number(entry.due);
        let toApply = 0;

        const isDeposit = entry.description.includes("Security Deposit");
        const isRent = entry.description.includes("Rent");

        if (isDeposit && depositRemaining > 0) {
          toApply = Math.min(depositRemaining, entryDue);
          depositRemaining -= toApply;
        } else if (isRent && rentRemaining > 0) {
          toApply = Math.min(rentRemaining, entryDue);
          rentRemaining -= toApply;
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
            },
          });
        }
      }
    } else if (data.amountPaid > 0) {
      let remaining = data.amountPaid;
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
          },
        });

        remaining -= toApply;
      }
    }

    const bedStatus = joiningDate > today ? "Move-In Scheduled" : "Occupied";

    await prisma.bed.update({
      where: { id: data.bedId },
      data: {
        status: bedStatus,
        currentGuestId: guest.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        guest: {
          id: guest.id,
          name: guest.name,
          email: guest.email,
          roomId: guest.roomId,
          bedId: guest.bedId,
        },
        credentials: {
          email: guest.email,
          password: tempPassword,
        },
        bedStatus,
        totalPayable: differenceAmount + data.monthlyRent + data.deposit,
        amountPaid: data.amountPaid,
        dueAmount:
          differenceAmount + data.monthlyRent + data.deposit - data.amountPaid,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("Direct entry error:", error);
    return NextResponse.json(
      { error: "Failed to create guest" },
      { status: 500 }
    );
  }
}
