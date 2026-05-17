"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  Trash2,
  Receipt,
  X,
  Filter,
  Repeat,
  ClipboardList,
  Tag,
  ChevronRight,
} from "lucide-react";
import { CloudinaryUpload } from "@/components/shared/cloudinary-upload";
import { formatCurrency } from "@/lib/formatters";
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

const PAYMENT_MODES = ["Cash", "UPI", "Bank Transfer", "Card"];

type Category = {
  id: string;
  name: string;
  color: string | null;
};

type Expense = {
  id: string;
  categoryId: string | null;
  category: string;
  amount: number;
  date: string;
  vendorName: string | null;
  paymentMode: string | null;
  description: string | null;
  isRecurring: boolean;
  billImage: string | null;
  expenseCategory: Category | null;
};

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(d, today)) return "Today";
  if (isSameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "short", day: "numeric" });
}

function groupByDate(expenses: Expense[]) {
  const groups: Record<string, Expense[]> = {};
  for (const e of expenses) {
    const key = e.date.split("T")[0];
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  }
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Filters
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterMode, setFilterMode] = useState("");

  // Form
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [description, setDescription] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [billImage, setBillImage] = useState("");

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/expense-categories");
      if (res.ok) setCategories(await res.json());
    } catch {
      // silent
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCategoryId) params.append("categoryId", filterCategoryId);
      if (filterFrom) params.append("from", filterFrom);
      if (filterTo) params.append("to", filterTo);
      if (filterMode) params.append("mode", filterMode);
      const res = await fetch(`/api/admin/expenses?${params.toString()}`);
      if (res.ok) setExpenses(await res.json());
    } catch {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [filterCategoryId, filterFrom, filterTo, filterMode]);

  useEffect(() => {
    fetchCategories();
    fetchExpenses();
  }, [fetchCategories, fetchExpenses]);

  const handleSave = async () => {
    if (!categoryId || !amount || !date) {
      toast.error("Category, amount, and date are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          amount: Number(amount),
          date,
          vendorName,
          paymentMode,
          description,
          isRecurring,
          billImage: billImage || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      toast.success(isRecurring ? "Expense added + next month scheduled" : "Expense added");
      setShowForm(false);
      resetForm();
      fetchExpenses();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/admin/expenses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Expense deleted");
      fetchExpenses();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const openDeleteDialog = (id: string) => {
    setDeleteExpenseId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteExpenseId) {
      handleDelete(deleteExpenseId);
      setDeleteDialogOpen(false);
      setDeleteExpenseId(null);
    }
  };

  const resetForm = () => {
    setCategoryId("");
    setAmount("");
    setDate("");
    setVendorName("");
    setPaymentMode("");
    setDescription("");
    setIsRecurring(false);
    setBillImage("");
  };

  const totalAmount = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const grouped = useMemo(() => groupByDate(expenses), [expenses]);

  const categoryMap = useMemo(() => {
    const map: Record<string, Category> = {};
    for (const c of categories) map[c.id] = c;
    return map;
  }, [categories]);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expense Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track and manage all property expenses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/accounting/daily-entry">
            <Button variant="outline" size="sm" className="rounded-full">
              <ClipboardList className="mr-1.5 h-4 w-4" /> Daily Entry
            </Button>
          </Link>
          <Link href="/admin/accounting/categories">
            <Button variant="outline" size="sm" className="rounded-full">
              <Tag className="mr-1.5 h-4 w-4" /> Categories
            </Button>
          </Link>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="rounded-full bg-teal-600 hover:bg-teal-700 text-white"
          >
            {showForm ? (
              <>
                <X className="mr-1.5 h-4 w-4" /> Cancel
              </>
            ) : (
              <>
                <Plus className="mr-1.5 h-4 w-4" /> Add Expense
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-2xl">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">New Expense</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Category *</Label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Amount (Rs.) *</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Payment Mode</Label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="">Select mode</option>
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Vendor Name</Label>
              <Input
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="rounded-xl border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Bill / Receipt</Label>
              <CloudinaryUpload
                images={billImage ? [billImage] : []}
                onChange={(urls) => setBillImage(urls[0] || "")}
                maxFiles={1}
                folder="waghad-villa/expenses"
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label className="text-xs font-medium text-slate-600">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl border-slate-200 min-h-[80px]"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="recurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <Label htmlFor="recurring" className="text-sm text-slate-700 flex items-center gap-1.5">
                <Repeat className="h-3.5 w-3.5" />
                Is Recurring (auto-create next month)
              </Label>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-teal-600 hover:bg-teal-700 text-white"
            >
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Save Expense
            </Button>
            <Button variant="outline" onClick={resetForm} className="rounded-full">
              Reset
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-slate-100 p-3">
        <Filter className="h-4 w-4 text-slate-400" />
        <select
          value={filterCategoryId}
          onChange={(e) => setFilterCategoryId(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <Input
          type="date"
          value={filterFrom}
          onChange={(e) => setFilterFrom(e.target.value)}
          className="w-40 rounded-lg border-slate-200 text-sm"
          placeholder="From"
        />
        <Input
          type="date"
          value={filterTo}
          onChange={(e) => setFilterTo(e.target.value)}
          className="w-40 rounded-lg border-slate-200 text-sm"
          placeholder="To"
        />
        <select
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white"
        >
          <option value="">All Modes</option>
          {PAYMENT_MODES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {expenses.length} expense{expenses.length !== 1 ? "s" : ""} found
        </p>
        <p className="text-sm font-semibold text-slate-900">
          Total: {formatCurrency(Math.round(totalAmount))}
        </p>
      </div>

      {/* Grouped Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <DataTableSkeleton columns={7} />
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses found"
            subtitle="Expenses will appear here once you add them."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {grouped.map(([dateKey, dayExpenses]) => (
              <div key={dateKey}>
                <div className="bg-slate-50 px-4 py-2 flex items-center gap-2">
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    {formatDateLabel(dateKey)}
                  </span>
                  <span className="text-xs text-slate-400 ml-2">
                    ({dayExpenses.length})
                  </span>
                  <span className="ml-auto text-xs font-bold text-slate-700">
                    {formatCurrency(dayExpenses.reduce((s, e) => s + Number(e.amount), 0))}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-slate-50">
                      {dayExpenses.map((e) => {
                        const cat = e.expenseCategory || categoryMap[e.categoryId || ""];
                        return (
                          <tr key={e.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 w-40">
                              <span
                                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white"
                                style={{ backgroundColor: cat?.color || "#64748b" }}
                              >
                                {cat?.name || e.category || "Unknown"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-slate-900 w-28">
                              {formatCurrency(e.amount)}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500 w-32">
                              {e.vendorName || "ï¿½"}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500 w-24">
                              {e.paymentMode || "ï¿½"}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">
                              {e.description || "ï¿½"}
                            </td>
                            <td className="px-4 py-3 text-xs w-20">
                              {e.isRecurring ? (
                                <span className="inline-flex items-center gap-1 text-teal-600">
                                  <Repeat className="h-3 w-3" /> Yes
                                </span>
                              ) : (
                                <span className="text-slate-400">ï¿½</span>
                              )}
                            </td>
                            <td className="px-4 py-3 w-10">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => openDeleteDialog(e.id)}
                                    className="text-slate-400 hover:text-red-600 transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>Delete expense</TooltipContent>
                              </Tooltip>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The expense will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteDialogOpen(false); setDeleteExpenseId(null); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
