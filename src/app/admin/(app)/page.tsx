import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/db-safe";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  BedDouble,
  ClipboardList,
  CalendarCheck,
  Users,
  ArrowRightLeft,
  AlertTriangle,
  LogOut,
  UserCheck,
  Bell,
  IndianRupee,
  Clock,
} from "lucide-react";
import { StatCards } from "@/components/admin/stat-cards";
import { InquiryTable } from "@/components/admin/inquiry-table";
import { DashboardCharts } from "@/components/admin/dashboard-charts";
import Link from "next/link";

function getMonthLabels(count: number): string[] {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const result: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(`${months[d.getMonth()]} ${d.getFullYear()}`);
  }
  return result;
}

function monthYearKey(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

export default async function AdminDashboard() {
  const totalRooms = await safeQuery(
    async () => prisma.room.count({ where: { deletedAt: null } }),
    0
  );

  const occupiedBeds = await safeQuery(
    async () =>
      prisma.bed.count({
        where: { status: { in: ["Occupied", "Notice Period"] }, deletedAt: null },
      }),
    0
  );

  const noticePeriodBeds = await safeQuery(
    async () =>
      prisma.bed.count({
        where: { status: "Notice Period", deletedAt: null },
      }),
    0
  );

  const pendingInquiries = await safeQuery(
    async () =>
      prisma.inquiry.count({
        where: { status: { in: ["New Inquiry", "Follow Up"] } },
      }),
    0
  );

  const totalBeds = await safeQuery(
    async () => prisma.bed.count({ where: { deletedAt: null } }),
    0
  );

  const rawInquiries = await safeQuery(
    async () =>
      prisma.inquiry.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
    []
  );

  const recentInquiries = rawInquiries.map((i) => ({
    ...i,
    monthlyRent: i.monthlyRent ? Number(i.monthlyRent) : null,
    deposit: i.deposit ? Number(i.deposit) : null,
  })) as unknown as import("@prisma/client").Inquiry[];

  // Notification counts
  const pendingApprovals = await safeQuery(
    async () => prisma.onboardingData.count({ where: { status: "Submitted" } }),
    0
  );
  const pendingTransfers = await safeQuery(
    async () => prisma.bedTransfer.count({ where: { status: "requested" } }),
    0
  );
  const pendingComplaints = await safeQuery(
    async () => prisma.complaint.count({ where: { status: "Pending" } }),
    0
  );
  const pendingLeaving = await safeQuery(
    async () => prisma.leavingRequest.count({ where: { status: "submitted" } }),
    0
  );
  const todayVisitors = await safeQuery(
    async () =>
      prisma.visitorLog.count({
        where: {
          visitDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
          status: { in: ["expected", "checked-in"] },
        },
      }),
    0
  );
  const pendingPayments = await safeQuery(
    async () => prisma.payment.count({ where: { status: "Uploaded" } }),
    0
  );

  // Overdue rent: ledger entries with status Pending created more than 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const overdueRent = await safeQuery(
    async () =>
      prisma.ledger.count({
        where: {
          status: "Pending",
          createdAt: { lt: thirtyDaysAgo },
        },
      }),
    0
  );

  const alerts = [
    {
      label: "Pending Approvals",
      count: pendingApprovals,
      href: "/admin/approval",
      icon: Users,
      color: "bg-blue-50 text-blue-700 border-blue-100",
      iconColor: "text-blue-600",
    },
    {
      label: "Pending Payments",
      count: pendingPayments,
      href: "/admin/payments",
      icon: IndianRupee,
      color: "bg-emerald-50 text-emerald-700 border-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      label: "Pending Transfers",
      count: pendingTransfers,
      href: "/admin/bed-transfers",
      icon: ArrowRightLeft,
      color: "bg-amber-50 text-amber-700 border-amber-100",
      iconColor: "text-amber-600",
    },
    {
      label: "Pending Complaints",
      count: pendingComplaints,
      href: "/admin/complaints",
      icon: AlertTriangle,
      color: "bg-red-50 text-red-700 border-red-100",
      iconColor: "text-red-600",
    },
    {
      label: "Leaving Requests",
      count: pendingLeaving,
      href: "/admin/leaving",
      icon: LogOut,
      color: "bg-purple-50 text-purple-700 border-purple-100",
      iconColor: "text-purple-600",
    },
    {
      label: "Visitors Today",
      count: todayVisitors,
      href: "/admin/visitors",
      icon: UserCheck,
      color: "bg-sky-50 text-sky-700 border-sky-100",
      iconColor: "text-sky-600",
    },
    {
      label: "Overdue Rent",
      count: overdueRent,
      href: "/admin/accounting",
      icon: Clock,
      color: "bg-rose-50 text-rose-700 border-rose-100",
      iconColor: "text-rose-600",
    },
  ];

  const hasAlerts = alerts.some((a) => a.count > 0);

  // ===== Chart Data =====

  // 1. Occupancy
  const occupancy = [
    { name: "Occupied", value: occupiedBeds - noticePeriodBeds, color: "#C85A17" },
    { name: "Notice Period", value: noticePeriodBeds, color: "#f59e0b" },
    { name: "Vacant", value: totalBeds - occupiedBeds, color: "#E4E6E8" },
  ];

  // 2. Monthly revenue trend (last 6 months)
  const monthLabels = getMonthLabels(6);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [paymentsLast6M, expensesLast6M] = await Promise.all([
    safeQuery(
      async () =>
        prisma.payment.findMany({
          where: {
            status: "Approved",
            createdAt: { gte: sixMonthsAgo },
          },
          select: {
            amount: true,
            rentAmount: true,
            depositAmount: true,
            type: true,
            createdAt: true,
          },
        }),
      []
    ),
    safeQuery(
      async () =>
        prisma.expense.findMany({
          where: {
            deletedAt: null,
            date: { gte: sixMonthsAgo },
          },
          select: {
            amount: true,
            date: true,
          },
        }),
      []
    ),
  ]);

  // Build revenue trend (stacked by rent, deposit, electricity)
  const revenueMap = new Map<string, { rent: number; deposit: number; electricity: number }>();
  monthLabels.forEach((m) => revenueMap.set(m, { rent: 0, deposit: 0, electricity: 0 }));

  paymentsLast6M.forEach((p) => {
    const key = monthYearKey(p.createdAt);
    if (!revenueMap.has(key)) return;
    const current = revenueMap.get(key)!;
    const rent = Number(p.rentAmount || 0);
    const deposit = Number(p.depositAmount || 0);
    const total = Number(p.amount);
    // Electricity is whatever is not rent or deposit
    const electricity = total - rent - deposit;
    current.rent += rent;
    current.deposit += deposit;
    if (electricity > 0) current.electricity += electricity;
    revenueMap.set(key, current);
  });

  const revenueTrend = monthLabels.map((m) => ({
    month: m.split(" ")[0], // just the month name
    rent: revenueMap.get(m)?.rent || 0,
    deposit: revenueMap.get(m)?.deposit || 0,
    electricity: revenueMap.get(m)?.electricity || 0,
  }));

  // Build income vs expense comparison
  const incomeExpenseMap = new Map<string, { income: number; expense: number }>();
  monthLabels.forEach((m) => incomeExpenseMap.set(m, { income: 0, expense: 0 }));

  paymentsLast6M.forEach((p) => {
    const key = monthYearKey(p.createdAt);
    if (!incomeExpenseMap.has(key)) return;
    const current = incomeExpenseMap.get(key)!;
    current.income += Number(p.amount);
    incomeExpenseMap.set(key, current);
  });

  expensesLast6M.forEach((e) => {
    const key = monthYearKey(e.date);
    if (!incomeExpenseMap.has(key)) return;
    const current = incomeExpenseMap.get(key)!;
    current.expense += Number(e.amount);
    incomeExpenseMap.set(key, current);
  });

  const monthlyComparison = monthLabels.map((m) => ({
    month: m.split(" ")[0],
    income: incomeExpenseMap.get(m)?.income || 0,
    expense: incomeExpenseMap.get(m)?.expense || 0,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of your property</p>
      </div>

      {/* Alert Cards */}
      {hasAlerts && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {alerts
            .filter((a) => a.count > 0)
            .map((alert) => (
              <Link key={alert.label} href={alert.href}>
                <Card className={`rounded-xl border shadow-sm hover:shadow-md transition-shadow ${alert.color}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-white/60 ${alert.iconColor}`}>
                        <alert.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-lg font-bold leading-none">{alert.count}</p>
                        <p className="text-[11px] font-medium mt-0.5 opacity-90">{alert.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCards
          title="Total Rooms"
          value={totalRooms}
          icon={Building2}
        />
        <StatCards
          title="Occupied Beds"
          value={occupiedBeds}
          total={totalBeds}
          icon={BedDouble}
        />
        <StatCards
          title="Pending Inquiries"
          value={pendingInquiries}
          icon={ClipboardList}
        />
        <StatCards
          title="Available Beds"
          value={totalBeds - occupiedBeds}
          icon={CalendarCheck}
        />
      </div>

      {/* Charts */}
      <DashboardCharts
        occupancy={occupancy}
        monthlyComparison={monthlyComparison}
        revenueTrend={revenueTrend}
      />

      <Card className="rounded-xl shadow-sm border-slate-100">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-slate-900">Recent Inquiries</CardTitle>
        </CardHeader>
        <CardContent>
          <InquiryTable inquiries={recentInquiries} compact />
        </CardContent>
      </Card>
    </div>
  );
}

export const dynamic = "force-dynamic";
