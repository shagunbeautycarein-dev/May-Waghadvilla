"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Bell,
  Loader2,
  ChevronDown,
  ChevronUp,
  Globe,
  Building,
  Home,
  Users,
  Clock,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTableSkeleton } from "@/components/shared/data-table-skeleton";
import { formatDate } from "@/lib/formatters";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Notice = {
  id: string;
  title: string;
  message: string;
  type: string;
  sendDate: string;
  createdAt: string;
  isRead: boolean;
};

const typeIcon = (t: string) => {
  switch (t) {
    case "General": return Globe;
    case "Floor-wise": return Building;
    case "Room-wise": return Home;
    case "Guest-wise": return Users;
    default: return Bell;
  }
};

export default function GuestNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/guest/notices");
      if (res.ok) setNotices(await res.json());
    } catch {
      toast.error("Failed to load notices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRead = async (noticeId: string) => {
    try {
      await fetch("/api/guest/notices/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noticeId }),
      });
      setNotices((prev) =>
        prev.map((n) => (n.id === noticeId ? { ...n, isRead: true } : n))
      );
    } catch {
      // silent
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      const notice = notices.find((n) => n.id === id);
      if (notice && !notice.isRead) {
        handleRead(id);
      }
    }
  };

  const unreadCount = notices.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-56 bg-slate-200 rounded animate-pulse" />
        </div>
        <DataTableSkeleton columns={1} rows={4} showHeader={false} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
          Notices {unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700">
              {unreadCount} new
            </span>
          )}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Announcements from management</p>
      </div>

      {notices.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notices yet"
          subtitle="Management announcements will appear here."
        />
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => {
            const Icon = typeIcon(notice.type);
            const isExpanded = expandedId === notice.id;
            return (
              <div
                key={notice.id}
                onClick={() => toggleExpand(notice.id)}
                className={`bg-white rounded-xl border overflow-hidden cursor-pointer transition-all ${
                  !notice.isRead
                    ? "border-l-4 border-l-teal-500 border-slate-100 shadow-sm"
                    : "border-slate-100"
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                        !notice.isRead ? "bg-teal-50" : "bg-slate-50"
                      }`}>
                        <Icon className={`h-4 w-4 ${
                          !notice.isRead ? "text-teal-600" : "text-slate-400"
                        }`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium truncate ${
                            !notice.isRead ? "text-slate-900" : "text-slate-600"
                          }`}>
                            {notice.title}
                          </p>
                          {!notice.isRead && (
                            <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-teal-100 text-teal-700 shrink-0">
                              New
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <Clock className="h-3 w-3" />
                            {formatDate(notice.createdAt)}
                          </span>
                          <span className="text-[10px] text-slate-400">{notice.type}</span>
                        </div>
                      </div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{isExpanded ? "Collapse" : "Expand"}</TooltipContent>
                    </Tooltip>
                  </div>
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-50">
                      <p className="text-sm text-slate-700 leading-relaxed">{notice.message}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
