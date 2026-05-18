import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unstable_noStore } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  unstable_noStore();
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: { in: ["payment_upi_id", "payment_qr_code"] },
      },
    });

    const result: Record<string, string> = {
      upiId: "",
      qrCode: "",
    };

    settings.forEach((s) => {
      if (s.key === "payment_upi_id") result.upiId = s.value || "";
      if (s.key === "payment_qr_code") result.qrCode = s.value || "";
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("GET /api/public/payment-settings error:", e);
    return NextResponse.json(
      { upiId: "", qrCode: "", error: "Failed to fetch payment settings" },
      { status: 500 }
    );
  }
}
