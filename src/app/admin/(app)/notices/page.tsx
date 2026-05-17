"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Bell,
  Plus,
  Loader2,
  Trash2,
  Eye,
  Users,
  Home,
  Building,
  Globe,
  Calendar,
  Clock,
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
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

const TYPES = ["General", "Floor-wise", "Room-wise", "Guest-wise"];

type Notice = {
  id: string;
  title: string;
  message: string;
  type: string;
  targetId: string | null;
  sendDate: string;
  expiryDate: string | null;
  createdAt: string;
  status: string;
  _count: { reads: number };
};

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteNoticeId, setDeleteNoticeId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("General");
  const [sendDate, setSendDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notices");
      if (res.ok) setNotices(await res.json());
    } catch {
      toast.error("Failed to load notices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    if (!title || !message) {
      toast.error("Title and message are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, type, sendDate, expiryDate }),
      });
      if (!res.ok) throw new Error("Failed to create");
      toast.success("Notice sent");
      setShowForm(false);
      resetForm();
      fetchData();
    } catch {
      toast.error("Failed to send notice");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/admin/notices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Notice deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const openDeleteDialog = (id: string) => {
    setDeleteNoticeId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteNoticeId) {
      handleDelete(deleteNoticeId);
      setDeleteDialogOpen(false);
      setDeleteNoticeId(null);
    }
  };

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setType("General");
    setSendDate("");
    setExpiryDate("");
  };

  const typeIcon = (t: string) => {
    switch (t) {
      case "General": return Globe;
      case "Floor-wise": return Building;
      case "Room-wise": return Home;
      case "Guest-wise": return Users;
      default: return Bell;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900">Notices</h1>
          <p className="text-sm text-slate-500 mt-1">Send announcements to guests</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="rounded-full bg-teal-600 hover:bg-teal-700 text-white h-10 px-5"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New Notice
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <DataTableSkeleton columns={6} />
        ) : notices.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notices yet"
            subtitle="Notices will appear here once you send them."
          />
        ) : (
          <div className="overflow-x-auto">
            <div className="w-full overflow-x-auto"><table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Title</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Reads</th>
                  <th className="text-left px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notices.map((n) => {
                  const Icon = typeIcon(n.type);
                  return (
                    <tr key={n.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                        {formatDate(n.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">{n.title}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                          <Icon className="h-3.5 w-3.5" />
                          {n.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          n.status === "Active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"
                        }`}>
                          {n.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {n._count.reads}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toast.info(n.message)}
                                className="h-8 rounded-full text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View message</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openDeleteDialog(n.id)}
                                className="h-8 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete notice</TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The notice will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteDialogOpen(false); setDeleteNoticeId(null); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Notice Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">New Notice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter notice title"
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">Message *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter notice message..."
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">Type</label>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                      type === t
                        ? "bg-teal-50 border-teal-200 text-teal-700"
                        : "bg-white border-slate-200 text-slate-500"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">Send Date</label>
                <Input
                  type="date"
                  value={sendDate}
                  onChange={(e) => setSendDate(e.target.value)}
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">Expiry Date</label>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="rounded-xl border-slate-200"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-full h-11 border-slate-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-full bg-teal-600 hover:bg-teal-700 text-white h-11"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Notice"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
