"use client";

import { useEffect, useState } from "react";
import { getGuestSession } from "@/lib/supabase/auth";
import Link from "next/link";
import { Bed, Calendar, Shield, Zap, Clock, Receipt, ArrowDownLeft, ArrowUpRight, FileText, Bell, AlertTriangle, Bolt, ArrowRightLeft, LogOut, MessageSquare, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateReceiptPDF } from "@/lib/receipt-pdf";
import { OnboardingWizard } from "@/components/onboarding/wizard";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTableSkeleton } from "@/components/shared/data-table-skeleton";
import { formatCurrency, formatDate } from "@/lib/formatters";

interface Guest {
  id: string;
  name: string;
  status: string;
  deposit: number | string;
  monthlyRent?: number | string;
  room?: { name: string };
  bed?: { name: string };
  onboardingData?: { status: string };
  joiningDate?: string;
  rentCycleDate?: number;
}

interface LedgerEntry {
  id: string;
  description: string;
  due: number | string;
  paid: number | string;
  amount: number | string;
  status: string;
  createdAt: string;
}

interface PaymentEntry {
  id: string;
  amount: number | string;
  type: string;
  method: string;
  status: string;
  transactionId: string | null;
  depositAmount: number | string | null;
  rentAmount: number | string | null;
  rentForMonth: number | null;
  rentForYear: number | null;
  createdAt: string;
  updatedAt: string;
}

interface Notifications {
  unreadNotices: number;
  pendingComplaints: number;
  pendingElectricity: number;
}

interface TransferItem {
  id: string;
  status: string;
  oldBed?: { name: string; room?: { name: string } } | null;
  newBed?: { name: string; room?: { name: string } } | null;
  effectiveDate?: string;
}

interface LeavingItem {
  id: string;
  status: string;
  lastDate?: string;
  reason?: string;
}

