"use client";

import { useEffect, useState } from "react";
import { getGuestSession } from "@/lib/supabase/auth";
import Link from "next/link";
import { Bed, Calendar, Shield, Zap, Clock, Receipt, ArrowDownLeft, ArrowUpRight, FileText, Bell, AlertTriangle, Bolt } from "lucide-react";
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

export default function GuestDashboardPage() {
  const [guest, setGuest] = useState<Guest | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [notifications, setNotifications] = useState<Notifications | null>(null);
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

        const [ledgerRes, paymentsRes, notifRes] = await Promise.all([
          fetch(`/api/guest/ledger?guestId=${guestData.id}`),
          fetch(`/api/guest/payments?guestId=${guestData.id}`),
          fetch("/api/guest/notifications"),
        ]);

        if (ledgerRes.ok) setLedger(await ledgerRes.json());
        if (paymentsRes.ok) setPayments(await paymentsRes.json());
        if (notifRes.ok) setNotifications(await notifRes.json());
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

  const cards = [
    {
      label: "Room & Bed",
      value: guest.room?.name && guest.bed?.name ? `${guest.room.name} / ${guest.bed.name}` : "Not assigned",
      icon: Bed,
      iconBg: "bg-teal-50",
      iconColor: "text-teal-600",
    },
    {
      label: "Next Rent Due",
      value: nextDue ? formatCurrency(nextDue.due) : formatCurrency(0),
      icon: Calendar,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      subtext: nextDue ? `Due: ${formatDate(nextDue.createdAt)}` : undefined,
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
        {/* Notification Pills */}
        {hasNotifications && (
          <div className="flex flex-wrap gap-2">
            {notifications!.unreadNotices > 0 && (
              <Link href="/guest/dashboard/notices">
                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-blue-100 transition-colors">
                  <Bell className="h-3 w-3" />
                  {notifications!.unreadNotices} Unread Notice{notifications!.unreadNotices > 1 ? "s" : ""}
                </span>
              </Link>
            )}
            {notifications!.pendingComplaints > 0 && (
              <Link href="/guest/dashboard/complaints">
                <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-amber-100 transition-colors">
                  <AlertTriangle className="h-3 w-3" />
                  {notifications!.pendingComplaints} Pending Complaint{notifications!.pendingComplaints > 1 ? "s" : ""}
                </span>
              </Link>
            )}
            {notifications!.pendingElectricity > 0 && (
              <Link href="/guest/dashboard/electricity">
                <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-purple-100 transition-colors">
                  <Bolt className="h-3 w-3" />
                  {notifications!.pendingElectricity} Pending Bill{notifications!.pendingElectricity > 1 ? "s" : ""}
                </span>
              </Link>
            )}
          </div>
        )}

        {/* —— Stat Cards Grid —— */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
