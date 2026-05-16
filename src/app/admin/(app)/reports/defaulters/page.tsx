"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTableSkeleton } from "@/components/shared/data-table-skeleton";
import { formatCurrency } from "@/lib/formatters";
import { AlertTriangle, Clock, Calendar, CalendarX, AlertCircle, Skull } from "lucide-react";

interface Defaulter {
  id: string;
  name: string;
  mobile: string;
  email: string;
  room: string;
  bed: string;
  daysOverdue: number;
  totalDue: number;
  ledgerCount: number;
}

interface Bucket {
  count: number;
  total: number;
  items: Defaulter[];
}

const BUCKETS = [
  { key: "0-30", label: "0–30 Days", icon: Clock, color: "amber", border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
  { key: "30-60", label: "30–60 Days", icon: Calendar, color: "orange", border: "border-orange-200", bg: "bg-orange-50", text: "text-orange-700", badge: "bg-orange-100 text-orange-700" },
  { key: "60-90", label: "60–90 Days", icon: CalendarX, color: "red", border: "border-red-200", bg: "bg-red-50", text: "text-red-700", badge: "bg-red-100 text-red-700" },
  { key: "90+", label: "90+ Days", icon: Skull, color: "rose", border: "border-rose-200", bg: "bg-rose-50", text: "text-rose-700", badge: "bg-rose-100 text-rose-700" },
];

export default function DefaultersPage() {
  const [data, setData] = useState<{ defaulters: Defaulter[]; buckets: Record<string, Bucket> } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/reports/defaulters");
        if (!res.ok) throw new Error("Failed to fetch");
        setData(await res.json());
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Defaulter Report</h1>
          <p className="text-sm text-slate-500 mt-1">Guests with pending or partial payments</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
        <DataTableSkeleton columns={6} rows={6} />
      </div>
    );
  }

  if (!data || data.defaulters.length === 0) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Defaulter Report</h1>
          <p className="text-sm text-slate-500 mt-1">Guests with pending or partial payments</p>
        </div>
        <EmptyState
          icon={AlertTriangle}
          title="No defaulters"
          subtitle="All guests are up to date with their payments."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Defaulter Report</h1>
        <p className="text-sm text-slate-500 mt-1">Guests with pending or partial payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {BUCKETS.map((b) => {
          const bucket = data.buckets[b.key];
          const Icon = b.icon;
          return (
            <div
              key={b.key}
              className={`rounded-xl border ${b.border} ${b.bg} p-4 flex flex-col gap-2`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${b.text}`} />
                <span className={`text-xs font-semibold ${b.text}`}>{b.label}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-xl font-bold ${b.text}`}>{bucket.count}</span>
                <span className={`text-xs ${b.text} opacity-80`}>guests</span>
              </div>
              <p className={`text-xs font-medium ${b.text}`}>Due: {formatCurrency(bucket.total)}</p>
            </div>
          );
        })}
      </div>

      {/* Detail List */}
      <div className="space-y-4">
        {BUCKETS.map((b) => {
          const bucket = data.buckets[b.key];
          if (bucket.items.length === 0) return null;
          return (
            <div key={b.key} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                <b.icon className={`h-4 w-4 ${b.text}`} />
                <h2 className="text-sm font-semibold text-slate-800">{b.label}</h2>
                <Badge className={`rounded-full text-[10px] ${b.badge} border-0`}>
                  {bucket.count}
                </Badge>
              </div>
              <div className="divide-y divide-slate-50">
                {bucket.items.map((d) => (
                  <div
                    key={d.id}
                    className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{d.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {d.room} / {d.bed} · {d.mobile}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-slate-500">
                        {d.daysOverdue}d overdue
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${b.badge}`}>
                        {formatCurrency(d.totalDue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
