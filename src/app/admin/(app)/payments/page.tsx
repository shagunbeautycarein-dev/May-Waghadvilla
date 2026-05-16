"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PAYMENT_STATUS_COLORS, PAYMENT_STATUSES } from "@/lib/constants";
import { toast } from "sonner";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { Eye, Receipt, FileText, CreditCard, QrCode, Copy, Check } from "lucide-react";
import { generateReceiptPDF } from "@/lib/receipt-pdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTableSkeleton } from "@/components/shared/data-table-skeleton";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

const FILTERS = ["All", ...PAYMENT_STATUSES];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [selectedProofImages, setSelectedProofImages] = useState<string[]>([]);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectPaymentId, setRejectPaymentId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("Invalid proof");
  const [paymentSettings, setPaymentSettings] = useState({ upiId: "", qrCode: "" });
  const [copied, setCopied] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "All") params.append("status", filter);
      const res = await fetch(`/api/admin/payments?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      setPayments(await res.json());
    } catch {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchPayments();
    // Fetch payment settings for reference
    async function loadSettings() {
      try {
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
        // ignore
      }
    }
    loadSettings();
  }, [fetchPayments]);

  const updateStatus = async (id: string, status: string, reason?: string) => {
    try {
      const res = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, rejectionReason: reason }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success(`Payment marked as ${status}`);
      fetchPayments();
    } catch {
      toast.error("Failed to update payment");
    }
  };

  const openProofViewer = (images: string[]) => {
    setSelectedProofImages(images);
    setProofModalOpen(true);
  };

  const openRejectDialog = (id: string) => {
    setRejectPaymentId(id);
    setRejectReason("Invalid proof");
    setRejectDialogOpen(true);
  };

  const handleReject = () => {
    if (rejectPaymentId) {
      updateStatus(rejectPaymentId, "Rejected", rejectReason);
      setRejectDialogOpen(false);
      setRejectPaymentId(null);
    }
  };

  const filtered = filter === "All" ? payments : payments.filter((p) => p.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payment Approval Queue</h1>
        <p className="text-sm text-slate-500 mt-1">Review and approve guest payments</p>
      </div>

      {/* Payment Reference Card */}
      {(paymentSettings.upiId || paymentSettings.qrCode) && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {paymentSettings.qrCode && (
              <img
                src={paymentSettings.qrCode}
                alt="Payment QR"
                className="h-20 w-20 object-contain rounded-lg border border-slate-100 bg-white"
              />
            )}
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">UPI ID for Guest Payments</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm font-semibold text-slate-900 font-mono">{paymentSettings.upiId || "Not set"}</p>
                {paymentSettings.upiId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(paymentSettings.upiId);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="h-7 w-7 p-0 rounded-full"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open("/admin/settings", "_self")}
              className="rounded-full border-slate-200 text-slate-600"
            >
              <CreditCard className="h-3.5 w-3.5 mr-1.5" />
              Edit Payment Settings
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className={`rounded-full ${
              filter === f
                ? "bg-teal-600 hover:bg-teal-700 text-white"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f}
          </Button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <DataTableSkeleton columns={8} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No payments found"
            subtitle={filter !== "All" ? "Try changing your filter" : "Payments will appear here once guests make them."}
          />
        ) : (
          <div className="overflow-x-auto">

          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="text-slate-500 font-medium">Date</TableHead>
                <TableHead className="text-slate-500 font-medium">Guest</TableHead>
                <TableHead className="text-slate-500 font-medium">Type</TableHead>
                <TableHead className="text-slate-500 font-medium">Amount</TableHead>
                <TableHead className="text-slate-500 font-medium">Method</TableHead>
                <TableHead className="text-slate-500 font-medium">Status</TableHead>
                <TableHead className="text-slate-500 font-medium">Proof</TableHead>
                <TableHead className="text-right text-slate-500 font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((payment) => (
                <TableRow key={payment.id} className="hover:bg-slate-50/50">
                  <TableCell className="text-slate-600">
                    {formatDate(payment.createdAt)}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">{payment.guest?.name || "-"}</TableCell>
                  <TableCell className="text-slate-600">{payment.type}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900">{formatCurrency(payment.amount)}</p>
                      {(payment.depositAmount || payment.rentAmount) && (
                        <div className="flex flex-wrap gap-1">
                          {payment.depositAmount ? (
                            <Badge variant="outline" className="rounded-full text-[10px] bg-blue-50 text-blue-700 border-blue-100">
                              D: {formatCurrency(payment.depositAmount)}
                            </Badge>
                          ) : null}
                          {payment.rentAmount ? (
                            <Badge variant="outline" className="rounded-full text-[10px] bg-emerald-50 text-emerald-700 border-emerald-100">
                              R: {formatCurrency(payment.rentAmount)}
                              {payment.rentForMonth && payment.rentForYear ? ` (${new Date(payment.rentForYear, payment.rentForMonth - 1).toLocaleString("en-IN", { month: "short" })} ${payment.rentForYear})` : ""}
                            </Badge>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">{payment.method}</TableCell>
                  <TableCell>
                    <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PAYMENT_STATUS_COLORS[payment.status] || "bg-slate-100 text-slate-800"}`}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {payment.proofImages && payment.proofImages.length > 0 ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openProofViewer(payment.proofImages)}
                        className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-full h-8 px-3"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        View ({payment.proofImages.length})
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {payment.status === "Approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const doc = generateReceiptPDF(payment, payment.guest);
                            doc.save(`receipt-${payment.id.slice(0, 8)}.pdf`);
                          }}
                          className="rounded-full border-teal-200 text-teal-600 hover:bg-teal-50"
                        >
                          <FileText className="h-3.5 w-3.5 mr-1.5" />
                          Receipt
                        </Button>
                      )}
                      {payment.status === "Uploaded" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(payment.id, "Under Review")}
                          className="rounded-full border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                          Review
                        </Button>
                      )}
                      {payment.status === "Under Review" && (
                        <>
                          <Button
                            size="sm"
                            className="rounded-full bg-teal-600 hover:bg-teal-700 text-white"
                            onClick={() => updateStatus(payment.id, "Approved")}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => openRejectDialog(payment.id)}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          </div>
        )}

        <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will reject the payment. Please provide a reason below.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-2">
              <label className="text-xs font-medium text-slate-600">Rejection Reason</label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                placeholder="Enter reason..."
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setRejectDialogOpen(false); setRejectPaymentId(null); }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleReject} className="bg-red-600 hover:bg-red-700 text-white">
                Reject
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Proof Viewer Modal */}
      <Dialog open={proofModalOpen} onOpenChange={setProofModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">Payment Proof</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            {selectedProofImages.map((img, idx) => (
              <div key={idx} className="rounded-xl border border-slate-100 overflow-hidden bg-slate-50">
                <img
                  src={img}
                  alt={`Proof ${idx + 1}`}
                  className="w-full h-64 object-contain"
                />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
