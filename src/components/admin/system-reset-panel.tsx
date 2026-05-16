"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  AlertTriangle,
  Loader2,
  Trash2,
  Check,
  Users,
  MessageSquare,
  Home,
  BedDouble,
  Key,
  ClipboardList,
  CreditCard,
  Receipt,
  AlertCircle,
  Bell,
  Zap,
  FileText,
  Tag,
  UserCheck,
  ArrowRightLeft,
  Wallet,
  LogOut,
  X,
} from "lucide-react";

const RESET_OPTIONS = [
  { key: "guests", label: "All Guests", icon: Users, description: "Soft-delete all guests and free beds" },
  { key: "inquiries", label: "All Inquiries", icon: MessageSquare, description: "Delete all inquiry records" },
  { key: "rooms_and_beds", label: "Rooms & Beds", icon: Home, description: "Soft-delete all rooms and beds" },
  { key: "onboarding_tokens", label: "Onboarding Tokens", icon: Key, description: "Delete all onboarding tokens" },
  { key: "onboarding_data", label: "Onboarding Data", icon: ClipboardList, description: "Delete all onboarding submissions" },
  { key: "payments", label: "All Payments", icon: CreditCard, description: "Delete all payment records" },
  { key: "ledger", label: "All Ledger", icon: Receipt, description: "Delete all ledger entries" },
  { key: "complaints", label: "All Complaints", icon: AlertCircle, description: "Delete all complaints" },
  { key: "notices", label: "All Notices", icon: Bell, description: "Delete all notices and reads" },
  { key: "electricity", label: "Electricity Bills", icon: Zap, description: "Delete all bills and splits" },
  { key: "expenses", label: "All Expenses", icon: FileText, description: "Soft-delete all expenses" },
  { key: "expense_categories", label: "Expense Categories", icon: Tag, description: "Soft-delete all custom categories" },
  { key: "visitors", label: "Visitor Logs", icon: UserCheck, description: "Delete all visitor logs" },
  { key: "bed_transfers", label: "Bed Transfers", icon: ArrowRightLeft, description: "Delete all transfer records" },
  { key: "deposit_refunds", label: "Deposit Refunds", icon: Wallet, description: "Delete all refund records" },
  { key: "leaving_requests", label: "Leaving Requests", icon: LogOut, description: "Delete all leaving requests" },
];

export function SystemResetPanel({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [fullConfirm, setFullConfirm] = useState("");
  const [resetting, setResetting] = useState(false);
  const [showFullConfirm, setShowFullConfirm] = useState(false);
  const [showSelectiveConfirm, setShowSelectiveConfirm] = useState(false);

  const toggle = (key: string) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAll = () => {
    const all: Record<string, boolean> = {};
    RESET_OPTIONS.forEach((o) => (all[o.key] = true));
    setSelected(all);
  };

  const clearAll = () => setSelected({});

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const handleSelectiveReset = async () => {
    const targets = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (targets.length === 0) {
      toast.error("Select at least one item");
      return;
    }
    setResetting(true);
    try {
      const res = await fetch("/api/admin/system-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "selective", targets }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      toast.success("Selective reset completed");
      setShowSelectiveConfirm(false);
      setSelected({});
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setResetting(false);
    }
  };

  const handleFullReset = async () => {
    if (fullConfirm !== "RESET EVERYTHING") {
      toast.error('Type "RESET EVERYTHING" to confirm');
      return;
    }
    setResetting(true);
    try {
      const res = await fetch("/api/admin/system-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "full", confirmText: fullConfirm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      toast.success("Full system reset completed");
      setShowFullConfirm(false);
      setFullConfirm("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setResetting(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <Card className="rounded-xl shadow-sm border-slate-100 bg-white">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">Super Admin Only</h3>
          <p className="text-sm text-slate-500 mt-1">
            Only Super Admin can access system reset features.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Danger Banner */}
      <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-red-800">Danger Zone</h3>
          <p className="text-xs text-red-700 mt-0.5">
            These actions permanently delete data. Admin accounts and system settings are preserved.
            This cannot be undone.
          </p>
        </div>
      </div>

      {/* Selective Reset */}
      <Card className="rounded-xl shadow-sm border-slate-100 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-slate-500" />
            Selective Reset
          </CardTitle>
          <p className="text-xs text-slate-500">
            Choose specific data categories to clear. Check what you want to delete and confirm.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={selectAll} className="rounded-full text-xs h-8 border-slate-200">
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll} className="rounded-full text-xs h-8 border-slate-200">
              Clear All
            </Button>
            <span className="text-xs text-slate-500 ml-auto">
              {selectedCount} selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {RESET_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isChecked = !!selected[opt.key];
              return (
                <label
                  key={opt.key}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? "border-red-300 bg-red-50/50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(opt.key)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${isChecked ? "text-red-600" : "text-slate-400"}`} />
                      <span className={`text-sm font-medium ${isChecked ? "text-red-800" : "text-slate-700"}`}>
                        {opt.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{opt.description}</p>
                  </div>
                </label>
              );
            })}
          </div>

          {!showSelectiveConfirm ? (
            <Button
              onClick={() => setShowSelectiveConfirm(true)}
              disabled={selectedCount === 0}
              className="w-full rounded-full bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Reset Selected ({selectedCount})
            </Button>
          ) : (
            <div className="space-y-3 rounded-xl bg-red-50 border border-red-200 p-4">
              <p className="text-sm font-medium text-red-800">
                Are you sure? This will delete {selectedCount} category/categories of data.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSelectiveConfirm(false)}
                  className="rounded-full flex-1 border-slate-200"
                >
                  <X className="mr-1.5 h-4 w-4" /> Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSelectiveReset}
                  disabled={resetting}
                  className="rounded-full bg-red-600 hover:bg-red-700 text-white flex-1"
                >
                  {resetting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
                  Yes, Delete
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Reset */}
      <Card className="rounded-xl shadow-sm border-red-200 bg-red-50/30">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-red-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Full System Reset
          </CardTitle>
          <p className="text-xs text-red-700">
            Wipes ALL data except admin accounts and settings. This is irreversible.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showFullConfirm ? (
            <Button
              onClick={() => setShowFullConfirm(true)}
              variant="outline"
              className="w-full rounded-full border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800"
            >
              <AlertTriangle className="mr-1.5 h-4 w-4" />
              Initiate Full Reset
            </Button>
          ) : (
            <div className="space-y-3 rounded-xl bg-white border border-red-200 p-4">
              <p className="text-sm font-medium text-red-800">
                Type <span className="font-mono bg-red-100 px-1.5 py-0.5 rounded">RESET EVERYTHING</span> to confirm:
              </p>
              <Input
                value={fullConfirm}
                onChange={(e) => setFullConfirm(e.target.value)}
                placeholder="RESET EVERYTHING"
                className="rounded-xl border-red-200 font-mono"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowFullConfirm(false); setFullConfirm(""); }}
                  className="rounded-full flex-1 border-slate-200"
                >
                  <X className="mr-1.5 h-4 w-4" /> Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleFullReset}
                  disabled={resetting || fullConfirm !== "RESET EVERYTHING"}
                  className="rounded-full bg-red-600 hover:bg-red-700 text-white flex-1"
                >
                  {resetting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
                  Erase Everything
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
