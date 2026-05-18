import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unstable_noStore } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  unstable_noStore();
  try {
    const { searchParams } = new URL(request.url);
    const keysParam = searchParams.get("keys");

    if (!keysParam) {
      return NextResponse.json(
        { error: "keys query parameter is required" },
        { status: 400 }
      );
    }

    const keys = keysParam.split(",").map((k) => k.trim()).filter(Boolean);

    const settings = await prisma.setting.findMany({
      where: { key: { in: keys } },
    });

    const result: Record<string, string> = {};
    settings.forEach((s) => {
      result[s.key] = s.value || "";
    });

    // Fill missing keys with empty string so client knows they were queried
    keys.forEach((k) => {
      if (!(k in result)) result[k] = "";
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("GET /api/settings/batch error:", e);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}
