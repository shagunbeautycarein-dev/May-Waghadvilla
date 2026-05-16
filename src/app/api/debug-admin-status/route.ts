import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const allAdmins = await prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        passwordHash: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      adminCount: allAdmins.length,
      admins: allAdmins.map((a) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        role: a.role,
        isActive: a.isActive,
        passwordHashPrefix: a.passwordHash?.substring(0, 30) + "...",
        createdAt: a.createdAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "DB Error", detail: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required for test" },
        { status: 400 }
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        passwordHash: true,
      },
    });

    if (!admin) {
      return NextResponse.json({
        found: false,
        message: `No admin found with email: ${email}`,
        allEmails: (await prisma.admin.findMany({ select: { email: true } })).map(
          (a) => a.email
        ),
      });
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);

    return NextResponse.json({
      found: true,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      isActive: admin.isActive,
      passwordMatch: valid,
      hashPrefix: admin.passwordHash.substring(0, 30),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Test failed", detail: error?.message || String(error) },
      { status: 500 }
    );
  }
}
