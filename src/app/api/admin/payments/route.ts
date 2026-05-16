import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const payments = await prisma.payment.findMany({
      where,
      include: { guest: { include: { room: true, bed: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(payments);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const {
      guestId,
      amount,
      type,
      method,
      transactionId,
      proofImages,
      depositAmount,
      rentAmount,
      rentForMonth,
      rentForYear,
    } = await request.json();

    if (!guestId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Guest ID and valid amount are required" },
        { status: 400 }
      );
    }

    const dep = Number(depositAmount || 0);
    const rent = Number(rentAmount || 0);

    if (dep + rent > 0 && dep + rent !== Number(amount)) {
      return NextResponse.json(
        { error: `Deposit (₹${dep}) + Rent (₹${rent}) must equal total amount (₹${amount})` },
        { status: 400 }
      );
    }

    const payment = await prisma.$transaction(async (tx) => {
      const guest = await tx.guest.findUnique({
        where: { id: guestId },
        select: { monthlyRent: true, deposit: true },
      });

      if (!guest) {
        throw new Error("Guest not found");
      }

      const createdPayment = await tx.payment.create({
        data: {
          guestId,
          amount: Number(amount),
          type: type || "rent",
          method: method || "Cash",
          transactionId: transactionId || null,
          proofImages: proofImages || [],
          status: "Approved",
          depositAmount: dep > 0 ? dep : null,
          rentAmount: rent > 0 ? rent : null,
          rentForMonth: rent > 0 ? rentForMonth : null,
          rentForYear: rent > 0 ? rentForYear : null,
        },
      });

      const monthlyRent = Number(guest.monthlyRent || 0);
      const totalDeposit = Number(guest.deposit || 0);

      // Apply to Security Deposit ledger
      if (dep > 0 && totalDeposit > 0) {
        const depositLedger = await tx.ledger.findFirst({
          where: {
            guestId,
            description: { startsWith: "Security Deposit" },
          },
          orderBy: { createdAt: "desc" },
        });

        if (depositLedger) {
          const newPaid = Number(depositLedger.paid) + dep;
          const newDue = Math.max(0, Number(depositLedger.amount) - newPaid);
          await tx.ledger.update({
            where: { id: depositLedger.id },
            data: {
              paid: newPaid,
              due: newDue,
              status: newDue <= 0 ? "Paid" : newPaid > 0 ? "Partial" : "Pending",
              paymentId: createdPayment.id,
            },
          });
        } else {
          await tx.ledger.create({
            data: {
              guestId,
              description: "Security Deposit",
              amount: totalDeposit,
              paid: dep,
              due: Math.max(0, totalDeposit - dep),
              status: dep >= totalDeposit ? "Paid" : "Partial",
              paymentId: createdPayment.id,
            },
          });
        }
      }

      // Apply to Advance Rent ledger
      if (rent > 0 && monthlyRent > 0) {
        const monthLabel = rentForMonth && rentForYear
          ? `${new Date(rentForYear, rentForMonth - 1).toLocaleString("en-IN", { month: "long" })} ${rentForYear}`
          : "Advance Rent";

        const rentLedger = await tx.ledger.findFirst({
          where: {
            guestId,
            description: { startsWith: "Advance Rent" },
          },
          orderBy: { createdAt: "desc" },
        });

        if (rentLedger) {
          const newPaid = Number(rentLedger.paid) + rent;
          const newDue = Math.max(0, Number(rentLedger.amount) - newPaid);
          await tx.ledger.update({
            where: { id: rentLedger.id },
            data: {
              paid: newPaid,
              due: newDue,
              status: newDue <= 0 ? "Paid" : newPaid > 0 ? "Partial" : "Pending",
              paymentId: createdPayment.id,
            },
          });
        } else {
          await tx.ledger.create({
            data: {
              guestId,
              description: `Advance Rent (${monthLabel})`,
              amount: monthlyRent,
              paid: rent,
              due: Math.max(0, monthlyRent - rent),
              status: rent >= monthlyRent ? "Paid" : "Partial",
              paymentId: createdPayment.id,
            },
          });
        }
      }

      return createdPayment;
    });

    return NextResponse.json({ payment, success: true });
  } catch (e: any) {
    console.error("Create payment error:", e);
    if (e?.message === "Guest not found") {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to create payment", details: e?.message || String(e) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status, rejectionReason } = await request.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "ID and status required" },
        { status: 400 }
      );
    }

    const payment = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id },
        data: {
          status,
          rejectionReason: rejectionReason || null,
        },
      });

      // If approved, update linked ledger
      if (status === "Approved") {
        let ledger = await tx.ledger.findFirst({
          where: { paymentId: id },
        });

        // Fallback: find pending/partial ledger for the same guest
        if (!ledger) {
          const paymentRecord = await tx.payment.findUnique({
            where: { id },
            select: { guestId: true, type: true },
          });
          if (paymentRecord) {
            ledger = await tx.ledger.findFirst({
              where: {
                guestId: paymentRecord.guestId,
                status: { in: ["Pending", "Partial"] },
              },
              orderBy: { createdAt: "asc" },
            });
            // Link it for future approvals
            if (ledger) {
              await tx.ledger.update({
                where: { id: ledger.id },
                data: { paymentId: id },
              });
            }
          }
        }

        if (ledger) {
          const newPaid = Number(ledger.paid) + Number(updatedPayment.amount);
          const newDue = Math.max(0, Number(ledger.amount) - newPaid);
          const ledgerStatus = newPaid >= Number(ledger.amount) ? "Paid" : newPaid > 0 ? "Partial" : "Pending";

          await tx.ledger.update({
            where: { id: ledger.id },
            data: {
              paid: newPaid,
              due: newDue,
              status: ledgerStatus,
            },
          });
        }
      }

      return updatedPayment;
    });

    return NextResponse.json(payment);
  } catch {
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    );
  }
}
