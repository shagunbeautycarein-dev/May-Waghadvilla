import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

function generatePassword(length = 10): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(request: Request) {
  try {
    const {
      name,
      mobile,
      email,
      roomId,
      bedId,
      joiningDate,
      monthlyRent,
      deposit,
      rentCycleDate,
      generatePassword: shouldGeneratePassword,
    } = await request.json();

    if (!name || !mobile || !roomId || !bedId || !joiningDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if bed exists and is available/reserved
    const bed = await prisma.bed.findUnique({ where: { id: bedId } });
    if (!bed) {
      return NextResponse.json({ error: "Bed not found" }, { status: 404 });
    }
    if (bed.status !== "Available" && bed.status !== "Reserved") {
      return NextResponse.json(
        { error: `Bed is currently ${bed.status}` },
        { status: 400 }
      );
    }

    // Check if guest with same mobile already exists
    const existingGuest = await prisma.guest.findFirst({
      where: {
        mobile,
        status: { in: ['Active', 'Active (Pending Move-In)', 'Notice Period'] },
        deletedAt: null,
      },
    });

    // Check for duplicate email (if email is provided)
    if (email) {
      const existingEmailGuest = await prisma.guest.findFirst({
        where: {
          email,
          id: existingGuest ? { not: existingGuest.id } : undefined,
        },
      });
      if (existingEmailGuest) {
        return NextResponse.json(
          { error: "Email already registered by another guest" },
          { status: 409 }
        );
      }
    }

    let guest;
    let passwordPlain: string | undefined;
    let passwordHash: string | undefined;

    if (shouldGeneratePassword) {
      passwordPlain = generatePassword();
      passwordHash = await bcrypt.hash(passwordPlain, 10);
    }

    const joinDate = new Date(joiningDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Only set Occupied/Move-In Scheduled when admin is directly activating the guest.
    // For standard inquiry-to-onboarding flow, use "Reserved" until onboarding is approved.
    const bedStatus = shouldGeneratePassword
      ? (joinDate > today ? "Move-In Scheduled" : "Occupied")
      : "Reserved";

    if (existingGuest) {
      // Update existing guest instead of failing
      guest = await prisma.guest.update({
        where: { id: existingGuest.id },
        data: {
          name,
          email: email || existingGuest.email || null,
          roomId,
          bedId,
          joiningDate: joinDate,
          monthlyRent: monthlyRent ? Number(monthlyRent) : null,
          deposit: deposit ? Number(deposit) : null,
          rentCycleDate: rentCycleDate ? Number(rentCycleDate) : null,
          status: shouldGeneratePassword ? "Pending Onboarding" : "Onboarding Started",
          passwordHash: passwordHash || existingGuest.passwordHash || undefined,
        },
      });
    } else {
      // Create new guest
      guest = await prisma.guest.create({
        data: {
          name,
          mobile,
          email: email || null,
          roomId,
          bedId,
          joiningDate: joinDate,
          monthlyRent: monthlyRent ? Number(monthlyRent) : null,
          deposit: deposit ? Number(deposit) : null,
          rentCycleDate: rentCycleDate ? Number(rentCycleDate) : null,
          status: shouldGeneratePassword ? "Pending Onboarding" : "Onboarding Started",
          passwordHash: passwordHash || undefined,
        },
      });
    }

    // Create or update onboarding data record
    await prisma.onboardingData.upsert({
      where: { guestId: guest.id },
      update: {},
      create: {
        guestId: guest.id,
        status: "Draft",
      },
    });

    // Link bed to guest
    await prisma.bed.update({
      where: { id: bedId },
      data: {
        status: bedStatus,
        currentGuestId: guest.id,
      },
    });

    return NextResponse.json({
      guest,
      credentials: shouldGeneratePassword && passwordPlain
        ? { email: guest.email, password: passwordPlain }
        : undefined,
    });
  } catch (e: any) {
    console.error("Create guest error:", e);
    return NextResponse.json(
      { error: "Failed to create guest", details: e?.message || String(e) },
      { status: 500 }
    );
  }
}
