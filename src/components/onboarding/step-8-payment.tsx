"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculateRentDifference, calculateTotalPayable } from "@/lib/rent-calculator";
import type { Step8Payment } from "@/types/onboarding";
import { CreditCard, Receipt, Home, BedDouble } from "lucide-react";
import { CloudinaryUpload } from "@/components/shared/cloudinary-upload";
import { toast } from "sonner";

interface Props {
  data?: Step8Payment;
  guest?: {
    monthlyRent: number | null;
    deposit: number | null;
    joiningDate: string | null;
    rentCycleDate: number | null;
    room?: { name: string } | null;
    bed?: { name: string } | null;
  };
  onNext: (data: Step8Payment) => void;
  onBack: () => void;
}

export function Step8Payment({ data, guest, onNext, onBack }: Props) {
  const monthlyRent = Number(guest?.monthlyRent) || 0;
  const deposit = Number(guest?.deposit) || 0;
  const joiningDate = guest?.joiningDate ? new Date(guest.joiningDate) : new Date();
  const rentCycleDate = Number(guest?.rentCycleDate) || 5;

  const rentCalc = useMemo(() => {
    return calculateRentDifference(monthlyRent, joiningDate, rentCycleDate);
  }, [monthlyRent, joiningDate, rentCycleDate]);

  const totalPayable = useMemo(() => {
    return calculateTotalPayable(monthlyRent, deposit, rentCalc.differenceAmount);
  }, [monthlyRent, deposit, rentCalc.differenceAmount]);

  const [formData, setFormData] = useState<Step8Payment>(
    data || {
      method: "",
      amountPaid: 0,
      transactionId: "",
      proofUrl: "",
    }
  );


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Room & Rent Summary Card */}
      <div className="bg-slate-50 rounded-xl border border-slate-100 p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Receipt className="h-4 w-4 text-teal-600" />
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Payment Summary</p>
        </div>

        {/* Room / Bed Info */}
        {(guest?.room?.name || guest?.bed?.name) && (
          <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
            {guest?.room?.name && (
              <div className="flex items-center gap-1.5 text-sm text-slate-700">
                <Home className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium">Room {guest.room.name}</span>
              </div>
            )}
            {guest?.bed?.name && (
              <div className="flex items-center gap-1.5 text-sm text-slate-700">
                <BedDouble className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium">Bed {guest.bed.name}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Monthly Rent</span>
          <span className="font-medium text-slate-900">â‚¹{monthlyRent.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Security Deposit</span>
          <span className="font-medium text-slate-900">â‚¹{deposit.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">
            Rent Difference ({rentCalc.differenceDays} days)
          </span>
          <span className="font-medium text-slate-900">
            â‚¹{rentCalc.differenceAmount.toLocaleString()}
          </span>
        </div>
        <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-semibold">
          <span className="text-slate-900">Total Payable</span>
          <span className="text-teal-700">â‚¹{totalPayable.toLocaleString()}</span>
        </div>
      </div>

      {/* UPI Info */}
      <div className="bg-teal-50 rounded-xl border border-teal-100 p-4 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
          <CreditCard className="h-4 w-4 text-teal-600" />
        </div>
        <div>
          <p className="text-xs font-medium text-teal-700">UPI ID</p>
          <p className="text-sm font-semibold text-teal-900 font-mono">theWaghadvilla@upi</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-slate-600">Payment Method *</Label>
        <Select
          value={formData.method}
          onValueChange={(v) => setFormData({ ...formData, method: v })}
          required
        >
          <SelectTrigger className="rounded-xl border-slate-200">
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            {["UPI", "Cash", "Bank Transfer"].map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-slate-600">Amount Paid (â‚¹) *</Label>
        <Input
          type="number"
          min={0}
          value={formData.amountPaid}
          onChange={(e) =>
            setFormData({ ...formData, amountPaid: Number(e.target.value) })
          }
          required
          className="rounded-xl border-slate-200 focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-slate-600">Transaction ID</Label>
        <Input
          value={formData.transactionId}
          onChange={(e) =>
            setFormData({ ...formData, transactionId: e.target.value })
          }
          placeholder="Optional"
          className="rounded-xl border-slate-200 focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-slate-600">Payment Proof (Screenshot / Receipt) *</Label>
        <CloudinaryUpload
          images={formData.proofUrl ? [formData.proofUrl] : []}
          onChange={(urls) => setFormData((prev) => ({ ...prev, proofUrl: urls[0] || "" }))}
          maxFiles={1}
          folder="waghad-villa/payments"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1 rounded-full h-11 border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          Previous
        </Button>
        <Button
          type="submit"
          className="flex-1 rounded-full bg-teal-600 hover:bg-teal-700 text-white h-11"
        >
          Continue
        </Button>
      </div>
    </form>
  );
}
