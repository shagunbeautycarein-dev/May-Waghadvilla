"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  MessageSquare,
  Plus,
  Loader2,
  Clock,
  CheckCircle,
  Wrench,
  AlertTriangle,
  X,
} from "lucide-react";
import { CloudinaryUpload } from "@/components/shared/cloudinary-upload";
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

const CATEGORIES = [
  "Electricity", "Cleaning", "WiFi", "Water", "Security", "Noise", "Other",
];

const PRIORITIES = ["Low", "Medium", "High"];

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Resolved: "bg-green-100 text-green-700",
};

type Complaint = {
  id: string;
  category: string;
  priority: string;
  description: string;
  status: string;
  remarks: string | null;
  images: string[];
  createdAt: string;
};

export default function GuestComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/guest/complaints");
      if (res.ok) setComplaints(await res.json());
    } catch {
      toast.error("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async () => {
    if (!category || !description || description.length < 20) {
      toast.error("Please select a category and enter a description (min 20 chars)");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/guest/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, priority, description, images }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      toast.success("Complaint raised successfully");
      setShowForm(false);
      setCategory("");
      setPriority("Medium");
      setDescription("");
      setImages([]);
      fetchData();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to submit";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-32 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="h-10 w-24 bg-slate-200 rounded-full animate-pulse" />
        </div>
        <DataTableSkeleton columns={1} rows={4} showHeader={false} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900">Complaints</h1>
          <p className="text-sm text-slate-500 mt-1">Raise and track your complaints</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="rounded-full bg-teal-600 hover:bg-teal-700 text-white h-10 px-5"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Raise
        </Button>
      </div>

      {/* Complaint List */}
      {complaints.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No complaints yet"
          subtitle="You haven't raised any complaints. Click 'Raise' to submit one."
        />
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <ComplaintCard key={c.id} complaint={c} />
          ))}
        </div>
      )}

      {/* Raise Complaint Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Raise Complaint</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">Category *</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white min-h-[44px]"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">Priority</Label>
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-2.5 min-h-[44px] rounded-xl text-sm font-medium border transition-all ${
                        priority === p
                          ? "bg-teal-50 border-teal-200 text-teal-700"
                          : "bg-white border-slate-200 text-slate-500"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">Description *</Label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your issue in detail (min 20 characters)..."
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none min-h-[44px]"
                />
                <p className="text-xs text-slate-400 text-right">{description.length} chars</p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">Photos (optional, max 3)</Label>
                <CloudinaryUpload
                  images={images}
                  onChange={setImages}
                  maxFiles={3}
                  folder="waghad-villa/complaints"
                />
              </div>

              <Button
                onClick={() => setShowConfirm(true)}
                disabled={saving}
                className="w-full rounded-full bg-teal-600 hover:bg-teal-700 text-white h-11"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Complaint"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Complaint?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to raise this complaint? Please ensure all details are correct before submitting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowConfirm(false); handleSubmit(); }}>
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ComplaintCard({ complaint }: { complaint: Complaint }) {
  const [expanded, setExpanded] = useState(false);

  const priorityColor =
    complaint.priority === "High"
      ? "bg-red-100 text-red-700"
      : complaint.priority === "Medium"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-700";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-slate-900">{complaint.category}</span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityColor}`}>
                {complaint.priority}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {formatDate(complaint.createdAt)}
            </p>
          </div>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium shrink-0 ${STATUS_COLORS[complaint.status] || "bg-slate-100 text-slate-700"}`}>
            {complaint.status === "Pending" && <Clock className="h-3 w-3 mr-0.5" />}
            {complaint.status === "In Progress" && <Wrench className="h-3 w-3 mr-0.5" />}
            {complaint.status === "Resolved" && <CheckCircle className="h-3 w-3 mr-0.5" />}
            {complaint.status}
          </span>
        </div>

        <p className="text-sm text-slate-700 mt-2 line-clamp-2">{complaint.description}</p>

        {complaint.remarks && (
          <div className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-2">
            <span className="font-medium">Admin remark:</span> {complaint.remarks}
          </div>
        )}

        {complaint.images.length > 0 && (
          <div className="flex gap-2 mt-2">
            {complaint.images.map((img, i) => (
              <img key={i} src={img} alt="" className="w-12 h-12 object-cover rounded-lg border border-slate-100" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
