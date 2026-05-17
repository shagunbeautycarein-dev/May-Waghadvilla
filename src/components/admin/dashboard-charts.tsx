"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";

const BRAND_ORANGE = "#C85A17";
const BRAND_SLATE = "#6F797E";
const RED = "#ef4444";
const BLUE = "#3b82f6";
const GREEN = "#22c55e";
const AMBER = "#f59e0b";

interface OccupancyData {
  name: string;
  value: number;
  color: string;
}

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface RevenueData {
  month: string;
  rent: number;
  deposit: number;
  electricity: number;
}

export function DashboardCharts({
  occupancy,
  monthlyComparison,
  revenueTrend,
}: {
  occupancy: OccupancyData[];
  monthlyComparison: MonthlyData[];
  revenueTrend: RevenueData[];
}) {
  const totalBeds = occupancy.reduce((s, d) => s + d.value, 0);
  const occupied = occupancy.find((d) => d.name === "Occupied")?.value || 0;
  const occupancyRate = totalBeds > 0 ? ((occupied / totalBeds) * 100).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Occupancy Donut */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Occupancy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={occupancy}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {occupancy.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={((value: number) => [`${value} beds`, ""]) as any}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-900">{occupancyRate}%</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Occupied</span>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {occupancy.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-slate-600">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Trend - Stacked Bar */}
      <Card className="border-slate-100 shadow-sm lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Revenue Trend (Last 6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {revenueTrend.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-slate-400">
              No revenue data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueTrend} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E6E8" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={((value: number) => formatCurrency(value)) as any}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="rent" stackId="a" fill={BRAND_ORANGE} radius={[0, 0, 0, 0]} name="Rent" />
                <Bar dataKey="deposit" stackId="a" fill={BLUE} radius={[0, 0, 0, 0]} name="Deposit" />
                <Bar dataKey="electricity" stackId="a" fill={AMBER} radius={[4, 4, 0, 0]} name="Electricity" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Income vs Expense - Area Chart */}
      <Card className="border-slate-100 shadow-sm lg:col-span-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Income vs Expense (Last 6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyComparison.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-slate-400">
              No data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyComparison} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND_ORANGE} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={BRAND_ORANGE} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={RED} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={RED} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E6E8" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={((value: number) => formatCurrency(value)) as any}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke={BRAND_ORANGE}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                  name="Income"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke={RED}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                  name="Expense"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
