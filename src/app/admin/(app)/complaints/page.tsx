"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  MessageSquare,
  Clock,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Filter,
  Eye,
  X,
  User,
  Home,
  Bed,
  Calendar,
} from "lucide-react";
import { formatDate } from "@/lib/formatters";
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

const CATEGORIES = ["All", "Electricity", "Cleaning", "WiFi", "Water", "Security", "Noise", "Other"];
const PRIORITIES = ["All", "High", "Medium", "Low"];
const STATUSES = ["All", "Pending", "In Progress", "Resolved"];

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
  assignedStaffId: string | null;
  images: string[];
  createdAt: string;
  updatedAt: string;
  guest: {
    id: string;
    name: string;
    mobile: string;
    room: { name: string } | null;
    bed: { name: string } | null;
  };
};

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewComplaint, setViewComplaint] = useState<Complaint | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolveComplaintId, setResolveComplaintId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "All") params.append("status", statusFilter);
      if (categoryFilter !== "All") params.append("category", categoryFilter);
      if (priorityFilter !== "All") params.append("priority", priorityFilter);
      const res = await fetch(`/api/admin/complaints?${params.toString()}`);
      if (res.ok) setComplaints(await res.json());
    } catch {
      toast.error("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, priorityFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    const total = complaints.length;
    const pending = complaints.filter((c) => c.status === "Pending").length;
    const inProgress = complaints.filter((c) => c.status === "In Progress").length;
    const highPriority = complaints.filter((c) => c.priority === "High" && c.status !== "Resolved").length;
    return { total, pending, inProgress, highPriority };
  }, [complaints]);

  const handleUpdate = async (id: string, updates: Record<string, unknown>) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success("Complaint updated");
      setViewComplaint(null);
      fetchData();
    } catch {
      toast.error("Failed to update");
    } finally {
      setActionLoading(false);
    }
  };

  const openResolveDialog = (id: string) => {
    setResolveComplaintId(id);
    setResolveDialogOpen(true);
  };

  const handleResolve = () => {
    if (resolveComplaintId) {
      handleUpdate(resolveComplaintId, { status: "Resolved" });
      setResolveDialogOpen(false);
      setResolveComplaintId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900">Complaints</h1>
        <p className="text-sm text-slate-500 mt-1">Manage and resolve guest complaints</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: MessageSquare, color: "bg-blue-50 text-blue-600" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "bg-amber-50 text-amber-600" },
          { label: "In Progress", value: stats.inProgress, icon: Wrench, color: "bg-purple-50 text-purple-600" },
          { label: "High Priority", value: stats.highPriority, icon: AlertTriangle, color: "bg-red-50 text-red-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full ${s.color} flex items-center justify-center shrink-0`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { options: CATEGORIES, value: categoryFilter, set: setCategoryFilter, label: "Category" },
          { options: PRIORITIES, value: priorityFilter, set: setPriorityFilter, label: "Priority" },
          { options: STATUSES, value: statusFilter, set: setStatusFilter, label: "Status" },
        ].map((f) => (
          <div key={f.label} className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              {f.options.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 md:px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">All Complaints</h2>
          <span className="text-xs text-slate-400">{complaints.length} found</span>
        </div>
        {loading ? (
          <DataTableSkeleton columns={6} />
        ) : complaints.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No complaints found"
            subtitle="Complaints will appear here once guests submit them."
          />
        ) : (
          <div className="overflow-x-auto">
            <div className="w-full overflow-x-auto"><table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Guest</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-left px-4 py-3 font-medium">Priority</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900">{c.guest.name}</p>
                      <p className="text-xs text-slate-500">{c.guest.room?.name} · {c.guest.bed?.name}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{c.category}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        c.priority === "High" ? "bg-red-100 text-red-700" :
                        c.priority === "Medium" ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-700"
                      }`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[c.status] || ""}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setViewComplaint(c)}
                            className="h-8 rounded-full text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View complaint details</TooltipContent>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        )}
      </div>

      {/* View/Action Dialog */}
      <Dialog open={!!viewComplaint} onOpenChange={() => setViewComplaint(null)}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Complaint Details
            </DialogTitle>
          </DialogHeader>
          {viewComplaint && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-teal-50 flex items-center justify-center">
                  <User className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{viewComplaint.guest.name}</p>
                  <p className="text-xs text-slate-500">{viewComplaint.guest.mobile}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-slate-500">Category</p>
                  <p className="font-medium text-slate-900">{viewComplaint.category}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-slate-500">Priority</p>
                  <p className="font-medium text-slate-900">{viewComplaint.priority}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-slate-500">Status</p>
                  <p className="font-medium text-slate-900">{viewComplaint.status}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">Description</p>
                <p className="text-sm text-slate-800">{viewComplaint.description}</p>
              </div>

              {viewComplaint.images.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Photos</p>
                  <div className="flex gap-2">
                    {viewComplaint.images.map((img, i) => (
                      <img key={i} src={img} alt="" className="w-20 h-20 object-cover rounded-lg border border-slate-100" />
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {viewComplaint.status !== "Resolved" && (
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">Update Status</label>
                    <div className="flex gap-2">
                      {viewComplaint.status === "Pending" && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(viewComplaint.id, { status: "In Progress" })}
                          disabled={actionLoading}
                          className="rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Wrench className="h-3.5 w-3.5 mr-1" />
                          Mark In Progress
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => openResolveDialog(viewComplaint.id)}
                        disabled={actionLoading}
                        className="rounded-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        Resolve
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">Add Remark</label>
                    <div className="flex gap-2">
                      <Input
                        defaultValue={viewComplaint.remarks || ""}
                        placeholder="Enter remark..."
                        className="rounded-xl border-slate-200 flex-1"
                        id="remark-input"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const input = document.getElementById("remark-input") as HTMLInputElement;
                          handleUpdate(viewComplaint.id, { remarks: input.value });
                        }}
                        disabled={actionLoading}
                        className="rounded-full bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Resolved?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will close the complaint. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setResolveDialogOpen(false); setResolveComplaintId(null); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleResolve} className="bg-green-600 hover:bg-green-700 text-white">
              Resolve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
