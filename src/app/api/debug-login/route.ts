import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      return NextResponse.json({ step: "findAdmin", found: false });
    }
    
    const valid = await bcrypt.compare(password, admin.passwordHash);
    
    return NextResponse.json({
      step: "compare",
      found: true,
      valid,
      adminId: admin.id,
      hashPrefix: admin.passwordHash.substring(0, 20),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown";
    const stack = error instanceof Error ? error.stack : "";
    return NextResponse.json({ error: message, stack }, { status: 500 });
  }
}
