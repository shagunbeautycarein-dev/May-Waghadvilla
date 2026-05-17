"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  Trash2,
  CalendarDays,
  Save,
  ClipboardList,
} from "lucide-react";
import { formatDate } from "@/lib/formatters";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const PAYMENT_MODES = ["Cash", "UPI", "Bank Transfer", "Card"];

type Category = {
  id: string;
  name: string;
  color: string | null;
};

type ExpenseItem = {
  id: string;
  categoryId: string;
  amount: string;
  vendorName: string;
  paymentMode: string;
  description: string;
};

export default function DailyEntryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const [items, setItems] = useState<ExpenseItem[]>([
    { id: crypto.randomUUID(), categoryId: "", amount: "", vendorName: "", paymentMode: "", description: "" },
  ]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/expense-categories");
      if (res.ok) setCategories(await res.json());
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addRow = () => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), categoryId: "", amount: "", vendorName: "", paymentMode: "", description: "" },
    ]);
  };

  const removeRow = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateRow = (id: string, field: keyof ExpenseItem, value: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const totalAmount = items.reduce(
    (sum, i) => sum + (Number(i.amount) || 0),
    0
  );

  const handleSave = async () => {
    if (!date) {
      toast.error("Please select a date");
      return;
    }
    const validItems = items.filter((i) => i.categoryId && Number(i.amount) > 0);
    if (validItems.length === 0) {
      toast.error("Add at least one valid expense");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/expenses/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          items: validItems.map((i) => ({
            categoryId: i.categoryId,
            amount: Number(i.amount),
            vendorName: i.vendorName || null,
            paymentMode: i.paymentMode || null,
            description: i.description || null,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      const result = await res.json();
      toast.success(`Saved ${result.count} expense(s) for ${formatDate(date)}`);
      setItems([
        { id: crypto.randomUUID(), categoryId: "", amount: "", vendorName: "", paymentMode: "", description: "" },
      ]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save expenses");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Daily Expense Entry</h1>
          <p className="text-sm text-slate-500 mt-1">
            Enter multiple expenses for a single day in one go
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        {/* Date selector */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <Label className="text-sm font-medium text-slate-700">Date</Label>
          </div>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44 rounded-xl border-slate-200 text-sm"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <div className="w-full overflow-x-auto"><table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                <th className="text-left px-3 py-2 font-medium w-48">Category *</th>
                <th className="text-left px-3 py-2 font-medium w-32">Amount *</th>
                <th className="text-left px-3 py-2 font-medium w-40">Vendor</th>
                <th className="text-left px-3 py-2 font-medium w-36">Mode</th>
                <th className="text-left px-3 py-2 font-medium">Description</th>
                <th className="text-left px-3 py-2 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="px-3 py-2">
                    <select
                      value={item.categoryId}
                      onChange={(e) => updateRow(item.id, "categoryId", e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      disabled={loading}
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.amount}
                      onChange={(e) => updateRow(item.id, "amount", e.target.value)}
                      placeholder="0.00"
                      className="rounded-lg border-slate-200 h-8 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={item.vendorName}
                      onChange={(e) => updateRow(item.id, "vendorName", e.target.value)}
                      placeholder="Vendor"
                      className="rounded-lg border-slate-200 h-8 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={item.paymentMode}
                      onChange={(e) => updateRow(item.id, "paymentMode", e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    >
                      <option value="">Select</option>
                      {PAYMENT_MODES.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={item.description}
                      onChange={(e) => updateRow(item.id, "description", e.target.value)}
                      placeholder="Note"
                      className="rounded-lg border-slate-200 h-8 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    {items.length > 1 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => removeRow(item.id)}
                            className="text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Remove row</TooltipContent>
                      </Tooltip>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={addRow}
            className="rounded-full text-teal-600 border-teal-200 hover:bg-teal-50"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add Row
          </Button>
          <div className="flex items-center gap-4">
            <p className="text-sm text-slate-500">
              {items.filter((i) => i.categoryId && Number(i.amount) > 0).length} item(s)
            </p>
            <p className="text-sm font-bold text-slate-900">
              Total: Rs. {totalAmount.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-teal-600 hover:bg-teal-700 text-white"
          >
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            <Save className="mr-1.5 h-4 w-4" />
            Save All Expenses
          </Button>
        </div>
      </div>
    </div>
  );
}
