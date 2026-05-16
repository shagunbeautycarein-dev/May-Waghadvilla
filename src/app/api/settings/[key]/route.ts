import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const setting = await prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      return NextResponse.json(
        { error: "Setting not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ key: setting.key, value: setting.value });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch setting" },
      { status: 500 }
    );
  }
}
