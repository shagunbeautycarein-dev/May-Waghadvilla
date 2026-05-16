"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTableSkeleton } from "@/components/shared/data-table-skeleton";
import { formatDateTime } from "@/lib/formatters";
import { ShieldCheck, ChevronLeft, ChevronRight, Search } from "lucide-react";

type AuditLog = {
  id: string;
  adminId: string | null;
  adminName: string | null;
  action: string;
  entity: string;
  entityId: string;
  details: unknown;
  ipAddress: string | null;
  createdAt: string;
};

function formatDetails(details: unknown): string {
  if (!details) return "";
  if (typeof details === "string") return details;
  try {
    return JSON.stringify(details);
  } catch {
    return String(details);
  }
}

const ACTION_COLORS: Record<string, string> = {
  APPROVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REJECT: "bg-red-100 text-red-700 border-red-200",
  HOLD: "bg-amber-100 text-amber-700 border-amber-200",
  DEACTIVATE: "bg-orange-100 text-orange-700 border-orange-200",
  CREATE: "bg-blue-100 text-blue-700 border-blue-200",
  UPDATE: "bg-purple-100 text-purple-700 border-purple-200",
  DELETE: "bg-rose-100 text-rose-700 border-rose-200",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [searchId, setSearchId] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.append("action", actionFilter);
      if (entityFilter) params.append("entity", entityFilter);
      if (searchId) params.append("adminId", searchId);
      params.append("page", String(page));
      params.append("limit", String(limit));
      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [actionFilter, entityFilter, searchId, page, limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-1">Track all admin actions across the system</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Filter by admin ID..."
            value={searchId}
            onChange={(e) => { setSearchId(e.target.value); setPage(1); }}
            className="pl-9 rounded-xl border-slate-200"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
        >
          <option value="">All Actions</option>
          <option value="APPROVE">Approve</option>
          <option value="REJECT">Reject</option>
          <option value="HOLD">Hold</option>
          <option value="DEACTIVATE">Deactivate</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
        </select>
        <select
          value={entityFilter}
          onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
        >
          <option value="">All Entities</option>
          <option value="Guest">Guest</option>
          <option value="Expense">Expense</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100 bg-slate-50/50">
                <TableHead className="text-xs font-medium text-slate-500">Date</TableHead>
                <TableHead className="text-xs font-medium text-slate-500">Admin</TableHead>
                <TableHead className="text-xs font-medium text-slate-500">Action</TableHead>
                <TableHead className="text-xs font-medium text-slate-500">Entity</TableHead>
                <TableHead className="text-xs font-medium text-slate-500">Entity ID</TableHead>
                <TableHead className="text-xs font-medium text-slate-500">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-0">
                    <DataTableSkeleton columns={6} rows={5} showHeader={false} />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-0">
                    <EmptyState
                      icon={ShieldCheck}
                      title="No audit logs found"
                      subtitle="Actions performed by admins will appear here."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="border-slate-100 hover:bg-slate-50/50">
                    <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">
                      {log.adminName || "System"}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${ACTION_COLORS[log.action] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">{log.entity}</TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono max-w-[120px] truncate">
                      {log.entityId}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                      {log.details ? (
                        <span title={formatDetails(log.details)}>
                          {formatDetails(log.details)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="h-8 w-8 p-0 rounded-lg">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-slate-600">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-8 w-8 p-0 rounded-lg">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
