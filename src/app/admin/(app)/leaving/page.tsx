"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  LogOut,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  Home,
  Bed,
  IndianRupee,
  ShieldCheck,
  Key,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { generateClearancePDF } from "@/lib/clearance-pdf";

type LeaveRequest = {
  id: string;
  guest: {
    name: string;
    mobile: string;
    room?: { name: string };
    bed?: { name: string };
  };
  requestDate: string;
  lastDate: string;
  reason: string;
  status: string;
  pendingRentAmount: number;
  pendingElectricityAmount: number;
  damageDeductionAmount: number;
  refundAmount: number | null;
  inspectionPassed: boolean | null;
  keysReturned: boolean | null;
};

type ClearanceData = {
  leavingRequest: LeaveRequest;
  pendingRent: number;
  pendingElectricity: number;
  depositPaid: number;
  totalDeductions: number;
  refundDue: number;
};

export default function LeavingRequestsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewRequest, setViewRequest] = useState<LeaveRequest | null>(null);
  const [clearanceData, setClearanceData] = useState<ClearanceData | null>(null);
  const [showClearance, setShowClearance] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [damageAmount, setDamageAmount] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/leaving");
      if (res.ok) setRequests(await res.json());
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/leaving", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "approved" }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Request approved");
      setViewRequest(null);
      fetchData();
    } catch {
      toast.error("Failed to approve");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/leaving", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "rejected", rejectionReason: reason }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Request rejected");
      setViewRequest(null);
      fetchData();
    } catch {
      toast.error("Failed to reject");
    } finally {
      setActionLoading(false);
    }
  };

  const fetchClearance = async (requestId: string) => {
    try {
      const res = await fetch(`/api/admin/leaving/clearance?requestId=${requestId}`);
      if (res.ok) {
        const data = await res.json();
        setClearanceData(data);
        setShowClearance(true);
        setDamageAmount(String(data.leavingRequest.damageDeductionAmount || 0));
      }
    } catch {
      toast.error("Failed to load clearance data");
    }
  };

  const handleCloseAccount = async () => {
    if (!clearanceData) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/leaving/clearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: clearanceData.leavingRequest.id,
          pendingRentAmount: clearanceData.pendingRent,
          pendingElectricityAmount: clearanceData.pendingElectricity,
          damageDeductionAmount: Number(damageAmount || 0),
          refundAmount: clearanceData.refundDue,
          inspectionPassed: true,
          keysReturned: true,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Account closed successfully");
      setShowClearance(false);
      setClearanceData(null);
      fetchData();
    } catch {
      toast.error("Failed to close account");
    } finally {
      setActionLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      submitted: "bg-amber-100 text-amber-700",
      approved: "bg-blue-100 text-blue-700",
      rejected: "bg-red-100 text-red-700",
      completed: "bg-emerald-100 text-emerald-700",
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
        <h1 className="text-2xl font-bold text-slate-900">Leaving Requests</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage guest departure requests and final clearance
        </p>
      </div>

      {showClearance && clearanceData ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-600" />
              Final Clearance — {clearanceData.leavingRequest.guest.name}
            </h2>
            <Button variant="outline" size="sm" onClick={() => setShowClearance(false)} className="rounded-full">
              Back
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase">Auto-Calculated</p>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Pending Rent</span>
                <span className="font-semibold text-slate-900">₹{clearanceData.pendingRent.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Pending Electricity</span>
                <span className="font-semibold text-slate-900">₹{clearanceData.pendingElectricity.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Damage Deductions</span>
                <Input
                  type="number"
                  value={damageAmount}
                  onChange={(e) => setDamageAmount(e.target.value)}
                  className="w-28 h-7 text-sm rounded-lg"
                />
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm">
                <span className="text-slate-600">Deposit Paid</span>
                <span className="font-semibold text-slate-900">₹{clearanceData.depositPaid.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Deductions</span>
                <span className="font-semibold text-red-600">
                  ₹{(clearanceData.pendingRent + clearanceData.pendingElectricity + Number(damageAmount || 0)).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span className="text-slate-900">Refund Due</span>
                <span className="text-emerald-600">
                  ₹{(clearanceData.depositPaid - clearanceData.pendingRent - clearanceData.pendingElectricity - Number(damageAmount || 0)).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase">Checklist</p>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" className="rounded border-slate-300" />
                Room Inspection Passed
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" className="rounded border-slate-300" />
                Keys Returned
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" className="rounded border-slate-300" />
                Electricity Meter Reading Recorded
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleCloseAccount}
              disabled={actionLoading}
              className="rounded-full bg-teal-600 hover:bg-teal-700 text-white"
            >
              {actionLoading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Close Account
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                if (!clearanceData) return;
                const doc = generateClearancePDF(clearanceData);
                doc.save(`clearance-${clearanceData.leavingRequest.guest.name.replace(/\s+/g, "-").toLowerCase()}.pdf`);
              }}
            >
              <FileText className="mr-1.5 h-4 w-4" />
              Generate Settlement PDF
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-6 w-6 text-slate-400 animate-spin mx-auto" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <LogOut className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No leaving requests</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <th className="text-left px-4 py-3 font-medium">Guest</th>
                    <th className="text-left px-4 py-3 font-medium">Room</th>
                    <th className="text-left px-4 py-3 font-medium">Last Date</th>
                    <th className="text-left px-4 py-3 font-medium">Reason</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {r.guest?.name}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {r.guest?.room?.name} / {r.guest?.bed?.name}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(r.lastDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-[200px] truncate">
                        {r.reason}
                      </td>
                      <td className="px-4 py-3">{statusBadge(r.status)}</td>
                      <td className="px-4 py-3">
                        {r.status === "submitted" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(r.id)}
                              disabled={actionLoading}
                              className="text-emerald-600 hover:text-emerald-700"
                              title="Approve"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt("Rejection reason:");
                                if (reason) handleReject(r.id, reason);
                              }}
                              disabled={actionLoading}
                              className="text-red-500 hover:text-red-600"
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        ) : r.status === "approved" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => fetchClearance(r.id)}
                            className="rounded-full text-xs h-7"
                          >
                            Clearance
                          </Button>
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
      )}
    </div>
  );
}
