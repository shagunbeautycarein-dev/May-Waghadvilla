"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getGuestSession } from "@/lib/supabase/auth";
import { ArrowRightLeft, Loader2, Bed, Home } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTableSkeleton } from "@/components/shared/data-table-skeleton";
import { formatCurrency } from "@/lib/formatters";
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

type Room = {
  id: string;
  name: string;
  floor: { name: string };
  beds: Bed[];
};

type Bed = {
  id: string;
  name: string;
  rent: number;
  status: string;
};

type GuestData = {
  id: string;
  name: string;
  room?: { name: string };
  bed?: { name: string; rent: number };
};

export default function GuestTransferPage() {
  const [guest, setGuest] = useState<GuestData | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedBed, setSelectedBed] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [reason, setReason] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await getGuestSession();
      const email = sessionData.session?.user?.email;
      if (!email) return;

      const guestRes = await fetch(`/api/guest/profile?email=${encodeURIComponent(email)}`);
      if (guestRes.ok) {
        const g: GuestData = await guestRes.json();
        setGuest(g);
      }

      const roomsRes = await fetch("/api/public/rooms");
      if (roomsRes.ok) {
        const allRooms: Room[] = await roomsRes.json();
        setRooms(allRooms);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const availableBeds = selectedRoom
    ? rooms
        .find((r) => r.id === selectedRoom)
        ?.beds.filter((b) => b.status === "Available") || []
    : [];

  const selectedBedObj = availableBeds.find((b) => b.id === selectedBed);
  const currentRent = guest?.bed?.rent || 0;
  const newRent = selectedBedObj?.rent || 0;
  const rentDiff = newRent - currentRent;

  const handleSubmit = async () => {
    if (!selectedBed || !effectiveDate) {
      toast.error("Please select a bed and effective date");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/guest/bed-transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newBedId: selectedBed,
          effectiveDate,
          reason,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      toast.success("Transfer request submitted! Awaiting admin approval.");
      setSelectedRoom("");
      setSelectedBed("");
      setEffectiveDate("");
      setReason("");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to submit request";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="h-7 w-56 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="h-24 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-80 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-teal-600" />
          Room Transfer Request
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Request a change to a different room or bed
        </p>
      </div>

      {/* Current Room Card */}
      <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
        <p className="text-xs font-medium text-teal-700 mb-2">Current Assignment</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Home className="h-4 w-4 text-teal-600" />
            {guest?.room?.name || "Not assigned"}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Bed className="h-4 w-4 text-teal-600" />
            {guest?.bed?.name || "Not assigned"}
          </div>
        </div>
        <p className="text-xs text-teal-600 mt-1">
          Current Rent: {formatCurrency(currentRent)}/mo
        </p>
      </div>

      {rooms.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No rooms available"
          subtitle="There are no rooms available for transfer at the moment."
        />
      ) : (
        <>
          {/* Form */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Desired Room</Label>
              <select
                value={selectedRoom}
                onChange={(e) => {
                  setSelectedRoom(e.target.value);
                  setSelectedBed("");
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="">Select a room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} ({room.floor.name}) — {room.beds.filter((b) => b.status === "Available").length} beds available
                  </option>
                ))}
              </select>
            </div>

            {selectedRoom && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">Desired Bed</Label>
                <select
                  value={selectedBed}
                  onChange={(e) => setSelectedBed(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="">Select a bed</option>
                  {availableBeds.map((bed) => (
                    <option key={bed.id} value={bed.id}>
                      {bed.name} — {formatCurrency(bed.rent)}/mo
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedBedObj && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                {rentDiff > 0 ? (
                  <p className="text-sm text-amber-800">
                    Additional <span className="font-bold">{formatCurrency(rentDiff)}</span> will be charged monthly
                  </p>
                ) : rentDiff < 0 ? (
                  <p className="text-sm text-emerald-700">
                    <span className="font-bold">{formatCurrency(Math.abs(rentDiff))}</span> will be refunded monthly
                  </p>
                ) : (
                  <p className="text-sm text-slate-600">No rent difference</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Effective Date *</Label>
              <Input
                type="date"
                value={effectiveDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Reason (optional)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why do you want to transfer?"
                className="rounded-xl border-slate-200 min-h-[80px]"
              />
            </div>

            <Button
              onClick={() => setShowConfirm(true)}
              disabled={submitting || !selectedBed || !effectiveDate}
              className="w-full rounded-full bg-teal-600 hover:bg-teal-700 text-white"
            >
              {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Submit Transfer Request
            </Button>
          </div>
        </>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Transfer Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit this room transfer request? Once submitted, it will await admin approval.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowConfirm(false); handleSubmit(); }}>
              Submit Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
