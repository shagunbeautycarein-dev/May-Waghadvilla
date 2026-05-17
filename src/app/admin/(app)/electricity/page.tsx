"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Zap,
  Plus,
  Loader2,
  Receipt,
  IndianRupee,
  Bed,
  CheckCircle,
  AlertTriangle,
  Eye,
  Calendar,
  Home,
} from "lucide-react";

type Room = {
  id: string;
  name: string;
  floor: { name: string };
  beds: Bed[];
};

type Bed = {
  id: string;
  name: string;
  status: string;
  currentGuest: { id: string; name: string; mobile: string } | null;
};

type Bill = {
  id: string;
  roomId: string;
  month: number;
  year: number;
  totalAmount: number;
  prevReading: number | null;
  currReading: number | null;
  unitRate: number | null;
  billImage: string | null;
  createdAt: string;
  room: Room;
  splits: Split[];
  totalCollected: number;
  totalPending: number;
  bedsCharged: number;
};

type Split = {
  id: string;
  bedId: string;
  guestId: string | null;
  amount: number;
  status: string;
  bed: Bed;
  guest: { name: string } | null;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function ElectricityPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewBill, setViewBill] = useState<Bill | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [totalAmount, setTotalAmount] = useState("");
  const [prevReading, setPrevReading] = useState("");
  const [currReading, setCurrReading] = useState("");
  const [unitRate, setUnitRate] = useState("");
  const [billImage, setBillImage] = useState("");
  const [splits, setSplits] = useState<Record<string, { chargeable: boolean; amount: string; guestId?: string }>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [billsRes, roomsRes] = await Promise.all([
        fetch("/api/admin/electricity"),
        fetch("/api/admin/electricity/rooms"),
      ]);
      if (billsRes.ok) setBills(await billsRes.json());
      if (roomsRes.ok) setRooms(await roomsRes.json());
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === selectedRoomId),
    [rooms, selectedRoomId]
  );

  const splitTotal = useMemo(() => {
    return Object.values(splits)
      .filter((s) => s.chargeable)
      .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  }, [splits]);

  const difference = useMemo(() => {
    return Math.abs(splitTotal - Number(totalAmount || 0));
  }, [splitTotal, totalAmount]);

  const handleRoomChange = (roomId: string) => {
    setSelectedRoomId(roomId);
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
      const newSplits: Record<string, { chargeable: boolean; amount: string; guestId?: string }> = {};
      room.beds.forEach((bed) => {
        const hasGuest = !!bed.currentGuest;
        newSplits[bed.id] = {
          chargeable: hasGuest,
          amount: "",
          guestId: bed.currentGuest?.id,
        };
      });
      setSplits(newSplits);
    } else {
      setSplits({});
    }
  };

  const handleAutoSplit = () => {
    const total = Number(totalAmount);
    if (!total || !selectedRoom) return;
    const chargeableBeds = selectedRoom.beds.filter(
      (b) => splits[b.id]?.chargeable && b.currentGuest
    );
    if (chargeableBeds.length === 0) return;
    const perBed = Math.floor(total / chargeableBeds.length);
    const remainder = total - perBed * chargeableBeds.length;

    const newSplits = { ...splits };
    chargeableBeds.forEach((bed, i) => {
      newSplits[bed.id] = {
        ...newSplits[bed.id],
        amount: String(perBed + (i === 0 ? remainder : 0)),
      };
    });
    setSplits(newSplits);
  };

  const handleSave = async () => {
    if (!selectedRoomId || !totalAmount) {
      toast.error("Please fill required fields");
      return;
    }

    const chargeableSplits = Object.entries(splits)
      .filter(([, s]) => s.chargeable)
      .map(([bedId, s]) => ({
        bedId,
        guestId: s.guestId,
        amount: Number(s.amount),
        chargeable: true,
      }));

    if (chargeableSplits.length === 0) {
      toast.error("Select at least one chargeable bed");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/electricity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: selectedRoomId,
          month,
          year,
          totalAmount: Number(totalAmount),
          prevReading: prevReading ? Number(prevReading) : null,
          currReading: currReading ? Number(currReading) : null,
          unitRate: unitRate ? Number(unitRate) : null,
          billImage: billImage || null,
          splits: chargeableSplits,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      if (data.warning) toast.warning(data.warning);
      else toast.success("Electricity bill saved");

      setShowForm(false);
      resetForm();
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedRoomId("");
    setMonth(new Date().getMonth() + 1);
    setYear(new Date().getFullYear());
    setTotalAmount("");
    setPrevReading("");
    setCurrReading("");
    setUnitRate("");
    setBillImage("");
    setSplits({});
  };

  const stats = useMemo(() => {
    const totalBills = bills.length;
    const totalCollected = bills.reduce((s, b) => s + b.totalCollected, 0);
    const totalPending = bills.reduce((s, b) => s + b.totalPending, 0);
    const thisMonth = bills.filter(
      (b) => b.month === new Date().getMonth() + 1 && b.year === new Date().getFullYear()
    ).length;
    return { totalBills, totalCollected, totalPending, thisMonth };
  }, [bills]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900">Electricity Bills</h1>
          <p className="text-sm text-slate-500 mt-1">Manage room electricity bills and bed-wise splits</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="rounded-full bg-teal-600 hover:bg-teal-700 text-white h-10 px-5"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Bill
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Bills", value: stats.totalBills, icon: Receipt, color: "bg-blue-50 text-blue-600" },
          { label: "Collected", value: `₹${stats.totalCollected.toLocaleString()}`, icon: IndianRupee, color: "bg-green-50 text-green-600" },
          { label: "Pending", value: `₹${stats.totalPending.toLocaleString()}`, icon: AlertTriangle, color: "bg-amber-50 text-amber-600" },
          { label: "This Month", value: stats.thisMonth, icon: Calendar, color: "bg-purple-50 text-purple-600" },
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

      {/* Bills Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 md:px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">All Bills</h2>
        </div>
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-6 w-6 text-slate-400 animate-spin mx-auto" />
          </div>
        ) : bills.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No electricity bills yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="w-full overflow-x-auto"><table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <th className="text-left px-4 py-3 font-medium">Month</th>
                  <th className="text-left px-4 py-3 font-medium">Room</th>
                  <th className="text-right px-4 py-3 font-medium">Total Bill</th>
                  <th className="text-right px-4 py-3 font-medium">Collected</th>
                  <th className="text-right px-4 py-3 font-medium">Pending</th>
                  <th className="text-center px-4 py-3 font-medium">Beds</th>
                  <th className="text-left px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-medium text-slate-900">
                        {MONTHS[bill.month - 1]} {bill.year}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-slate-700">{bill.room.name}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      ₹{bill.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600">
                      ₹{bill.totalCollected.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-600">
                      ₹{bill.totalPending.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-700">
                        {bill.bedsCharged}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setViewBill(bill)}
                        className="h-8 rounded-full text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        )}
      </div>

      {/* Add Bill Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Add Electricity Bill
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Room & Month */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">Room *</Label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => handleRoomChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                >
                  <option value="">Select room</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.floor.name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">Month *</Label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                >
                  {MONTHS.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">Year *</Label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="rounded-xl border-slate-200"
                />
              </div>
            </div>

            {/* Amount & Readings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">Total Bill Amount (₹) *</Label>
                <Input
                  type="number"
                  min={0}
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="e.g. 1500"
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">Bill Image URL</Label>
                <Input
                  value={billImage}
                  onChange={(e) => setBillImage(e.target.value)}
                  placeholder="Paste image URL"
                  className="rounded-xl border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">Prev Reading (kWh)</Label>
                <Input
                  type="number"
                  value={prevReading}
                  onChange={(e) => setPrevReading(e.target.value)}
                  placeholder="Optional"
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">Curr Reading (kWh)</Label>
                <Input
                  type="number"
                  value={currReading}
                  onChange={(e) => setCurrReading(e.target.value)}
                  placeholder="Optional"
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">Unit Rate (₹/kWh)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={unitRate}
                  onChange={(e) => setUnitRate(e.target.value)}
                  placeholder="Optional"
                  className="rounded-xl border-slate-200"
                />
              </div>
            </div>

            {/* Bed Splits */}
            {selectedRoom && (
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Bed className="h-4 w-4 text-teal-600" />
                    Split to Beds
                  </h4>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAutoSplit}
                    className="rounded-full text-xs h-8 border-slate-200"
                  >
                    Auto-Split
                  </Button>
                </div>
                <div className="divide-y divide-slate-100">
                  {selectedRoom.beds.map((bed) => {
                    const split = splits[bed.id] || { chargeable: false, amount: "" };
                    const hasGuest = !!bed.currentGuest;
                    return (
                      <div key={bed.id} className="px-4 py-3 flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={split.chargeable}
                          onChange={(e) =>
                            setSplits((prev) => ({
                              ...prev,
                              [bed.id]: {
                                ...prev[bed.id],
                                chargeable: e.target.checked,
                              },
                            }))
                          }
                          disabled={!hasGuest}
                          className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">
                            {bed.name}
                            {!hasGuest && (
                              <span className="ml-2 text-[10px] text-slate-400">(Empty)</span>
                            )}
                          </p>
                          {bed.currentGuest && (
                            <p className="text-xs text-slate-500 truncate">
                              {bed.currentGuest.name} · {bed.currentGuest.mobile}
                            </p>
                          )}
                        </div>
                        <Input
                          type="number"
                          min={0}
                          value={split.amount}
                          onChange={(e) =>
                            setSplits((prev) => ({
                              ...prev,
                              [bed.id]: {
                                ...prev[bed.id],
                                amount: e.target.value,
                              },
                            }))
                          }
                          disabled={!split.chargeable}
                          placeholder="₹"
                          className="w-28 rounded-xl border-slate-200 text-right"
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Split validation */}
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-slate-500">
                        Split Total: <span className="font-medium text-slate-900">₹{splitTotal.toLocaleString()}</span>
                      </span>
                      <span className="text-slate-500">
                        Bill Total: <span className="font-medium text-slate-900">₹{Number(totalAmount || 0).toLocaleString()}</span>
                      </span>
                    </div>
                    {difference > 1 && totalAmount && (
                      <span className="text-amber-600 flex items-center gap-1 text-xs">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        ₹{difference} unallocated
                      </span>
                    )}
                    {difference <= 1 && totalAmount && splitTotal > 0 && (
                      <span className="text-teal-600 flex items-center gap-1 text-xs">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Balanced
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => { setShowForm(false); resetForm(); }}
                className="flex-1 rounded-full h-11 border-slate-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-full bg-teal-600 hover:bg-teal-700 text-white h-11"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Bill"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Bill Dialog */}
      <Dialog open={!!viewBill} onOpenChange={() => setViewBill(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">
              {viewBill ? `${MONTHS[viewBill.month - 1]} ${viewBill.year} — ${viewBill.room.name}` : "Bill Details"}
            </DialogTitle>
          </DialogHeader>
          {viewBill && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Bill</span>
                  <span className="font-medium text-slate-900">₹{viewBill.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Collected</span>
                  <span className="font-medium text-green-600">₹{viewBill.totalCollected.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Pending</span>
                  <span className="font-medium text-amber-600">₹{viewBill.totalPending.toLocaleString()}</span>
                </div>
                {viewBill.prevReading && viewBill.currReading && (
                  <>
                    <div className="border-t border-slate-200 pt-2 flex justify-between text-sm">
                      <span className="text-slate-500">Units</span>
                      <span className="font-medium text-slate-900">{viewBill.currReading - viewBill.prevReading} kWh</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Unit Rate</span>
                      <span className="font-medium text-slate-900">₹{viewBill.unitRate}/kWh</span>
                    </div>
                  </>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Bed-wise Split</h4>
                <div className="space-y-2">
                  {viewBill.splits.map((split) => (
                    <div
                      key={split.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-100 bg-white"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {split.bed.name}
                          {split.guest && (
                            <span className="ml-1 text-xs text-slate-500">
                              ({split.guest.name})
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-medium text-slate-900">
                          ₹{split.amount.toLocaleString()}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            split.status === "Paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {split.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {viewBill.billImage && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Bill Image</h4>
                  <img
                    src={viewBill.billImage}
                    alt="Electricity Bill"
                    className="w-full max-h-64 object-contain rounded-xl border border-slate-100"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
