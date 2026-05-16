"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getGuestSession } from "@/lib/supabase/auth";
import { LogOut, Loader2, Calendar, AlertTriangle } from "lucide-react";
import { DataTableSkeleton } from "@/components/shared/data-table-skeleton";
import { formatDate } from "@/lib/formatters";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type LeaveStatus = {
  id: string;
  lastDate: string;
  reason: string;
  status: string;
} | null;

export default function GuestLeavingPage() {
  const [leaveStatus, setLeaveStatus] = useState<LeaveStatus>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [noticePeriod, setNoticePeriod] = useState(30);

  const [lastDate, setLastDate] = useState("");
  const [reason, setReason] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const settingRes = await fetch("/api/settings/notice_period_days");
      if (settingRes.ok) {
        const s = await settingRes.json();
        if (s.value) setNoticePeriod(Number(s.value));
      }

      const res = await fetch("/api/guest/leaving");
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setLeaveStatus(data[0]);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + noticePeriod);
  const minDateStr = minDate.toISOString().split("T")[0];

  const handleSubmit = async () => {
    if (!lastDate || !reason) {
      toast.error("Last date and reason are required");
      return;
    }
    if (new Date(lastDate) < minDate) {
      toast.error(`Minimum ${noticePeriod} days notice required`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/guest/leaving", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastDate, reason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      toast.success("Leaving notice submitted! Awaiting admin approval.");
      const data = await res.json();
      setLeaveStatus(data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to submit";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-56 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="h-32 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (leaveStatus) {
    const statusColors: Record<string, string> = {
      submitted: "bg-amber-50 text-amber-700 border-amber-200",
      approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
      rejected: "bg-red-50 text-red-700 border-red-200",
      completed: "bg-slate-50 text-slate-700 border-slate-200",
    };
    return (
      <div className="space-y-6 p-4 md:p-6 max-w-xl mx-auto">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <LogOut className="h-5 w-5 text-teal-600" />
          Leaving Notice
        </h1>
        <div className={`rounded-xl border p-5 ${statusColors[leaveStatus.status] || statusColors.submitted}`}>
          <p className="text-sm font-medium">
            Status: <span className="capitalize">{leaveStatus.status.replace("_", " ")}</span>
          </p>
          <p className="text-sm mt-1">
            Last Date: {formatDate(leaveStatus.lastDate)}
          </p>
          <p className="text-sm mt-1">Reason: {leaveStatus.reason}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <LogOut className="h-5 w-5 text-teal-600" />
          Submit Leaving Notice
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Inform us about your planned departure
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">Notice Period Required</p>
          <p className="text-xs text-amber-700 mt-0.5">
            You must give at least <span className="font-bold">{noticePeriod} days</span> notice before leaving.
            Earliest allowed date: {formatDate(minDate)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-600">Expected Last Date *</Label>
          <Input
            type="date"
            value={lastDate}
            min={minDateStr}
            onChange={(e) => setLastDate(e.target.value)}
            className="rounded-xl border-slate-200"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-600">Reason for Leaving *</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please share your reason for leaving..."
            className="rounded-xl border-slate-200 min-h-[100px]"
          />
        </div>

        <Button
          onClick={() => setShowConfirm(true)}
          disabled={submitting || !lastDate || !reason}
          className="w-full rounded-full bg-teal-600 hover:bg-teal-700 text-white"
        >
          {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          Submit Leaving Notice
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Leaving Notice?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit your leaving notice? This will start your {noticePeriod}-day notice period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowConfirm(false); handleSubmit(); }}>
              Submit Notice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
