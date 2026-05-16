"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Download,
  Loader2,
  Calendar,
  TrendingUp,
  Receipt,
  BookOpen,
  Home,
  AlertTriangle,
  Zap,
} from "lucide-react";

const REPORTS = [
  { key: "income", label: "Monthly Income", icon: TrendingUp, desc: "All income sources by month" },
  { key: "expense", label: "Expense Report", icon: Receipt, desc: "All expenses by category" },
  { key: "ledger", label: "Guest Ledger", icon: BookOpen, desc: "Full transaction history per guest" },
  { key: "occupancy", label: "Occupancy Report", icon: Home, desc: "Room-wise and bed-wise occupancy %" },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState("income");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (format: "pdf" | "excel") => {
    setExporting(`${selectedReport}-${format}`);
    try {
      const res = await fetch(
        `/api/admin/reports/export?type=${format}&report=${selectedReport}&month=${month}&year=${year}`
      );
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedReport}-report-${month}-${year}.${format === "pdf" ? "pdf" : "xlsx"}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Export failed");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports & Export</h1>
        <p className="text-sm text-slate-500 mt-1">
          Generate and download reports
        </p>
      </div>

      {/* Report Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {REPORTS.map((r) => {
          const Icon = r.icon;
          const isActive = selectedReport === r.key;
          return (
            <button
              key={r.key}
              onClick={() => setSelectedReport(r.key)}
              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                isActive
                  ? "border-teal-200 bg-teal-50"
                  : "border-slate-100 bg-white hover:border-slate-200"
              }`}
            >
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isActive ? "bg-teal-100 text-teal-600" : "bg-slate-50 text-slate-400"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className={`text-sm font-semibold ${isActive ? "text-teal-800" : "text-slate-900"}`}>
                  {r.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-slate-100 p-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">Period:</span>
        </div>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2024, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>
        <Input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="w-24 rounded-lg border-slate-200 text-sm"
          min={2020}
          max={2030}
        />
      </div>

      {/* Export Actions */}
      <div className="flex gap-3">
        <Button
          onClick={() => handleExport("pdf")}
          disabled={!!exporting}
          variant="outline"
          className="rounded-full"
        >
          {exporting === `${selectedReport}-pdf` ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-1.5 h-4 w-4" />
          )}
          Export as PDF
        </Button>
        <Button
          onClick={() => handleExport("excel")}
          disabled={!!exporting}
          variant="outline"
          className="rounded-full"
        >
          {exporting === `${selectedReport}-excel` ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-1.5 h-4 w-4" />
          )}
          Export as Excel
        </Button>
      </div>

      {/* Preview Note */}
      <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
        <p className="text-sm text-slate-600">
          <span className="font-medium">Selected:</span> {REPORTS.find((r) => r.key === selectedReport)?.label} for{" "}
          {new Date(year, month - 1).toLocaleString("default", { month: "long", year: "numeric" })}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Click an export button above to download the report.
        </p>
      </div>
    </div>
  );
}