export default function GuestDashboardPage() {
  const [guest, setGuest] = useState<Guest | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [notifications, setNotifications] = useState<Notifications | null>(null);
  const [transfer, setTransfer] = useState<TransferItem | null>(null);
  const [leaving, setLeaving] = useState<LeavingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingToken, setOnboardingToken] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data: sessionData } = await getGuestSession();
        const user = sessionData.session?.user;

        let guestData: Guest | undefined;
        let guestId: string | undefined;

        if (user) {
          const guestRes = await fetch(`/api/guest/profile?guestId=${user.id}`);
          if (guestRes.ok) {
            const data: Guest = await guestRes.json();
            guestData = data;
            guestId = data.id;
          }
        }

        if (!guestData) {
          const meRes = await fetch("/api/guest/me");
          if (meRes.ok) {
            const data: Guest = await meRes.json();
            guestData = data;
            guestId = data.id;
          }
        }

        if (!guestData) {
          setLoading(false);
          return;
        }

        setGuest(guestData);

        const needsOnboarding =
          guestData.onboardingData?.status === "Draft" ||
          guestData.status === "Pending Onboarding" ||
          guestData.status === "Onboarding Started";

        if (needsOnboarding && guestId) {
          const tokenRes = await fetch("/api/guest/onboarding-token");
          if (tokenRes.ok) {
            const tokenData = await tokenRes.json();
            if (tokenData.token) {
              setOnboardingToken(tokenData.token);
              setShowOnboarding(true);
              setLoading(false);
              return;
            }
          }
        }

        const [ledgerRes, paymentsRes, notifRes, transferRes, leavingRes] = await Promise.all([
          fetch(`/api/guest/ledger?guestId=${guestData.id}`),
          fetch(`/api/guest/payments?guestId=${guestData.id}`),
          fetch("/api/guest/notifications"),
          fetch("/api/guest/bed-transfers"),
          fetch("/api/guest/leaving"),
        ]);

        if (ledgerRes.ok) setLedger(await ledgerRes.json());
        if (paymentsRes.ok) setPayments(await paymentsRes.json());
        if (notifRes.ok) setNotifications(await notifRes.json());
        if (transferRes.ok) {
          const transfers: TransferItem[] = await transferRes.json();
          const pending = transfers.find((t) => t.status === "requested" || t.status === "approved");
          setTransfer(pending || null);
        }
        if (leavingRes.ok) {
          const requests: LeavingItem[] = await leavingRes.json();
          const pending = requests.find((r) => r.status === "submitted" || r.status === "approved");
          setLeaving(pending || null);
        }
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
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
        <div className="h-28 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 animate-pulse opacity-50" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2 animate-pulse">
              <div className="h-8 w-8 rounded-xl bg-slate-200" />
              <div className="h-3 w-16 bg-slate-200 rounded" />
              <div className="h-5 w-20 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
        <DataTableSkeleton columns={4} rows={4} />
      </div>
    );
  }

  if (showOnboarding && onboardingToken) {
    return (
      <div className="bg-slate-50">
        <OnboardingWizard token={onboardingToken} inline />
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <EmptyState
          icon={Bed}
          title="Guest profile not found"
          subtitle="We couldn't load your profile. Please try logging in again."
        />
      </div>
    );
  }

  const totalDue = ledger.reduce((sum, entry) => sum + Number(entry.due), 0);
  const totalPaid = ledger.reduce((sum, entry) => sum + Number(entry.paid), 0);
  const totalAmount = ledger.reduce((sum, entry) => sum + Number(entry.amount), 0);
  const nextDue = ledger.find((l) => l.status !== "Paid");

  // Build statement rows from payments + ledger
  const statementRows: Array<{
    id: string;
    date: string;
    description: string;
    type: "payment" | "charge";
    amount: number;
    status?: string;
    payment?: PaymentEntry;
  }> = [];

  // Add ledger entries as charges
  ledger.forEach((entry) => {
    statementRows.push({
      id: `ledger-${entry.id}`,
      date: entry.createdAt,
      description: entry.description,
      type: "charge",
      amount: Number(entry.amount),
    });
  });

  // Add payments as credits
  payments.forEach((p) => {
    const dep = Number(p.depositAmount || 0);
    const rent = Number(p.rentAmount || 0);
    if (dep > 0) {
      statementRows.push({
        id: `pay-dep-${p.id}`,
        date: p.createdAt,
        description: `Deposit Payment (${p.method})`,
        type: "payment",
        amount: dep,
        status: p.status,
        payment: p,
      });
    }
    if (rent > 0) {
      const monthLabel = p.rentForMonth && p.rentForYear
        ? `${new Date(p.rentForYear, p.rentForMonth - 1).toLocaleString("en-IN", { month: "long" })} ${p.rentForYear}`
        : "Rent Payment";
      statementRows.push({
        id: `pay-rent-${p.id}`,
        date: p.createdAt,
        description: `Rent Payment - ${monthLabel} (${p.method})`,
        type: "payment",
        amount: rent,
        status: p.status,
        payment: p,
      });
    }
    if (dep === 0 && rent === 0) {
      statementRows.push({
        id: `pay-${p.id}`,
        date: p.createdAt,
        description: `${p.type} Payment (${p.method})`,
        type: "payment",
        amount: Number(p.amount),
        status: p.status,
        payment: p,
      });
    }
  });

  // Sort by date descending
  statementRows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate running balance
  let runningBalance = 0;
  const rowsWithBalance = statementRows.map((row) => {
    if (row.type === "charge") {
      runningBalance += row.amount;
    } else {
      runningBalance -= row.amount;
    }
    return { ...row, balance: runningBalance };
  });

  const getOrdinalNum = (n: number) => n + (n > 0 ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10] : '');

  let nextRentDateStr = "Not Set";
  if (guest.rentCycleDate) {
    const now = new Date();
    let nextD = new Date(now.getFullYear(), now.getMonth(), guest.rentCycleDate);
    if (now.getDate() > guest.rentCycleDate) {
      nextD = new Date(now.getFullYear(), now.getMonth() + 1, guest.rentCycleDate);
    }
    nextRentDateStr = formatDate(nextD.toISOString());
  }

  const cards = [
    {
      label: "Room & Bed",
      value: guest.room?.name && guest.bed?.name ? `${guest.room.name} / ${guest.bed.name}` : "Not assigned",
      icon: Bed,
      iconBg: "bg-teal-50",
      iconColor: "text-teal-600",
    },
    {
      label: "Date of Joining",
      value: guest.joiningDate ? formatDate(guest.joiningDate) : "-",
      icon: Calendar,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      label: "Next Rent Date",
      value: nextRentDateStr,
      icon: Clock,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      subtext: guest.rentCycleDate ? `Cycle: ${getOrdinalNum(guest.rentCycleDate)} of month` : undefined,
    },
    {
      label: "Outstanding Due",
      value: nextDue ? formatCurrency(nextDue.due) : formatCurrency(0),
      icon: Receipt,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
      subtext: nextDue ? `Since: ${formatDate(nextDue.createdAt)}` : undefined,
    },
    {
      label: "Security Deposit",
      value: formatCurrency(guest.deposit),
      icon: Shield,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "Account Status",
      value: guest.onboardingData?.status === "Submitted"
        ? "Waiting — Contact Admin"
        : guest.status?.replace("Active (Pending Move-In)", "Move-In Scheduled") || "Active",
      icon: Zap,
      iconBg: guest.onboardingData?.status === "Submitted" ? "bg-amber-50" : "bg-emerald-50",
      iconColor: guest.onboardingData?.status === "Submitted" ? "text-amber-600" : "text-emerald-600",
    },
  ];

  const hasNotifications = notifications && (
    notifications.unreadNotices > 0 ||
    notifications.pendingComplaints > 0 ||
    notifications.pendingElectricity > 0
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* —— Hero Welcome Banner —— */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 px-5 py-6 md:px-8 md:py-8">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative">
          <p className="text-emerald-100 text-sm font-medium mb-1">Good day,</p>
          <h1 className="text-xl md:text-2xl font-bold text-white">{guest.name}</h1>
          <p className="text-emerald-200 text-xs md:text-sm mt-1">
            {guest.room?.name && guest.bed?.name
              ? `Room ${guest.room.name} · Bed ${guest.bed.name}`
              : "The Waghad Villa Resident"}
          </p>
          {totalDue > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20">
                <p className="text-[10px] text-emerald-200 uppercase tracking-wider">Outstanding Due</p>
                <p className="text-lg font-bold text-white">{formatCurrency(totalDue)}</p>
              </div>
              <Link
                href="/guest/dashboard/rent"
                className="flex items-center gap-2 bg-white text-emerald-700 font-bold text-sm px-4 py-3 rounded-xl shadow-lg shadow-emerald-900/20 hover:bg-emerald-50 transition-colors whitespace-nowrap"
              >
                Pay Now →
              </Link>
            </div>
          )}
          {totalDue === 0 && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/20">
              <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full" />
              All dues cleared · Great!
            </div>
          )}
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-5">
        {/* Notification Alert Cards */}
        {(hasNotifications || totalDue > 0 || transfer || leaving) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {totalDue > 0 && (
              <Link href="/guest/dashboard/rent" className="block">
                <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 hover:bg-red-100 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                    <Receipt className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-red-800">Rent Due</p>
                    <p className="text-xs text-red-600 truncate">{formatCurrency(totalDue)} outstanding</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-red-400 shrink-0" />
                </div>
              </Link>
            )}
            {notifications && notifications.unreadNotices > 0 && (
              <Link href="/guest/dashboard/notices" className="block">
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 hover:bg-blue-100 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Bell className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-blue-800">Unread Notices</p>
                    <p className="text-xs text-blue-600 truncate">{notifications.unreadNotices} new notice{notifications.unreadNotices > 1 ? "s" : ""}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-blue-400 shrink-0" />
                </div>
              </Link>
            )}
            {notifications && notifications.pendingComplaints > 0 && (
              <Link href="/guest/dashboard/complaints" className="block">
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 hover:bg-amber-100 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-800">Pending Complaints</p>
                    <p className="text-xs text-amber-600 truncate">{notifications.pendingComplaints} complaint{notifications.pendingComplaints > 1 ? "s" : ""} awaiting resolution</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-amber-400 shrink-0" />
                </div>
              </Link>
            )}
            {notifications && notifications.pendingElectricity > 0 && (
              <Link href="/guest/dashboard/electricity" className="block">
                <div className="flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 hover:bg-purple-100 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                    <Bolt className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-purple-800">Electricity Bills</p>
                    <p className="text-xs text-purple-600 truncate">{notifications.pendingElectricity} pending bill{notifications.pendingElectricity > 1 ? "s" : ""}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-purple-400 shrink-0" />
                </div>
              </Link>
            )}
            {transfer && (
              <Link href="/guest/dashboard/bed-transfer" className="block">
                <div className="flex items-center gap-3 bg-sky-50 border border-sky-100 rounded-xl px-4 py-3 hover:bg-sky-100 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                    <ArrowRightLeft className="h-4 w-4 text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-sky-800">Bed Transfer</p>
                    <p className="text-xs text-sky-600 truncate">
                      Status: {transfer.status === "requested" ? "Awaiting Approval" : transfer.status}
                      {transfer.newBed?.room?.name ? ` · ${transfer.newBed.room.name}` : ""}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-sky-400 shrink-0" />
                </div>
              </Link>
            )}
            {leaving && (
              <Link href="/guest/dashboard/leaving" className="block">
                <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 hover:bg-rose-100 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                    <LogOut className="h-4 w-4 text-rose-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-rose-800">Leaving Notice</p>
                    <p className="text-xs text-rose-600 truncate">
                      {leaving.status === "submitted" ? "Submitted — Awaiting Approval" : leaving.status}
                      {leaving.lastDate ? ` · Last date: ${formatDate(leaving.lastDate)}` : ""}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-rose-400 shrink-0" />
                </div>
              </Link>
            )}
          </div>
        )}

        {/* —— Stat Cards Grid —— */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {cards.map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3"
            >
              <div className={`h-9 w-9 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                <card.icon className={`h-4.5 w-4.5 ${card.iconColor}`} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{card.label}</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5 leading-tight">{card.value}</p>
                {card.subtext && (
                  <p className="text-[10px] text-slate-400 mt-0.5">{card.subtext}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* —— Financial Summary Row —— */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Charged</p>
            <p className="text-base font-bold text-slate-900 mt-1">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm p-4 text-center">
            <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Paid</p>
            <p className="text-base font-bold text-emerald-700 mt-1">{formatCurrency(totalPaid)}</p>
          </div>
          <div className={`rounded-2xl border shadow-sm p-4 text-center ${totalDue > 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"}`}>
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${totalDue > 0 ? "text-red-500" : "text-emerald-600"}`}>Due</p>
            <p className={`text-base font-bold mt-1 ${totalDue > 0 ? "text-red-700" : "text-emerald-700"}`}>{formatCurrency(totalDue)}</p>
          </div>
        </div>

        {/* —— Payment Statement —— */}
        <div>
          <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-emerald-500" />
            Payment Statement
          </h2>
          {rowsWithBalance.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No transactions yet"
              subtitle="Your payment history will appear here once you have transactions."
            />
          ) : (
            <div className="space-y-2">
              {rowsWithBalance.map((row) => (
                <div
                  key={row.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 flex items-center gap-3"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    row.type === "charge" ? "bg-red-50" : "bg-emerald-50"
                  }`}>
                    {row.type === "charge"
                      ? <ArrowUpRight className="h-4 w-4 text-red-500" />
                      : <ArrowDownLeft className="h-4 w-4 text-emerald-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{row.description}</p>
                    <p className="text-[11px] text-slate-400">{formatDate(row.date)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${
                      row.type === "charge" ? "text-red-600" : "text-emerald-600"
                    }`}>
                      {row.type === "charge" ? "-" : "+"}{formatCurrency(row.amount)}
                    </p>
                    <p className="text-[10px] text-slate-400">bal: {formatCurrency(row.balance)}</p>
                    {row.type === "payment" && row.status === "Approved" && row.payment && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const payment = row.payment;
                          if (!payment) return;
                          const doc = generateReceiptPDF(payment, guest);
                          doc.save(`receipt-${payment.id.slice(0, 8)}.pdf`);
                        }}
                        className="mt-1 h-7 px-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-full text-[11px]"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Receipt
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* —— Ledger Breakdown —— */}
        <div>
          <h2 className="text-sm font-bold text-slate-800 mb-3">Ledger Breakdown</h2>
          {ledger.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No ledger entries yet"
              subtitle="Your ledger will appear here once you have entries."
            />
          ) : (
            <div className="space-y-2">
              {ledger.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800 truncate flex-1">{entry.description}</p>
                    <span
                      className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        entry.status === "Paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : entry.status === "Partial"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {entry.status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs">
                    <div>
                      <p className="text-slate-400">Charged</p>
                      <p className="font-semibold text-slate-700">{formatCurrency(entry.amount)}</p>
                    </div>
                    <div>
                      <p className="text-emerald-600">Paid</p>
                      <p className="font-semibold text-emerald-700">{formatCurrency(entry.paid)}</p>
                    </div>
                    {Number(entry.due) > 0 && (
                      <div>
                        <p className="text-red-500">Due</p>
                        <p className="font-bold text-red-700">{formatCurrency(entry.due)}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
