"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Zap,
  Loader2,
  Receipt,
  IndianRupee,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  CreditCard,
} from "lucide-react";
import { CloudinaryUpload } from "@/components/shared/cloudinary-upload";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTableSkeleton } from "@/components/shared/data-table-skeleton";
import { formatCurrency } from "@/lib/formatters";

type Split = {
  id: string;
  amount: number;
  status: string;
  bill: {
    month: number;
    year: number;
    totalAmount: number;
    room: { name: string };
  };
  bed: { name: string };
  payment: { id: string; status: string } | null;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function GuestElectricityPage() {
  const [splits, setSplits] = useState<Split[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const [selectedSplit, setSelectedSplit] = useState<Split | null>(null);
  const [payLoading, setPayLoading] = useState(false);

  const [method, setMethod] = useState("UPI");
  const [amountPaid, setAmountPaid] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [proofImage, setProofImage] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/guest/electricity");
      if (res.ok) setSplits(await res.json());
    } catch {
      toast.error("Failed to load electricity data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pendingSplits = splits.filter((s) => s.status === "Pending");
  const paidSplits = splits.filter((s) => s.status === "Paid");
  const totalPending = pendingSplits.reduce((s, sp) => s + sp.amount, 0);

  const handlePay = async () => {
    if (!selectedSplit || !amountPaid || !method) {
      toast.error("Please fill required fields");
      return;
    }
    setPayLoading(true);
    try {
      const res = await fetch("/api/guest/electricity/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          splitId: selectedSplit.id,
          amountPaid: Number(amountPaid),
          method,
          transactionId: transactionId || null,
          proofImages: proofImage ? [proofImage] : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");
      toast.success("Payment proof uploaded! Awaiting admin approval.");
      setShowPayForm(false);
      setSelectedSplit(null);
      setAmountPaid("");
      setTransactionId("");
      setProofImage("");
      fetchData();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Payment failed";
      toast.error(message);
    } finally {
      setPayLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-200 animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
              <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-16 bg-slate-200 rounded-lg animate-pulse" />
          </div>
        </div>
        <DataTableSkeleton columns={1} rows={3} showHeader={false} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900">Electricity</h1>
        <p className="text-sm text-slate-500 mt-1">View and pay your room electricity charges</p>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
            <Zap className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Pending</p>
            <p className="text-xl font-semibold text-slate-900">
              {formatCurrency(totalPending)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-slate-500">Pending Bills</p>
            <p className="font-semibold text-slate-900">{pendingSplits.length}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-slate-500">Paid Bills</p>
            <p className="font-semibold text-slate-900">{paidSplits.length}</p>
          </div>
        </div>
      </div>

      {/* Pending Bills */}
      {pendingSplits.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">Pending Charges</h2>
          {pendingSplits.map((split) => (
            <div
              key={split.id}
              className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {MONTHS[split.bill.month - 1]} {split.bill.year}
                  </p>
                  <p className="text-xs text-slate-500">
                    {split.bill.room.name} Â· {split.bed.name}
                  </p>
                </div>
                <span className="text-lg font-semibold text-slate-900">
                  {formatCurrency(split.amount)}
                </span>
              </div>
              <Button
                onClick={() => {
                  setSelectedSplit(split);
                  setAmountPaid(String(split.amount));
                  setShowPayForm(true);
                }}
                className="w-full rounded-full bg-teal-600 hover:bg-teal-700 text-white h-11"
              >
                <IndianRupee className="h-4 w-4 mr-1.5" />
                Pay Now
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Pay Form Modal */}
      {showPayForm && selectedSplit && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Pay Electricity</h3>
                <button
                  onClick={() => setShowPayForm(false)}
                  className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="bg-teal-50 rounded-xl border border-teal-100 p-4 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                  <CreditCard className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-teal-700">UPI ID</p>
                  <p className="text-sm font-semibold text-teal-900 font-mono">theWaghadvilla@upi</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">Amount (Rs.) *</Label>
                <Input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="rounded-xl border-slate-200"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">Payment Method *</Label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white"
                >
                  {["UPI", "Cash", "Bank Transfer"].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">Transaction ID</Label>
                <Input
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Optional"
                  className="rounded-xl border-slate-200"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">Payment Proof *</Label>
                <CloudinaryUpload
                  images={proofImage ? [proofImage] : []}
                  onChange={(urls) => setProofImage(urls[0] || "")}
                  maxFiles={1}
                  folder="waghad-villa/payments"
                />
              </div>

              <Button
                onClick={handlePay}
                disabled={payLoading || !proofImage}
                className="w-full rounded-full bg-teal-600 hover:bg-teal-700 text-white h-11"
              >
                {payLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Payment"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {splits.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between bg-white rounded-xl border border-slate-100 p-4 text-sm font-medium text-slate-700"
          >
            <span className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-teal-600" />
              Payment History ({splits.length})
            </span>
            {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showHistory && (
            <div className="mt-2 space-y-2">
              {splits.map((split) => (
                <div
                  key={split.id}
                  className="bg-white rounded-xl border border-slate-100 p-4 flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {MONTHS[split.bill.month - 1]} {split.bill.year}
                    </p>
                    <p className="text-xs text-slate-500">
                      {split.bill.room.name} Â· {split.bed.name}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(split.amount)}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        split.status === "Paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {split.status === "Paid" ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {split.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {splits.length === 0 && (
        <EmptyState
          icon={Zap}
          title="No electricity charges yet"
          subtitle="Your electricity bill history will appear here once bills are generated."
        />
      )}
    </div>
  );
}
