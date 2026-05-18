"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  CalendarDays,
  FileText,
  Loader2,
  Pencil,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

type StatementItem = {
  id: string;
  date: string;
  description: string;
  type: "incoming" | "outgoing";
  category: string;
  amount: number;
  source: "Bank" | "Cash";
  recordType: "payment" | "expense" | "electricity";
  parentId?: string | null;
  balance: number;
};

type StatementSummary = {
  totalIncoming: number;
  totalOutgoing: number;
  openingBalance: number;
  closingBalance: number;
};

type StatementData = {
  items: StatementItem[];
  summary: StatementSummary;
};

function formatDateLabel(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function SourceBadge({ source }: { source: "Bank" | "Cash" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
        source === "Cash"
          ? "bg-amber-50 text-amber-700 border border-amber-200"
          : "bg-blue-50 text-blue-700 border border-blue-200"
      }`}
    >
      {source}
    </span>
  );
}

export default function StatementPage() {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [fromDate, setFromDate] = useState(
    firstDayOfMonth.toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState(today.toISOString().split("T")[0]);
  const [data, setData] = useState<StatementData | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchStatement = useCallback(async () => {
    if (!fromDate || !toDate) {
      toast.error("Please select both from and to dates");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/accounting/statement?from=${fromDate}&to=${toDate}`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      setData(await res.json());
    } catch {
      toast.error("Failed to load statement");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchStatement();
  }, [fetchStatement]);

  const handleSourceChange = async (
    item: StatementItem,
    newSource: "Bank" | "Cash"
  ) => {
    if (newSource === item.source) return;

    // Electricity without linked payment cannot be edited
    if (item.recordType === "electricity" && !item.parentId) {
      toast.error("Cannot edit source for electricity without a linked payment");
      return;
    }

    setUpdatingId(item.id);
    try {
      const res = await fetch("/api/admin/accounting/statement", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.recordType === "payment" ? item.parentId || item.id : item.id,
          source: newSource,
          recordType: item.recordType,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Source updated");
      fetchStatement();
    } catch {
      toast.error("Failed to update source");
    } finally {
      setUpdatingId(null);
    }
  };

  const stats = data
    ? [
        {
          label: "Total Incoming",
          value: data.summary.totalIncoming,
          icon: ArrowDownLeft,
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-600",
        },
        {
          label: "Total Outgoing",
          value: data.summary.totalOutgoing,
          icon: ArrowUpRight,
          iconBg: "bg-red-50",
          iconColor: "text-red-600",
        },
        {
          label: "Closing Balance",
          value: data.summary.closingBalance,
          icon: Wallet,
          iconBg:
            data.summary.closingBalance >= 0 ? "bg-blue-50" : "bg-amber-50",
          iconColor:
            data.summary.closingBalance >= 0
              ? "text-blue-600"
              : "text-amber-600",
        },
      ]
    : [];

  const canEditSource = (item: StatementItem) => {
    if (item.recordType === "electricity" && !item.parentId) return false;
    return true;
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Statement</h1>
          <p className="text-sm text-slate-500 mt-1">
            View all incoming and outgoing transactions with running balance
          </p>
        </div>
      </div>

      {/* Date Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 bg-white rounded-xl border border-slate-100 p-4 w-fit">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-slate-600">From</Label>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-40 rounded-xl border-slate-200 text-sm"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-slate-600">To</Label>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-40 rounded-xl border-slate-200 text-sm"
            />
          </div>
        </div>
        <Button
          onClick={fetchStatement}
          disabled={loading}
          className="rounded-full bg-teal-600 hover:bg-teal-700 text-white h-10 px-5"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
          Generate Statement
        </Button>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-slate-100 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className={`h-10 w-10 rounded-xl ${stat.iconBg} flex items-center justify-center shrink-0`}
                  >
                    <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      {stat.label}
                    </p>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">
                      {formatCurrency(Math.round(stat.value))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Statement Table */}
      <Card className="border-slate-100 shadow-sm overflow-hidden">
        <CardHeader className="pb-2 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-400" />
            Transaction Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={FileText}
                title="No transactions found"
                subtitle="Try selecting a different date range."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <th className="text-left px-4 py-3 font-medium">Date</th>
                    <th className="text-left px-4 py-3 font-medium">Description</th>
                    <th className="text-left px-4 py-3 font-medium">Category</th>
                    <th className="text-left px-4 py-3 font-medium">Type</th>
                    <th className="text-left px-4 py-3 font-medium">Source</th>
                    <th className="text-right px-4 py-3 font-medium">Amount</th>
                    <th className="text-right px-4 py-3 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-600">
                        {formatDateLabel(item.date)}
                      </td>
                      <td className="px-4 py-3 text-slate-900 font-medium max-w-xs truncate">
                        {item.description}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            item.type === "incoming"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {item.type === "incoming" ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          {item.type === "incoming" ? "Incoming" : "Outgoing"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {updatingId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                        ) : canEditSource(item) ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={item.source}
                              onChange={(e) =>
                                handleSourceChange(
                                  item,
                                  e.target.value as "Bank" | "Cash"
                                )
                              }
                              className="text-xs rounded-lg border border-slate-200 px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
                            >
                              <option value="Bank">Bank</option>
                              <option value="Cash">Cash</option>
                            </select>
                            <Pencil className="w-3 h-3 text-slate-300" />
                          </div>
                        ) : (
                          <SourceBadge source={item.source} />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(item.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-100">
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase"
                    >
                      Closing Balance
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatCurrency(data.summary.totalIncoming)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatCurrency(data.summary.closingBalance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
