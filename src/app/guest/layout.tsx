"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getGuestSession } from "@/lib/supabase/auth";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Receipt,
  Zap,
  MessageSquare,
  Bell,
  User,
  LogOut,
  X,
  ArrowRightLeft,
  Users,
  Sparkles,
  Menu,
  ChevronRight,
} from "lucide-react";

const NAV = [
  { href: "/guest/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/guest/dashboard/rent", label: "Rent", icon: Receipt },
  { href: "/guest/dashboard/electricity", label: "Electricity", icon: Zap },
  { href: "/guest/dashboard/complaints", label: "Complaints", icon: MessageSquare },
  { href: "/guest/dashboard/notices", label: "Notices", icon: Bell },
  { href: "/guest/dashboard/transfer", label: "Transfer", icon: ArrowRightLeft },
  { href: "/guest/dashboard/leaving", label: "Leaving", icon: LogOut },
  { href: "/guest/dashboard/visitors", label: "Visitors", icon: Users },
  { href: "/guest/dashboard/profile", label: "Profile", icon: User },
];

// Show these 5 in the mobile bottom bar
const BOTTOM_NAV = [
  { href: "/guest/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/guest/dashboard/rent", label: "Rent", icon: Receipt },
  { href: "/guest/dashboard/complaints", label: "Issues", icon: MessageSquare },
  { href: "/guest/dashboard/notices", label: "Notices", icon: Bell },
  { href: "/guest/dashboard/profile", label: "Profile", icon: User },
];

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [guestName, setGuestName] = useState("Guest");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (pathname === "/guest/login") {
      setLoading(false);
      return;
    }

    async function checkAuth() {
      const { data } = await getGuestSession();
      if (data.session) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/guest/me");
        if (res.ok) {
          const guest = await res.json();
          setGuestName(guest.name || "Guest");
          setLoading(false);
          return;
        }
      } catch {
        // silent
      }

      router.replace("/guest/login");
    }

    checkAuth();
  }, [pathname, router]);

  useEffect(() => {
    if (pathname === "/guest/login") return;
    async function fetchUnread() {
      try {
        const res = await fetch("/api/guest/notices");
        if (res.ok) {
          const notices = await res.json();
          const count = notices.filter((n: { isRead: boolean }) => !n.isRead).length;
          setUnreadCount(count);
        }
      } catch {
        // silent
      }
    }
    fetchUnread();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const { data } = await getGuestSession();
      if (data.session) {
        const supabase = (await import("@/lib/supabase/auth")).signOutGuest;
        await supabase();
      }
    } catch {
      // silent
    }
    await fetch("/api/guest/logout", { method: "POST" });
    window.location.href = "/guest/login";
  };

  if (pathname === "/guest/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-900/20 animate-pulse">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-slate-400 font-medium">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const initials = guestName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setTimeout(() => setShowInstallBanner(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (installPrompt as any).prompt();
    setInstallPrompt(null);
    setShowInstallBanner(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:bottom-6 md:w-80">
          <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Install App</p>
              <p className="text-xs text-slate-400">Add Waghad Villa to your home screen</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={handleInstall} className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                Install
              </button>
              <button onClick={() => setShowInstallBanner(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Desktop Sidebar â”€â”€ */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-100 flex-col shrink-0 sticky top-0 h-screen">
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-100 shrink-0">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-400/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">The Waghad Villa</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Resident Portal</p>
          </div>
        </div>

        {/* Guest Info Card */}
        <div className="mx-3 mt-4 p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-emerald-300/30">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{guestName}</p>
              <p className="text-[10px] text-emerald-600 font-medium">Active Resident</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 mt-2">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const isNotices = item.href === "/guest/dashboard/notices";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-500 rounded-r-full" />
                )}
                <item.icon className={cn("w-4 h-4 shrink-0", active ? "text-emerald-600" : "")} />
                <span className="flex-1">{item.label}</span>
                {isNotices && unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-100 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* â”€â”€ Mobile Header â”€â”€ */}
      <header className="md:hidden h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <p className="text-sm font-bold text-slate-900">The Waghad Villa</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Link
              href="/guest/dashboard/notices"
              className="relative p-2 rounded-xl text-slate-400 hover:bg-slate-100"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Link>
          )}
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* â”€â”€ Mobile Drawer â”€â”€ */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative ml-auto w-72 max-w-[85vw] bg-white h-full flex flex-col shadow-2xl">
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-xs font-bold text-white">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 truncate max-w-[140px]">{guestName}</p>
                  <p className="text-[10px] text-emerald-600 font-medium">Active Resident</p>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
              {NAV.map((item) => {
                const active = pathname === item.href;
                const isNotices = item.href === "/guest/dashboard/notices";
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all",
                      active
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <item.icon className={cn("w-4.5 h-4.5 shrink-0", active ? "text-emerald-600" : "text-slate-400")} />
                    <span className="flex-1">{item.label}</span>
                    {isNotices && unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                    {active && <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />}
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-slate-100">
              <button
                onClick={() => { setDrawerOpen(false); handleLogout(); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
              >
                <LogOut className="w-4.5 h-4.5" />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* â”€â”€ Main Content â”€â”€ */}
      <main className="flex-1 overflow-auto pb-[calc(5rem+var(--spacing-safe))] md:pb-0 min-w-0">
        {children}
      </main>

      {/* â”€â”€ Mobile Bottom Navigation â”€â”€ */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-100 pb-safe">
        <div className="flex items-stretch h-16">
          {BOTTOM_NAV.map((item) => {
            const active = pathname === item.href;
            const isNotices = item.href === "/guest/dashboard/notices";
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
                  <item.icon className="w-4.5 h-4.5" />
                  {isNotices && unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white">
                      {unreadCount > 9 ? "9" : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
        {/* iOS safe area */}
        <div className="h-safe-area-inset-bottom bg-white" />
      </nav>
    </div>
  );
}
