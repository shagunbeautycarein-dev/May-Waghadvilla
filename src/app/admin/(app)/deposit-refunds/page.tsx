"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Wallet,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { CloudinaryUpload } from "@/components/shared/cloudinary-upload";

type Refund = {
  id: string;
  guest: { name: string; room?: { name: string }; deposit?: number };
  amount: number;
  method: string;
  status: string;
  deductionReason: string | null;
  createdAt: string;
};

export default function DepositRefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [guestId, setGuestId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("UPI");
  const [proofImage, setProofImage] = useState("");
  const [deductionReason, setDeductionReason] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/deposit-refunds");
      if (res.ok) setRefunds(await res.json());
    } catch {
      toast.error("Failed to load refunds");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);



  const handleSave = async () => {
    if (!guestId || !amount || !method) {
      toast.error("Guest, amount, and method are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/deposit-refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId,
          amount: Number(amount),
          method,
          proofImage: proofImage || null,
          deductionReason: deductionReason || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      toast.success("Refund processed");
      setShowForm(false);
      setGuestId("");
      setAmount("");
      setProofImage("");
      setDeductionReason("");
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Failed to process refund");
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Pending: "bg-amber-100 text-amber-700",
      Completed: "bg-emerald-100 text-emerald-700",
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${styles[status] || "bg-slate-100 text-slate-600"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deposit Refunds</h1>
          <p className="text-sm text-slate-500 mt-1">
            Process security deposit refunds for departing guests
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="rounded-full bg-teal-600 hover:bg-teal-700 text-white w-fit"
        >
          {showForm ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
          {showForm ? "Cancel" : "Process Refund"}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-xl space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">New Refund</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Guest ID *</Label>
              <Input
                value={guestId}
                onChange={(e) => setGuestId(e.target.value)}
                placeholder="Guest UUID"
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Refund Amount (â‚¹) *</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Method *</Label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Refund Proof</Label>
              <CloudinaryUpload
                images={proofImage ? [proofImage] : []}
                onChange={(urls) => setProofImage(urls[0] || "")}
                maxFiles={1}
                folder="wahad-villa/refunds"
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label className="text-xs font-medium text-slate-600">Deduction Reason (if any)</Label>
              <Input
                value={deductionReason}
                onChange={(e) => setDeductionReason(e.target.value)}
                placeholder="Reason for deduction from deposit"
                className="rounded-xl border-slate-200"
              />
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-teal-600 hover:bg-teal-700 text-white"
          >
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Process Refund
          </Button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-6 w-6 text-slate-400 animate-spin mx-auto" />
          </div>
        ) : refunds.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No refund records</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Guest</th>
                  <th className="text-left px-4 py-3 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 font-medium">Method</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Deduction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {refunds.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(r.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {r.guest?.name}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                      â‚¹{Number(r.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {r.method}
                    </td>
                    <td className="px-4 py-3">{statusBadge(r.status)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate">
                      {r.deductionReason || "â€”"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
