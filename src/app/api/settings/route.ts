import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  try {
    const { key, value } = await request.json();

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: "Key and value are required" },
        { status: 400 }
      );
    }

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value: String(value) },
      create: {
        key,
        value: String(value),
        category: "general",
      },
    });

    return NextResponse.json({ key: setting.key, value: setting.value });
  } catch {
    return NextResponse.json(
      { error: "Failed to update setting" },
      { status: 500 }
    );
  }
}
