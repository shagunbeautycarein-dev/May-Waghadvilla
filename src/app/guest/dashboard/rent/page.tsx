"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getGuestSession } from "@/lib/supabase/auth";
import { LEDGER_STATUS_COLORS } from "@/lib/constants";
import { toast } from "sonner";
import { CreditCard, FileImage, X, Upload, Receipt, QrCode, Copy, Check } from "lucide-react";
import { CloudinaryUpload } from "@/components/shared/cloudinary-upload";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTableSkeleton } from "@/components/shared/data-table-skeleton";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { MobileTableWrapper, MobileCards, MobileCard } from "@/components/admin/mobile-table";

interface Guest {
  id: string;
}

interface LedgerEntry {
  id: string;
  description: string;
  amount: number | string;
  paid: number | string;
  due: number | string;
  status: string;
  dueDate?: string | null;
}

export default function GuestRentPage() {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadData, setUploadData] = useState({
    amount: "",
    type: "Rent",
    method: "UPI",
    transactionId: "",
    proofImage: "",
  });
  const [paymentSettings, setPaymentSettings] = useState({ upiId: "", qrCode: "" });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data: sessionData } = await getGuestSession();
        const email = sessionData.session?.user?.email;
        if (!email) return;

        const guestRes = await fetch(`/api/guest/profile?email=${encodeURIComponent(email)}`);
        if (!guestRes.ok) return;
        const guestData: Guest = await guestRes.json();
        setGuest(guestData);

        const ledgerRes = await fetch(`/api/guest/ledger?guestId=${guestData.id}`);
        if (ledgerRes.ok) setLedger(await ledgerRes.json());

        // Fetch payment settings
        const [upiRes, qrRes] = await Promise.all([
          fetch("/api/settings/payment_upi_id").catch(() => null),
          fetch("/api/settings/payment_qr_code").catch(() => null),
        ]);
        const upiData = upiRes?.ok ? await upiRes.json() : null;
        const qrData = qrRes?.ok ? await qrRes.json() : null;
        setPaymentSettings({
          upiId: upiData?.value || "",
          qrCode: qrData?.value || "",
        });
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guest) return;

    try {
      const res = await fetch("/api/guest/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId: guest.id,
          amount: Number(uploadData.amount),
          type: uploadData.type,
          method: uploadData.method,
          transactionId: uploadData.transactionId || null,
          proofImages: uploadData.proofImage ? [uploadData.proofImage] : [],
        }),
      });

      if (!res.ok) throw new Error("Upload failed");
      toast.success("Payment proof uploaded! Waiting for admin approval.");
      setShowUpload(false);
      setUploadData({ amount: "", type: "Rent", method: "UPI", transactionId: "", proofImage: "" });
    } catch {
      toast.error("Failed to upload payment proof");
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="h-9 w-36 bg-slate-200 rounded-full animate-pulse" />
        </div>
        <DataTableSkeleton columns={5} rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Rent & Payments</h1>
          <p className="text-sm text-slate-500 mt-1">View ledger and upload payment proofs</p>
        </div>
        <Button
          onClick={() => setShowUpload(!showUpload)}
          className="rounded-full bg-teal-600 hover:bg-teal-700 text-white"
        >
          {showUpload ? (
            <>
              <X className="mr-1.5 h-4 w-4" /> Cancel
            </>
          ) : (
            <>
              <Upload className="mr-1.5 h-4 w-4" /> Upload Payment Proof
            </>
          )}
        </Button>
      </div>

      {/* Pay Now / Upload Form */}
      {showUpload && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-xl">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Upload Payment Proof</h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">Amount (â‚¹)</Label>
                <Input
                  type="number"
                  value={uploadData.amount}
                  onChange={(e) => setUploadData({ ...uploadData, amount: e.target.value })}
                  required
                  className="rounded-xl border-slate-200 focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">Type</Label>
                <Select
                  value={uploadData.type}
                  onValueChange={(v) => setUploadData({ ...uploadData, type: v })}
                >
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Rent", "Deposit", "Electricity", "Other"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Method</Label>
              <Select
                value={uploadData.method}
                onValueChange={(v) => setUploadData({ ...uploadData, method: v })}
              >
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["UPI", "Cash", "Bank Transfer"].map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Transaction ID</Label>
              <Input
                value={uploadData.transactionId}
                onChange={(e) => setUploadData({ ...uploadData, transactionId: e.target.value })}
                className="rounded-xl border-slate-200 focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
              />
            </div>

            {/* File Upload Zone */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Payment Screenshot</Label>
              <CloudinaryUpload
                images={uploadData.proofImage ? [uploadData.proofImage] : []}
                onChange={(urls) => setUploadData((prev) => ({ ...prev, proofImage: urls[0] || "" }))}
                maxFiles={1}
                folder="waghad-villa/payments"
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-full bg-teal-600 hover:bg-teal-700 text-white"
            >
              <CreditCard className="mr-1.5 h-4 w-4" />
              Submit Payment Proof
            </Button>
          </form>
        </div>
      )}

      {/* Payment Details Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-teal-600" />
          Payment Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* QR Code */}
          <div className="flex flex-col items-center justify-center gap-3">
            {paymentSettings.qrCode ? (
              <>
                <img
                  src={paymentSettings.qrCode}
                  alt="Payment QR Code"
                  className="h-48 w-48 object-contain rounded-xl border border-slate-100 bg-white"
                />
                <p className="text-xs text-slate-400">Scan to pay via UPI</p>
              </>
            ) : (
              <div className="h-48 w-48 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 gap-2">
                <QrCode className="h-10 w-10" />
                <p className="text-xs">QR code not set</p>
              </div>
            )}
          </div>

          {/* UPI ID */}
          <div className="flex flex-col justify-center gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">UPI ID</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900 font-mono">
                    {paymentSettings.upiId || "Not configured"}
                  </p>
                </div>
                {paymentSettings.upiId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(paymentSettings.upiId);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="rounded-full h-10 px-3"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs font-medium text-amber-700 mb-1">Instructions</p>
              <ol className="text-xs text-amber-800 space-y-1 list-decimal list-inside">
                <li>Scan the QR code or copy the UPI ID</li>
                <li>Pay using any UPI app (GPay, PhonePe, Paytm)</li>
                <li>Take a screenshot of the payment</li>
                <li>Upload the screenshot using the button above</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      {ledger.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No ledger entries"
          subtitle="Your rent and payment history will appear here."
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 hidden md:block">
            <h2 className="text-sm font-semibold text-slate-900">Payment Ledger</h2>
          </div>
          <MobileTableWrapper>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="text-xs font-medium text-slate-500">Description</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500">Amount</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500">Paid</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500">Due</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.map((entry) => (
                  <TableRow key={entry.id} className="border-slate-100 hover:bg-slate-50/50">
                    <TableCell className="text-sm text-slate-700">
                      <div>{entry.description}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{formatDate(entry.dueDate)}</div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">
                      {formatCurrency(entry.amount)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">
                      {formatCurrency(entry.paid)}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-900">
                      {formatCurrency(entry.due)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                          LEDGER_STATUS_COLORS[entry.status] || "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {entry.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </MobileTableWrapper>

          <MobileCards
            data={ledger}
            className="md:hidden"
            renderCard={(entry) => (
              <MobileCard
                title={
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate pr-2">{entry.description}</span>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        LEDGER_STATUS_COLORS[entry.status] || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {entry.status}
                    </span>
                  </div>
                }
              >
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-medium text-slate-900">{formatDate(entry.dueDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount:</span>
                  <span className="font-medium text-slate-900">{formatCurrency(entry.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Paid:</span>
                  <span className="font-medium text-slate-900">{formatCurrency(entry.paid)}</span>
                </div>
                <div className="flex justify-between pt-1 mt-1 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Due:</span>
                  <span className={`font-semibold ${Number(entry.due) > 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {formatCurrency(entry.due)}
                  </span>
                </div>
                {Number(entry.due) > 0 && (
                  <div className="pt-2 mt-2">
                    <Button
                      size="sm"
                      className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white"
                      onClick={() => {
                        setUploadData((prev) => ({ ...prev, amount: String(entry.due) }));
                        setShowUpload(true);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Pay Now
                    </Button>
                  </div>
                )}
              </MobileCard>
            )}
          />
        </div>
      )}
    </div>
  );
}
