"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Home,
  ClipboardList,
  Settings,
  ShieldCheck,
  CreditCard,
  Zap,
  MessageSquare,
  Bell,
  Palette,
  BarChart3,
  FileText,
  ArrowRightLeft,
  LogOut,
  Users,
  Wallet,
  Tag,
  ListPlus,
  ChevronDown,
  Sparkles,
  AlertTriangle,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/rooms", label: "Rooms", icon: Home },
  { href: "/admin/inquiries", label: "Inquiries", icon: ClipboardList },
  { href: "/admin/approval", label: "Approval Center", icon: ShieldCheck },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ClipboardList },
  { href: "/admin/guests", label: "Guests", icon: Users },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/electricity", label: "Electricity", icon: Zap },
  { href: "/admin/complaints", label: "Complaints", icon: MessageSquare },
  { href: "/admin/notices", label: "Notices", icon: Bell },
  {
    href: "/admin/accounting",
    label: "Accounting",
    icon: BarChart3,
    children: [
      { href: "/admin/accounting", label: "P&L Overview", icon: BarChart3 },
      { href: "/admin/accounting/expenses", label: "Expenses", icon: FileText },
      { href: "/admin/accounting/daily-entry", label: "Daily Entry", icon: ListPlus },
      { href: "/admin/accounting/categories", label: "Categories", icon: Tag },
    ],
  },
  {
    href: "/admin/reports",
    label: "Reports",
    icon: FileText,
    children: [
      { href: "/admin/reports", label: "Reports & Export", icon: FileText },
      { href: "/admin/reports/defaulters", label: "Defaulters", icon: AlertTriangle },
    ],
  },
  { href: "/admin/bed-transfers", label: "Transfers", icon: ArrowRightLeft },
  { href: "/admin/leaving", label: "Leaving", icon: LogOut },
  { href: "/admin/visitors", label: "Visitors", icon: Users },
  { href: "/admin/deposit-refunds", label: "Refunds", icon: Wallet },
  { href: "/admin/cms", label: "CMS", icon: Palette },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function isActiveOrChild(pathname: string, href: string, children?: Array<{ href: string }>) {
  if (pathname === href) return true;
  if (children) return children.some((c) => pathname === c.href);
  return false;
}

export function AdminSidebar({ admin }: { admin: { name: string; role: string } }) {
  const pathname = usePathname();
  const accountingActive = isActiveOrChild(
    pathname,
    "/admin/accounting",
    navItems.find((i) => i.href === "/admin/accounting")?.children
  );
  const reportsActive = isActiveOrChild(
    pathname,
    "/admin/reports",
    navItems.find((i) => i.href === "/admin/reports")?.children
  );
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "/admin/accounting": accountingActive,
    "/admin/reports": reportsActive,
  });

  const toggleSection = (href: string) => {
    setOpenSections((prev) => ({ ...prev, [href]: !prev[href] }));
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3.5 left-4 z-50 p-2 text-slate-600 bg-white rounded-xl shadow-sm border border-slate-200 transition-colors hover:bg-slate-50"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside 
        className={cn(
          "w-72 max-w-[85vw] md:w-64 bg-slate-900 flex-col shrink-0 fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none",
          mobileOpen ? "translate-x-0 flex" : "-translate-x-full md:translate-x-0 hidden md:flex"
        )}
      >
      {/* Brand */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-900/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">The Waghad Villa</p>
            <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">Admin Panel</p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActiveOrChild(pathname, item.href, item.children);

          if (item.children) {
            const isOpen = openSections[item.href] ?? false;
            return (
              <div key={item.href}>
                <button
                  onClick={() => toggleSection(item.href)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                    active
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  {active ? (
                    <div className="w-0.5 h-5 bg-emerald-400 rounded-full -ml-0.5 absolute left-3" />
                  ) : null}
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 transition-transform text-slate-500",
                      isOpen ? "rotate-180" : ""
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="ml-4 mt-0.5 border-l border-white/10 pl-3 space-y-0.5">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const childActive = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                            childActive
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
                          )}
                        >
                          <ChildIcon className="w-3.5 h-3.5" />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-400 rounded-r-full" />
              )}
              <Icon className="w-4.5 h-4.5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Admin Profile + Logout */}
      <div className="p-3 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/5 transition-all group cursor-default">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {admin.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{admin.name}</p>
            <p className="text-xs text-slate-500">{admin.role}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}

// Mobile Bottom Nav for Admin
export const ADMIN_MOBILE_NAV = [
  { href: "/admin", label: "Home", icon: LayoutDashboard },
  { href: "/admin/guests", label: "Guests", icon: Users },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/complaints", label: "Complaints", icon: MessageSquare },
  { href: "/admin/notices", label: "Notices", icon: Bell },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];
