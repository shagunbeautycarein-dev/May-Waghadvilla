"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Receipt,
  User,
  LogOut,
  MessageSquare,
  Bell,
  Users,
  Zap,
  ArrowRightLeft,
  LogOut as LeavingIcon,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const NAV = [
  { href: "/guest/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/guest/dashboard/rent", label: "Rent & Payments", icon: Receipt },
  { href: "/guest/dashboard/complaints", label: "Complaints", icon: MessageSquare },
  { href: "/guest/dashboard/notices", label: "Notices", icon: Bell },
  { href: "/guest/dashboard/visitors", label: "Visitors", icon: Users },
  { href: "/guest/dashboard/electricity", label: "Electricity", icon: Zap },
  { href: "/guest/dashboard/transfer", label: "Transfer", icon: ArrowRightLeft },
  { href: "/guest/dashboard/leaving", label: "Leaving", icon: LeavingIcon },
  { href: "/guest/dashboard/profile", label: "Profile", icon: User },
];

export function GuestSidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/guest/logout", { method: "POST" });
    window.location.href = "/guest/login";
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col">
      <div className="p-6 border-b border-slate-100">
        <h1 className="text-xl font-semibold text-slate-900">The Waghad Villa</h1>
        <p className="text-xs text-slate-400 mt-1">Guest Portal</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    isActive
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-100">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all w-full"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Logout</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
