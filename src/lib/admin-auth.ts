import { cookies } from "next/headers";
import { prisma } from "./prisma";

export async function getCurrentAdmin() {
  try {
    const cookieStore = await cookies();
    const adminId = cookieStore.get("admin_session")?.value;
    if (!adminId) return null;
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, name: true, email: true, role: true },
    });
    return admin;
  } catch {
    return null;
  }
}
