"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LogOut,
  Menu,
  X,
  Sparkles,
  LayoutDashboard,
  Home,
  ClipboardList,
  ShieldCheck,
  CreditCard,
  Zap,
  MessageSquare,
  Bell,
  Palette,
  BarChart3,
  FileText,
  ArrowRightLeft,
  Users,
  Wallet,
  Settings,
  Tag,
  ListPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const allNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/rooms", label: "Rooms", icon: Home },
  { href: "/admin/inquiries", label: "Inquiries", icon: ClipboardList },
  { href: "/admin/approval", label: "Approval Center", icon: ShieldCheck },
  { href: "/admin/guests", label: "Guests", icon: Users },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/electricity", label: "Electricity", icon: Zap },
  { href: "/admin/complaints", label: "Complaints", icon: MessageSquare },
  { href: "/admin/notices", label: "Notices", icon: Bell },
  { href: "/admin/accounting", label: "P&L Overview", icon: BarChart3 },
  { href: "/admin/accounting/statement", label: "Statement", icon: FileText },
  { href: "/admin/accounting/expenses", label: "Expenses", icon: FileText },
  { href: "/admin/accounting/daily-entry", label: "Daily Entry", icon: ListPlus },
  { href: "/admin/accounting/categories", label: "Categories", icon: Tag },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/bed-transfers", label: "Transfers", icon: ArrowRightLeft },
  { href: "/admin/leaving", label: "Leaving", icon: LogOut },
  { href: "/admin/visitors", label: "Visitors", icon: Users },
  { href: "/admin/deposit-refunds", label: "Refunds", icon: Wallet },
  { href: "/admin/cms", label: "CMS", icon: Palette },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const mobileBottomNav = [
  { href: "/admin", label: "Home", icon: LayoutDashboard },
  { href: "/admin/guests", label: "Guests", icon: Users },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/complaints", label: "Issues", icon: MessageSquare },
  { href: "/admin/accounting", label: "Finance", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

// Derive page title from pathname
function getPageTitle(pathname: string) {
  const found = allNavItems.find((n) => n.href === pathname);
  if (found) return found.label;
  if (pathname.startsWith("/admin/accounting")) return "Accounting";
  return "Admin Panel";
}

export function AdminHeader({ admin }: { admin: { name: string; email: string } }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  return (
    <>
      {/* Desktop + Mobile Header */}
      <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-30">
        {/* Left: Page Title (Margin left on mobile to avoid fixed hamburger from sidebar) */}
        <div className="flex items-center gap-3">
          <div className="ml-12 md:ml-0">
            <p className="text-sm font-semibold text-slate-900 md:text-base">
              {getPageTitle(pathname)}
            </p>
            <p className="text-xs text-slate-400 hidden md:block">
              Welcome back, {admin.name}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-xs font-bold text-white">
            {admin.name[0].toUpperCase()}
          </div>
        </div>
      </header>

      {/* Drawer removed: Now handled centrally by admin-sidebar.tsx */}

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-100 safe-area-pb">
        <div className="flex items-stretch h-16">
          {mobileBottomNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 pt-1 transition-all",
                  active ? "text-emerald-600" : "text-slate-400"
                )}
              >
                <div className={cn(
                  "relative flex items-center justify-center w-10 h-6 rounded-full transition-all",
                  active ? "bg-emerald-100" : ""
                )}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
