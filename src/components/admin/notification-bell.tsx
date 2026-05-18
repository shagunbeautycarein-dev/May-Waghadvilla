"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, ClipboardList, CreditCard, MessageSquare, ArrowRightLeft, LogOut, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  type: string;
  label: string;
  count: number;
  href: string;
};

type NotificationData = {
  total: number;
  items: NotificationItem[];
};

const ICON_MAP: Record<string, React.ElementType> = {
  inquiry: ClipboardList,
  payment: CreditCard,
  complaint: MessageSquare,
  transfer: ArrowRightLeft,
  leaving: LogOut,
};

const COLOR_MAP: Record<string, string> = {
  inquiry: "bg-blue-50 text-blue-600",
  payment: "bg-amber-50 text-amber-600",
  complaint: "bg-red-50 text-red-600",
  transfer: "bg-purple-50 text-purple-600",
  leaving: "bg-slate-50 text-slate-600",
};

export function NotificationBell() {
  const [data, setData] = useState<NotificationData>({ total: 0, items: [] });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) setData(await res.json());
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeItems = data.items.filter((i) => i.count > 0);
  const visibleTotal = dismissed ? 0 : data.total;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative flex items-center justify-center w-9 h-9 rounded-xl transition-all",
          open
            ? "bg-slate-100 text-slate-900"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
        )}
        aria-label="Notifications"
      >
        <Bell className="w-[18px] h-[18px]" />
        {visibleTotal > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {visibleTotal > 99 ? "99+" : visibleTotal}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-slate-100 shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            <div className="flex items-center gap-1">
              {visibleTotal > 0 && (
                <button
                  onClick={() => setDismissed(true)}
                  className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-md hover:bg-slate-50 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-center text-sm text-slate-400">Loading...</div>
            ) : activeItems.length === 0 || dismissed ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No pending notifications</p>
                <p className="text-xs text-slate-400 mt-1">You&apos;re all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {activeItems.map((item) => {
                  const Icon = ICON_MAP[item.type] || Bell;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                          COLOR_MAP[item.type] || "bg-slate-50 text-slate-500"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">
                          {item.label}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.count} pending{item.count > 1 ? " items" : " item"}
                        </p>
                      </div>
                      <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                        {item.count}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
