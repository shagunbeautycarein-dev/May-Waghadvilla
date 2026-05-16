import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_session")?.value;

    if (!guestId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { splitId, amountPaid, method, transactionId, proofImages } =
      await request.json();

    if (!splitId || !amountPaid || !method) {
      return NextResponse.json(
        { error: "Split ID, amount paid, and method are required" },
        { status: 400 }
      );
    }

    // Verify the split belongs to this guest
    const split = await prisma.electricitySplit.findFirst({
      where: { id: splitId, guestId },
      include: { bill: true },
    });

    if (!split) {
      return NextResponse.json(
        { error: "Electricity split not found" },
        { status: 404 }
      );
    }

    if (split.status === "Paid") {
      return NextResponse.json(
        { error: "This bill has already been paid" },
        { status: 400 }
      );
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        guestId,
        amount: Number(amountPaid),
        type: "Electricity",
        method,
        transactionId: transactionId || null,
        proofImages: proofImages || [],
        status: "Uploaded",
      },
    });

    // Update split with payment reference
    await prisma.electricitySplit.update({
      where: { id: splitId },
      data: {
        paymentId: payment.id,
        status: "Paid",
      },
    });

    return NextResponse.json({
      success: true,
      payment,
      message: "Payment proof uploaded successfully. Awaiting admin approval.",
    });
  } catch (e: any) {
    console.error("POST /api/guest/electricity/pay error:", e);
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}
