"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { calculateRentDifference, calculateTotalPayable } from "@/lib/rent-calculator";
import type { OnboardingFormData } from "@/types/onboarding";
import { ChevronDown, FileText, User, Users, Briefcase, Receipt, ShieldCheck, Home, BedDouble } from "lucide-react";

interface Props {
  data: OnboardingFormData;
  guest?: {
    name: string;
    monthlyRent: number | null;
    deposit: number | null;
    joiningDate: string | null;
    rentCycleDate: number | null;
    room?: { name: string } | null;
    bed?: { name: string } | null;
  };
  onSubmit: () => void;
  onBack: () => void;
}

function SummaryItem({ label, children, icon: Icon }: { label: string; children: React.ReactNode; icon: any }) {
  const [open, setOpen] = useState(false);
  return (
    <details className="group rounded-xl border border-slate-100 bg-white overflow-hidden" open={open}>
      <summary
        onClick={(e) => {
          e.preventDefault();
          setOpen(!open);
        }}
        className="flex items-center justify-between px-5 py-3.5 cursor-pointer list-none select-none"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-teal-600" />
          <span className="text-sm font-medium text-slate-900">{label}</span>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-5 pb-4 pt-0 text-sm text-slate-600 space-y-1 border-t border-slate-50">
        {children}
      </div>
    </details>
  );
}

export function Step9Review({ data, guest, onSubmit, onBack }: Props) {
  const [confirmed, setConfirmed] = useState(false);

  const monthlyRent = Number(guest?.monthlyRent) || 0;
  const deposit = Number(guest?.deposit) || 0;
  const joiningDate = guest?.joiningDate ? new Date(guest.joiningDate) : new Date();
  const rentCycleDate = Number(guest?.rentCycleDate) || 5;

  const rentCalc = calculateRentDifference(monthlyRent, joiningDate, rentCycleDate);
  const totalPayable = calculateTotalPayable(monthlyRent, deposit, rentCalc.differenceAmount);

  const docs = data.step4 || {};
  const hasNewDocs = !!(docs.aadhar || docs.pan || docs.photo);
  const docsComplete = !!(docs.aadhar && docs.pan && docs.photo);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        {(guest?.room?.name || guest?.bed?.name) && (
          <div className="rounded-xl border border-teal-100 bg-teal-50 p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
              <Home className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-teal-600 uppercase tracking-wide">Room Assignment</p>
              <p className="text-sm font-semibold text-teal-900">
                {guest?.room?.name && `Room ${guest.room.name}`}
                {guest?.room?.name && guest?.bed?.name && " · "}
                {guest?.bed?.name && `Bed ${guest.bed.name}`}
              </p>
            </div>
          </div>
        )}

        <SummaryItem label="Personal Details" icon={User}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pt-3">
            <p><span className="text-slate-400">Name:</span> {data.step1?.fullName || "-"}</p>
            <p><span className="text-slate-400">Mobile:</span> {data.step1?.mobile || "-"}</p>
            <p><span className="text-slate-400">Email:</span> {data.step1?.email || "-"}</p>
            <p><span className="text-slate-400">DOB:</span> {data.step1?.dob || "-"}</p>
            <p className="sm:col-span-2"><span className="text-slate-400">Address:</span> {data.step1?.address || "-"}, {data.step1?.city || "-"}</p>
          </div>
        </SummaryItem>

        <SummaryItem label={`Emergency Contacts (${data.step2?.contacts?.length || 0})`} icon={Users}>
          <div className="pt-3 space-y-1.5">
            {data.step2?.contacts?.map((c, i) => (
              <p key={i}>{c.name} ({c.relation}) — {c.mobile}</p>
            )) || <p>-</p>}
          </div>
        </SummaryItem>

        <SummaryItem label="Job Details" icon={Briefcase}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pt-3">
            <p><span className="text-slate-400">Company:</span> {data.step3?.companyName || "-"}</p>
            <p><span className="text-slate-400">Occupation:</span> {data.step3?.occupation || "-"}</p>
          </div>
        </SummaryItem>

        <SummaryItem label="Documents" icon={FileText}>
          <div className="pt-3 space-y-3">
            {!docsComplete && (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                <strong>Documents Required:</strong> Please upload Aadhar Card (Front & Back), PAN Card, and Passport Photo before submitting.
              </div>
            )}
            {hasNewDocs ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {docs.aadhar && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Aadhar (Front) ✓</p>
                    <img src={docs.aadhar} alt="Aadhar Front" className="h-20 object-contain rounded-lg border border-slate-100 bg-slate-50" />
                  </div>
                )}
                {docs.aadharBack && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Aadhar (Back) ✓</p>
                    <img src={docs.aadharBack} alt="Aadhar Back" className="h-20 object-contain rounded-lg border border-slate-100 bg-slate-50" />
                  </div>
                )}
                {docs.pan && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">PAN Card ✓</p>
                    <img src={docs.pan} alt="PAN" className="h-20 object-contain rounded-lg border border-slate-100 bg-slate-50" />
                  </div>
                )}
                {docs.photo && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Passport Photo ✓</p>
                    <img src={docs.photo} alt="Photo" className="h-20 object-contain rounded-lg border border-slate-100 bg-slate-50" />
                  </div>
                )}
              </div>
            ) : (
              <>
                <p><span className="text-slate-400">ID Type:</span> {docs.idType || "-"}</p>
                <p><span className="text-slate-400">Front:</span> {docs.idFrontUrl ? "Uploaded" : "-"}</p>
                <p><span className="text-slate-400">Back:</span> {docs.idBackUrl ? "Uploaded" : "-"}</p>
              </>
            )}
          </div>
        </SummaryItem>

        <SummaryItem label="Payment" icon={Receipt}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pt-3">
            <p><span className="text-slate-400">Method:</span> {data.step8?.method || "-"}</p>
            <p><span className="text-slate-400">Amount Paid:</span> ₹{data.step8?.amountPaid?.toLocaleString() || "0"}</p>
            <p><span className="text-slate-400">Total Payable:</span> ₹{totalPayable.toLocaleString()}</p>
            <p><span className="text-slate-400">Transaction ID:</span> {data.step8?.transactionId || "-"}</p>
          </div>
        </SummaryItem>
      </div>

      <div className="flex items-start gap-3 bg-white rounded-xl border border-slate-100 p-4">
        <Checkbox
          id="confirm"
          checked={confirmed}
          onCheckedChange={(v) => setConfirmed(v === true)}
          className="mt-0.5 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
        />
        <Label htmlFor="confirm" className="text-sm font-normal leading-snug text-slate-700 cursor-pointer">
          I confirm all information provided is true and accurate *
        </Label>
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
          onClick={onSubmit}
          className="flex-1 rounded-full bg-teal-600 hover:bg-teal-700 text-white h-11"
          disabled={!confirmed || !docsComplete}
        >
          <ShieldCheck className="mr-1.5 h-4 w-4" />
          Submit Onboarding
        </Button>
      </div>
    </div>
  );
}
