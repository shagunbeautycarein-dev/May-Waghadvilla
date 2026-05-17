"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Home,
  Calendar,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";

type AccountingData = {
  income: {
    total: number;
    rent: number;
    deposit: number;
    electricity: number;
    breakdown: { date: string; amount: number; type: string }[];
  };
  expense: {
    total: number;
    breakdown: { date: string; amount: number; category: string }[];
  };
  profit: number;
  depositsHeld: number;
  occupancyRate: number;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function AccountingPage() {
  const [data, setData] = useState<AccountingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/accounting?month=${month}&year=${year}`
      );
      if (res.ok) setData(await res.json());
    } catch {
      toast.error("Failed to load accounting data");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setThisMonth = () => {
    const now = new Date();
    setMonth(now.getMonth() + 1);
    setYear(now.getFullYear());
  };

  const setLastMonth = () => {
    const now = new Date();
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    setMonth(lm.getMonth() + 1);
    setYear(lm.getFullYear());
  };

  const setThisYear = () => {
    setMonth(0); // 0 means all months in the API
    setYear(new Date().getFullYear());
  };

  // Prepare chart data
  const incomeByDay = data?.income.breakdown.reduce((acc, item) => {
    const day = item.date.slice(8);
    const existing = acc.find((a) => a.day === day);
    if (existing) {
      existing[item.type as keyof typeof existing] =
        (existing[item.type as keyof typeof existing] as number || 0) + item.amount;
    } else {
      acc.push({ day, [item.type]: item.amount });
    }
    return acc;
  }, [] as Record<string, number | string>[]);

  const expenseByDay = data?.expense.breakdown.reduce((acc, item) => {
    const day = item.date.slice(8);
    const existing = acc.find((a) => a.day === day);
    if (existing) {
      existing.amount = (existing.amount as number) + item.amount;
    } else {
      acc.push({ day, amount: item.amount });
    }
    return acc;
  }, [] as Record<string, number | string>[]);

  // Merge for combined chart
  const allDays = new Set([
    ...(incomeByDay?.map((d) => d.day) || []),
    ...(expenseByDay?.map((d) => d.day) || []),
  ]);
  const combinedChart = Array.from(allDays)
    .sort()
    .map((day) => ({
      day,
      income: incomeByDay?.find((d) => d.day === day)
        ? Object.entries(incomeByDay.find((d) => d.day === day) || {})
            .filter(([k]) => k !== "day")
            .reduce((s, [, v]) => s + (v as number), 0)
        : 0,
      expense: expenseByDay?.find((d) => d.day === day)?.amount || 0,
    }));

  // Cash flow: running balance
  let runningBalance = 0;
  const cashFlow = combinedChart.map((d) => {
    runningBalance += (d.income as number) - (d.expense as number);
    return {
      day: d.day,
      moneyIn: d.income,
      moneyOut: d.expense,
      balance: runningBalance,
    };
  });

  const stats = [
    {
      label: "Total Income",
      value: data?.income.total || 0,
      icon: TrendingUp,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      prefix: "₹",
    },
    {
      label: "Total Expense",
      value: data?.expense.total || 0,
      icon: TrendingDown,
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
      prefix: "₹",
    },
    {
      label: "Net Profit",
      value: data?.profit || 0,
      icon: IndianRupee,
      iconBg: data && data.profit >= 0 ? "bg-blue-50" : "bg-amber-50",
      iconColor: data && data.profit >= 0 ? "text-blue-600" : "text-amber-600",
      prefix: "₹",
    },
    {
      label: "Deposits Held",
      value: data?.depositsHeld || 0,
      icon: Home,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      prefix: "₹",
    },
    {
      label: "Occupancy Rate",
      value: data?.occupancyRate || 0,
      icon: Home,
      iconBg: "bg-slate-50",
      iconColor: "text-slate-600",
      suffix: "%",
      isPercent: true,
    },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Accounting & P&L</h1>
          <p className="text-sm text-slate-500 mt-1">
            Income, expenses, and profit overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={setThisMonth} className="rounded-xl">
            This Month
          </Button>
          <Button variant="outline" size="sm" onClick={setLastMonth} className="rounded-xl">
            Last Month
          </Button>
          <Button variant="outline" size="sm" onClick={setThisYear} className="rounded-xl">
            This Year
          </Button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 p-3 w-fit">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            if (month === 1) {
              setMonth(12);
              setYear(year - 1);
            } else {
              setMonth(month - 1);
            }
          }}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">
            {MONTHS[month - 1]} {year}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            if (month === 12) {
              setMonth(1);
              setYear(year + 1);
            } else {
              setMonth(month + 1);
            }
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                    {stat.prefix}
                    {stat.isPercent
                      ? stat.value.toFixed(1)
                      : formatCurrency(Math.round(stat.value)).replace("₹", "")}
                    {stat.suffix}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expense Bar Chart */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900">
              Income vs Expense
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
            ) : combinedChart.length === 0 ? (
              <div className="h-64">
                <EmptyState icon={BarChart3} title="No data for this period" subtitle="Income and expense data will appear here once transactions are recorded." />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={combinedChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E6E8" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `₹${v / 1000}k`}
                  />
                  <Tooltip
                    formatter={(value: unknown) => formatCurrency(value as number | string | undefined)}
                  />
                  <Legend />
                  <Bar dataKey="income" fill="#C85A17" radius={[4, 4, 0, 0]} name="Income" />
                  <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Cash Flow Line Chart */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900">
              Cash Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
            ) : cashFlow.length === 0 ? (
              <div className="h-64">
                <EmptyState icon={BarChart3} title="No data for this period" subtitle="Cash flow data will appear here once transactions are recorded." />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={cashFlow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E6E8" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `₹${v / 1000}k`}
                  />
                  <Tooltip
                    formatter={(value: unknown) => formatCurrency(value as number | string | undefined)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="moneyIn"
                    stroke="#C85A17"
                    strokeWidth={2}
                    dot={false}
                    name="Money In"
                  />
                  <Line
                    type="monotone"
                    dataKey="moneyOut"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                    name="Money Out"
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="Balance"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Income Breakdown */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Income Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Rent", value: data?.income.rent || 0, color: "bg-emerald-500" },
              { label: "Deposit", value: data?.income.deposit || 0, color: "bg-blue-500" },
              { label: "Electricity", value: data?.income.electricity || 0, color: "bg-amber-500" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${item.color}`} />
                  <span className="text-sm font-medium text-slate-700">
                    {item.label}
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-900">
                  {formatCurrency(Math.round(item.value))}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
            Note: Deposits are liabilities, not income. They are shown here for visibility but excluded from Total Income and Net Profit.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
