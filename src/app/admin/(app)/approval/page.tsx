"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ApprovalCard } from "@/components/admin/approval-card";
import { toast } from "sonner";
import { Search, FileCheck, CheckCircle, XCircle, Clock, PauseCircle, FileText } from "lucide-react";

const TABS = [
  { key: "Submitted", label: "Submitted", icon: FileCheck },
  { key: "Pending Approval", label: "Pending", icon: Clock },
  { key: "Approved", label: "Approved", icon: CheckCircle },
  { key: "Rejected", label: "Rejected", icon: XCircle },
  { key: "On Hold", label: "On Hold", icon: PauseCircle },
  { key: "Draft", label: "Drafts", icon: FileText },
];

type OnboardingItem = {
  id: string;
  status: string;
  step1Personal: Record<string, string> | null;
  step2Emergency: { contacts?: Array<Record<string, string>> } | null;
  step3Job: Record<string, string> | null;
  step4Documents: Record<string, string> | null;
  step5RulesAgreed: boolean;
  step6TermsAgreed: boolean;
  step7LeavingAgreed: boolean;
  step8Payment: Record<string, unknown> | null;
  rejectionReason: string | null;
  holdReason: string | null;
  guest: {
    id: string;
    name: string;
    mobile: string;
    email: string | null;
    room: { name: string } | null;
    bed: { name: string } | null;
    joiningDate: string | null;
    monthlyRent: unknown;
    deposit: unknown;
    rentCycleDate: number | null;
  };
};

export default function ApprovalCenterPage() {
  const [items, setItems] = useState<OnboardingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Submitted");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/onboarding-data");
      if (!res.ok) throw new Error("Failed to fetch");
      const data: OnboardingItem[] = await res.json();
      setItems(data);
    } catch {
      toast.error("Failed to load approval data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    TABS.forEach((t) => {
      c[t.key] = items.filter((i) => i.status === t.key).length;
    });
    c["All"] = items.length;
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    let result = items.filter((i) => i.status === activeTab);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.guest.name.toLowerCase().includes(q) ||
          i.guest.mobile.includes(q) ||
          (i.guest.email && i.guest.email.toLowerCase().includes(q))
      );
    }
    return result;
  }, [items, activeTab, searchQuery]);

  const StatCard = ({
    label,
    value,
    active,
    onClick,
    icon: Icon,
  }: {
    label: string;
    value: number;
    active: boolean;
    onClick: () => void;
    icon: React.ElementType;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left w-full ${
        active
          ? "bg-teal-50 border-teal-200 shadow-sm"
          : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm"
      }`}
    >
      <div
        className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
          active ? "bg-teal-100 text-teal-600" : "bg-slate-100 text-slate-500"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-lg font-semibold leading-none">{value}</p>
        <p
          className={`text-xs mt-0.5 ${
            active ? "text-teal-700" : "text-slate-500"
          }`}
        >
          {label}
        </p>
      </div>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
          Approval Center
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review, approve, and manage guest onboarding submissions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {TABS.map((tab) => (
          <StatCard
            key={tab.key}
            label={tab.label}
            value={counts[tab.key] || 0}
            active={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            icon={tab.icon}
          />
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by name, mobile, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 rounded-xl border-slate-200 h-11"
        />
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-16">
            <div className="h-8 w-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 text-sm mt-3">Loading submissions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
            <FileCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              {searchQuery.trim()
                ? "No matching submissions found"
                : `No ${activeTab.toLowerCase()} submissions`}
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <ApprovalCard
              key={item.id}
              data={item}
              type={activeTab === "Submitted" ? "submitted" : "view"}
              onAction={fetchData}
            />
          ))
        )}
      </div>
    </div>
  );
}
