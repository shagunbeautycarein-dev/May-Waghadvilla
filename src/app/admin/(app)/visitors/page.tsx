"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Users,
  LogIn,
  LogOut,
  Clock,
  CheckCircle,
  Home,
  Filter,
} from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTableSkeleton } from "@/components/shared/data-table-skeleton";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

type Visitor = {
  id: string;
  visitorName: string;
  mobile: string | null;
  relation: string | null;
  visitDate: string;
  entryTime: string | null;
  exitTime: string | null;
  status: string;
  guest: {
    name: string;
    room?: { name: string };
    bed?: { name: string };
  };
};

export default function AdminVisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDate) params.append("date", filterDate);
      if (filterRoom) params.append("room", filterRoom);
      if (filterStatus) params.append("status", filterStatus);
      const res = await fetch(`/api/admin/visitors?${params.toString()}`);
      if (res.ok) setVisitors(await res.json());
    } catch {
      toast.error("Failed to load visitors");
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterRoom, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (id: string, status: string) => {
    setActionId(id);
    try {
      const body: Record<string, unknown> = { id, status };
      if (status === "checked_in") {
        body.entryTime = new Date().toISOString();
      } else if (status === "checked_out") {
        body.exitTime = new Date().toISOString();
      }
      const res = await fetch("/api/admin/visitors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Visitor ${status.replace("_", " ")}`);
      fetchData();
    } catch {
      toast.error("Failed to update");
    } finally {
      setActionId(null);
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      expected: "bg-amber-100 text-amber-700",
      checked_in: "bg-emerald-100 text-emerald-700",
      checked_out: "bg-slate-100 text-slate-600",
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${styles[status] || "bg-slate-100 text-slate-600"}`}>
        {status.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Visitor Log</h1>
        <p className="text-sm text-slate-500 mt-1">
          Track guest visitors — check-in and check-out
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-slate-100 p-3">
        <Filter className="h-4 w-4 text-slate-400" />
        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-40 rounded-lg border-slate-200 text-sm"
        />
        <Input
          type="text"
          placeholder="Room name"
          value={filterRoom}
          onChange={(e) => setFilterRoom(e.target.value)}
          className="w-40 rounded-lg border-slate-200 text-sm"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white"
        >
          <option value="">All Status</option>
          <option value="expected">Expected</option>
          <option value="checked_in">Checked In</option>
          <option value="checked_out">Checked Out</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <DataTableSkeleton columns={10} />
        ) : visitors.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No visitor logs"
            subtitle="Visitor entries will appear here once guests register visitors."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Guest</th>
                  <th className="text-left px-4 py-3 font-medium">Room</th>
                  <th className="text-left px-4 py-3 font-medium">Visitor</th>
                  <th className="text-left px-4 py-3 font-medium">Mobile</th>
                  <th className="text-left px-4 py-3 font-medium">Relation</th>
                  <th className="text-left px-4 py-3 font-medium">Entry</th>
                  <th className="text-left px-4 py-3 font-medium">Exit</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visitors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(v.visitDate)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {v.guest?.name}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {v.guest?.room?.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {v.visitorName}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {v.mobile || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {v.relation || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {v.entryTime
                        ? new Date(v.entryTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {v.exitTime
                        ? new Date(v.exitTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">{statusBadge(v.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {v.status === "expected" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleAction(v.id, "checked_in")}
                                disabled={actionId === v.id}
                                className="text-emerald-600 hover:text-emerald-700"
                              >
                                <LogIn className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Check In</TooltipContent>
                          </Tooltip>
                        )}
                        {v.status === "checked_in" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleAction(v.id, "checked_out")}
                                disabled={actionId === v.id}
                                className="text-slate-500 hover:text-slate-700"
                              >
                                <LogOut className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Check Out</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
