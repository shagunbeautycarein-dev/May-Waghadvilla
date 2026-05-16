"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  Clock,
  Home,
  Bed,
  IndianRupee,
  Info,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTableSkeleton } from "@/components/shared/data-table-skeleton";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
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

type Transfer = {
  id: string;
  guest: { name: string; room?: { name: string }; bed?: { name: string } };
  oldBed: { name: string; room: { name: string } };
  newBed: { name: string; room: { name: string } };
  effectiveDate: string;
  rentDifference: number;
  status: string;
  reason: string | null;
  createdAt: string;
};

export default function BedTransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTransferId, setRejectTransferId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bed-transfers");
      if (res.ok) setTransfers(await res.json());
    } catch {
      toast.error("Failed to load transfers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (id: string, status: string) => {
    setActionId(id);
    try {
      const res = await fetch("/api/admin/bed-transfers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Transfer ${status}`);
      fetchData();
    } catch {
      toast.error("Failed to update transfer");
    } finally {
      setActionId(null);
    }
  };

  const openRejectDialog = (id: string) => {
    setRejectTransferId(id);
    setRejectDialogOpen(true);
  };

  const handleReject = () => {
    if (rejectTransferId) {
      handleAction(rejectTransferId, "cancelled");
      setRejectDialogOpen(false);
      setRejectTransferId(null);
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      requested: "bg-amber-100 text-amber-700",
      completed: "bg-emerald-100 text-emerald-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${styles[status] || "bg-slate-100 text-slate-600"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bed Transfer Requests</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage guest room and bed transfer requests
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <DataTableSkeleton columns={8} />
        ) : transfers.length === 0 ? (
          <EmptyState
            icon={ArrowRightLeft}
            title="No transfer requests"
            subtitle="Bed transfer requests will appear here once guests submit them."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Guest</th>
                  <th className="text-left px-4 py-3 font-medium">Current</th>
                  <th className="text-left px-4 py-3 font-medium">New</th>
                  <th className="text-left px-4 py-3 font-medium">Effective</th>
                  <th className="text-left px-4 py-3 font-medium">Rent Diff</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                      {formatDate(t.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {t.guest?.name}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Home className="h-3 w-3" />
                        {t.oldBed?.room?.name} / {t.oldBed?.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Home className="h-3 w-3" />
                        {t.newBed?.room?.name} / {t.newBed?.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDate(t.effectiveDate)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-semibold text-slate-900">
                        {t.rentDifference > 0 ? "+" : ""}{formatCurrency(t.rentDifference)}
                      </div>
                      {t.status === "requested" && t.rentDifference !== 0 && (
                        <div className={`text-[10px] mt-0.5 font-medium ${
                          t.rentDifference > 0 ? "text-amber-600" : "text-emerald-600"
                        }`}>
                          {t.rentDifference > 0
                            ? `Guest must pay ${formatCurrency(t.rentDifference)}`
                            : `Refund/Adjust ${formatCurrency(Math.abs(t.rentDifference))}`}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{statusBadge(t.status)}</td>
                    <td className="px-4 py-3">
                      {t.status === "requested" ? (
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleAction(t.id, "completed")}
                                disabled={actionId === t.id}
                                className="text-emerald-600 hover:text-emerald-700 transition-colors"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Approve transfer</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => openRejectDialog(t.id)}
                                disabled={actionId === t.id}
                                className="text-red-500 hover:text-red-600 transition-colors"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Reject transfer</TooltipContent>
                          </Tooltip>
                          {t.rentDifference !== 0 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                {t.rentDifference > 0
                                  ? `Approving will create a pending ledger of ${formatCurrency(t.rentDifference)} for the rent increase.`
                                  : `Approving will create a credit ledger of ${formatCurrency(Math.abs(t.rentDifference))} (pre-paid) for the rent decrease. This can be adjusted against next rent or refunded.`}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Transfer?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this bed transfer request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setRejectDialogOpen(false); setRejectTransferId(null); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} className="bg-red-600 hover:bg-red-700 text-white">
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
