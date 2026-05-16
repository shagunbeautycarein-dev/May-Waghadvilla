import { NextResponse } from "next/server";
import { verifyAdmin, checkDbConnectionError } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const admin = await verifyAdmin(email, password);

    if (!admin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!admin.isActive) {
      return NextResponse.json({ error: "Account inactive" }, { status: 403 });
    }

    const cookieStore = await cookies();
    cookieStore.set("admin_session", admin.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (error: any) {
    if (checkDbConnectionError(error)) {
      return NextResponse.json(
        { error: "Database is currently unreachable. Please try again later." },
        { status: 503 }
      );
    }
    console.error("LOGIN ERROR:", error?.message || error);
    return NextResponse.json({ error: "Login failed", detail: error?.message || String(error) }, { status: 500 });
  }
}
