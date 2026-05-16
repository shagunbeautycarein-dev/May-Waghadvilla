import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { guestId, amount, type, method, transactionId, proofImages } = await request.json();

    if (!guestId || !amount || !type || !method) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.create({
      data: {
        guestId,
        amount: Number(amount),
        type,
        method,
        transactionId: transactionId || null,
        proofImages: proofImages || [],
        status: "Uploaded",
      },
    });

    // Link payment to the oldest pending/partial ledger for this guest
    // that matches the payment type (Deposit → Security Deposit, Rent → any Rent)
    try {
      const typeKeyword =
        type === "Deposit"
          ? "Deposit"
          : type === "Rent"
          ? "Rent"
          : type === "Electricity"
          ? "Electricity"
          : null;

      if (typeKeyword) {
        const matchingLedger = await prisma.ledger.findFirst({
          where: {
            guestId,
            status: { in: ["Pending", "Partial"] },
            description: { contains: typeKeyword, mode: "insensitive" },
          },
          orderBy: { createdAt: "asc" },
        });

        if (matchingLedger) {
          await prisma.ledger.update({
            where: { id: matchingLedger.id },
            data: { paymentId: payment.id },
          });
        }
      }
    } catch {
      // Non-fatal: approval will use fallback lookup
    }

    return NextResponse.json(payment, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get("guestId");

    if (!guestId) {
      return NextResponse.json(
        { error: "Guest ID required" },
        { status: 400 }
      );
    }

    const payments = await prisma.payment.findMany({
      where: { guestId },
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
