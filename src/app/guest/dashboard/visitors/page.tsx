"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, Loader2, Clock, CheckCircle, Plus, X, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
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

type Visitor = {
  id: string;
  visitorName: string;
  mobile: string | null;
  relation: string | null;
  visitDate: string;
  entryTime: string | null;
  exitTime: string | null;
  status: string;
};

export default function GuestVisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [relation, setRelation] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [entryTime, setEntryTime] = useState("");
  const [exitTime, setExitTime] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/guest/visitors");
      if (res.ok) setVisitors(await res.json());
    } catch {
      toast.error("Failed to load visitors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async () => {
    if (!name || !visitDate) {
      toast.error("Visitor name and visit date are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/guest/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorName: name,
          mobile,
          relation,
          visitDate,
          entryTime,
          exitTime,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Visitor added");
      setShowForm(false);
      setName("");
      setMobile("");
      setRelation("");
      setVisitDate("");
      setEntryTime("");
      setExitTime("");
      fetchData();
    } catch {
      toast.error("Failed to add visitor");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (visitorId: string) => {
    try {
      const res = await fetch(`/api/guest/visitors?id=${visitorId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Visitor removed");
      fetchData();
    } catch {
      toast.error("Failed to remove visitor");
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "checked_in":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "checked_out":
        return <Clock className="h-4 w-4 text-slate-400" />;
      default:
        return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "checked_in":
        return "Checked In";
      case "checked_out":
        return "Checked Out";
      default:
        return "Expected";
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-40 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="h-9 w-9 bg-slate-200 rounded-full animate-pulse" />
        </div>
        <DataTableSkeleton columns={1} rows={4} showHeader={false} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-600" />
            Visitor Log
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Add and track your visitors
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className="rounded-full bg-teal-600 hover:bg-teal-700 text-white"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">Add Visitor</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-slate-600">Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl border-slate-200" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-600">Mobile</Label>
              <Input value={mobile} onChange={(e) => setMobile(e.target.value)} className="rounded-xl border-slate-200" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-600">Relation</Label>
              <Input value={relation} onChange={(e) => setRelation(e.target.value)} className="rounded-xl border-slate-200" placeholder="e.g. Friend, Family" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-600">Visit Date *</Label>
              <Input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className="rounded-xl border-slate-200" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-600">Expected Entry</Label>
              <Input type="time" value={entryTime} onChange={(e) => setEntryTime(e.target.value)} className="rounded-xl border-slate-200" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-600">Expected Exit</Label>
              <Input type="time" value={exitTime} onChange={(e) => setExitTime(e.target.value)} className="rounded-xl border-slate-200" />
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={saving} className="w-full rounded-full bg-teal-600 hover:bg-teal-700 text-white">
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Add Visitor
          </Button>
        </div>
      )}

      {/* List */}
      {visitors.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No visitors added yet"
          subtitle="Add visitors to keep track of who is visiting you."
        />
      ) : (
        <div className="space-y-3">
          {visitors.map((v) => (
            <div key={v.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{v.visitorName}</p>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium rounded-full bg-slate-50 px-2 py-0.5">
                      {statusIcon(v.status)}
                      {statusLabel(v.status)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(v.id);
                      }}
                      className="h-7 w-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      aria-label="Delete visitor"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {v.relation || "Visitor"} {v.mobile ? `• ${v.mobile}` : ""}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {formatDate(v.visitDate)}
                  {v.entryTime && ` • ${v.entryTime}`}
                  {v.exitTime && ` - ${v.exitTime}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Visitor?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this visitor? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) handleDelete(deleteId);
                setDeleteId(null);
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
