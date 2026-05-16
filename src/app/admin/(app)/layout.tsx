import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/db-safe";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
export const dynamic = "force-dynamic";
import { Toaster } from "@/components/ui/sonner";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const adminId = cookieStore.get("admin_session")?.value;

  if (!adminId) {
    redirect("/admin/login");
  }

  const admin = await safeQuery(
    async () =>
      prisma.admin.findUnique({
        where: { id: adminId },
        select: { id: true, name: true, email: true, role: true },
      }),
    null
  );

  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <AdminSidebar admin={admin} />
        <div className="md:pl-64 flex flex-col min-h-screen">
          <AdminHeader admin={admin} />
          <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-auto">{children}</main>
          <Toaster />
        </div>
      </div>
    </>
  );
}
