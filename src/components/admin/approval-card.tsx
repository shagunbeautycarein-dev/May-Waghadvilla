"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Check,
  X,
  Pause,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  User,
  Users,
  Briefcase,
  Receipt,
  ShieldCheck,
  Copy,
  Phone,
  Mail,
  Bed,
  Home,
  Calendar,
  IndianRupee,
  Wallet,
} from "lucide-react";
import { ONBOARDING_STATUS_COLORS } from "@/lib/constants";
import { calculateRentDifference } from "@/lib/rent-calculator";
import { toast } from "sonner";

interface ApprovalCardProps {
  data: {
    id: string;
    status: string;
    step1Personal?: Record<string, string> | null;
    step2Emergency?: { contacts?: Array<Record<string, string>> } | null;
    step3Job?: Record<string, string> | null;
    step4Documents?: Record<string, string> | null;
    step5RulesAgreed?: boolean;
    step6TermsAgreed?: boolean;
    step7LeavingAgreed?: boolean;
    step8Payment?: Record<string, unknown> | null;
    rejectionReason?: string | null;
    holdReason?: string | null;
    guest: {
      id: string;
      name: string;
      mobile: string;
      email: string | null;
      room?: { name: string } | null;
      bed?: { name: string } | null;
      joiningDate: Date | string | null;
      monthlyRent: unknown;
      deposit: unknown;
      rentCycleDate: number | null;
    };
  };
  type: string;
  onAction?: () => void;
}

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const YEARS = Array.from({ length: 5 }, (_, i) => {
  const y = new Date().getFullYear() - 2 + i;
  return { value: y, label: String(y) };
});

export function ApprovalCard({ data, type, onAction }: ApprovalCardProps) {
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [reason, setReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [dialogAction, setDialogAction] = useState<
    "reject" | "hold" | null
  >(null);

  // Payment split dialog state
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [rentDiffAmount, setRentDiffAmount] = useState("");
  const [advanceRentAmount, setAdvanceRentAmount] = useState("");
  const [advanceRentMonth, setAdvanceRentMonth] = useState<string>("");
  const [advanceRentYear, setAdvanceRentYear] = useState<string>(String(new Date().getFullYear()));
  const [splitError, setSplitError] = useState("");

  const s1 = (data.step1Personal || {}) as Record<string, string>;
  const s2 = (data.step2Emergency || {}) as { contacts?: Array<Record<string, string>> };
  const s3 = (data.step3Job || {}) as Record<string, string>;
  const s4 = (data.step4Documents || {}) as Record<string, string>;
  const s8 = (data.step8Payment || {}) as Record<string, string | number | boolean>;

  const checklist = [
    { label: "Personal", ok: !!data.step1Personal },
    { label: "Emergency", ok: !!data.step2Emergency?.contacts?.length },
    { label: "Job", ok: !!data.step3Job },
    { label: "Documents", ok: !!s4.aadhar || !!s4.pan || !!s4.photo || !!s4.idType },
    { label: "Rules", ok: data.step5RulesAgreed },
    { label: "Terms", ok: data.step6TermsAgreed },
    { label: "Leaving", ok: data.step7LeavingAgreed },
    { label: "Payment", ok: !!s8.method },
  ];

  const completedCount = checklist.filter((c) => c.ok).length;

  const amountPaid = Number(s8.amountPaid || 0);
  const expectedDeposit = Number(data.guest.deposit || 0);
  const monthlyRent = Number(data.guest.monthlyRent || 0);

  // Calculate expected rent difference from joining date
  const joiningDate = data.guest.joiningDate ? new Date(data.guest.joiningDate) : null;
  const rentCycleDate = data.guest.rentCycleDate || 5;
  let expectedRentDiff = 0;
  if (joiningDate && monthlyRent > 0) {
    const calc = calculateRentDifference(monthlyRent, joiningDate, rentCycleDate);
    expectedRentDiff = calc.differenceAmount;
  }
  const expectedAdvanceRent = monthlyRent;
  const totalExpected = expectedDeposit + expectedRentDiff + expectedAdvanceRent;

  const openSplitDialog = () => {
    setSplitError("");
    // Pre-fill: deposit first, then rent diff, then advance rent
    const prefillDeposit = Math.min(amountPaid, expectedDeposit);
    let remaining = amountPaid - prefillDeposit;
    const prefillRentDiff = Math.min(remaining, expectedRentDiff);
    remaining -= prefillRentDiff;
    const prefillAdvanceRent = remaining;

    setDepositAmount(prefillDeposit > 0 ? String(prefillDeposit) : "");
    setRentDiffAmount(prefillRentDiff > 0 ? String(prefillRentDiff) : "");
    setAdvanceRentAmount(prefillAdvanceRent > 0 ? String(prefillAdvanceRent) : "");

    // Advance rent month: month AFTER the rent difference period
    if (joiningDate) {
      const diffEnd = new Date(joiningDate);
      diffEnd.setDate(diffEnd.getDate() + expectedRentDiff); // approximate
      // Better: advance rent is for the month starting from rent cycle date
      const advanceMonth = new Date(joiningDate);
      advanceMonth.setDate(rentCycleDate);
      if (advanceMonth <= joiningDate) {
        advanceMonth.setMonth(advanceMonth.getMonth() + 1);
      }
      setAdvanceRentMonth(String(advanceMonth.getMonth() + 1));
      setAdvanceRentYear(String(advanceMonth.getFullYear()));
    } else {
      setAdvanceRentMonth(String(new Date().getMonth() + 1));
      setAdvanceRentYear(String(new Date().getFullYear()));
    }
    setSplitDialogOpen(true);
  };

  const handleConfirmApprove = async () => {
    setSplitError("");
    const dep = Number(depositAmount || 0);
    const rentDiff = Number(rentDiffAmount || 0);
    const advanceRent = Number(advanceRentAmount || 0);

    if (amountPaid > 0 && dep + rentDiff + advanceRent !== amountPaid) {
      setSplitError(`Deposit (₹${dep}) + Rent Diff (₹${rentDiff}) + Advance Rent (₹${advanceRent}) must equal total paid (₹${amountPaid})`);
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/approval/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingId: data.id,
          depositAmount: dep > 0 ? dep : undefined,
          rentDifferenceAmount: rentDiff > 0 ? rentDiff : undefined,
          advanceRentAmount: advanceRent > 0 ? advanceRent : undefined,
          advanceRentMonth: advanceRent > 0 ? Number(advanceRentMonth) : undefined,
          advanceRentYear: advanceRent > 0 ? Number(advanceRentYear) : undefined,
        }),
      });
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response from approve API:", text.slice(0, 500));
        throw new Error(`Server returned HTML (status ${res.status}). Please check the server console or restart the dev server.`);
      }
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Approval failed");
      setCredentials(result.credentials);
      setShowCredentials(true);
      setSplitDialogOpen(false);
      toast.success("Guest approved successfully");
      onAction?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/approval/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingId: data.id,
          reason: reason.trim(),
        }),
      });
      if (!res.ok) throw new Error("Rejection failed");
      toast.success("Guest rejected");
      setDialogAction(null);
      setReason("");
      onAction?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Rejection failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleHold = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/approval/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingId: data.id,
          reason: reason.trim(),
        }),
      });
      if (!res.ok) throw new Error("Hold failed");
      toast.success("Guest put on hold");
      setDialogAction(null);
      setReason("");
      onAction?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Hold failed");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSection = (key: string) => {
    setOpenSection(openSection === key ? null : key);
  };

  const SectionHeader = ({
    label,
    sectionKey,
    icon: Icon,
  }: {
    label: string;
    sectionKey: string;
    icon: React.ElementType;
  }) => (
    <button
      type="button"
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-teal-600" />
        {label}
      </div>
      {openSection === sectionKey ? (
        <ChevronUp className="h-4 w-4 text-slate-400" />
      ) : (
        <ChevronDown className="h-4 w-4 text-slate-400" />
      )}
    </button>
  );

  const InfoRow = ({
    label,
    value,
  }: {
    label: string;
    value: React.ReactNode;
  }) => (
    <div className="flex justify-between text-sm py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900 font-medium text-right">{value || "-"}</span>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-900 truncate">
              {data.guest.name}
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {data.guest.mobile}
              </span>
              {data.guest.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span className="truncate max-w-[180px]">{data.guest.email}</span>
                </span>
              )}
            </div>
          </div>
          <Badge
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${
              ONBOARDING_STATUS_COLORS[data.status] ||
              "bg-slate-100 text-slate-800"
            }`}
          >
            {data.status}
          </Badge>
        </div>

        {/* Room / Rent Info */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Home className="h-3 w-3" />
            {data.guest.room?.name || "No room"}
          </span>
          <span className="flex items-center gap-1">
            <Bed className="h-3 w-3" />
            {data.guest.bed?.name || "No bed"}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {data.guest.joiningDate
              ? new Date(data.guest.joiningDate).toLocaleDateString()
              : "-"}
          </span>
          {!!data.guest.monthlyRent && (
            <span className="flex items-center gap-1">
              <IndianRupee className="h-3 w-3" />
              ₹{Number(data.guest.monthlyRent).toLocaleString()}/mo
            </span>
          )}
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500">
              Onboarding Progress
            </span>
            <span className="font-medium text-teal-700">
              {completedCount}/{checklist.length} completed
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all"
              style={{
                width: `${(completedCount / checklist.length) * 100}%`,
              }}
            />
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {checklist.map((item) => (
              <div key={item.label} className="flex items-center gap-1 text-xs">
                {item.ok ? (
                  <CheckCircle className="h-3 w-3 text-teal-600" />
                ) : (
                  <XCircle className="h-3 w-3 text-slate-300" />
                )}
                <span className={item.ok ? "text-slate-700" : "text-slate-400"}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expandable Sections */}
      <div className="divide-y divide-slate-100">
        {/* Personal Details */}
        {s1.fullName && (
          <div>
            <SectionHeader label="Personal Details" sectionKey="personal" icon={User} />
            {openSection === "personal" && (
              <div className="px-4 pb-3">
                <InfoRow label="Full Name" value={s1.fullName} />
                <InfoRow label="Mobile" value={s1.mobile} />
                <InfoRow label="Email" value={s1.email} />
                <InfoRow label="Date of Birth" value={s1.dob} />
                <InfoRow label="Blood Group" value={s1.bloodGroup} />
                <InfoRow label="Address" value={`${s1.address}, ${s1.city}, ${s1.state} - ${s1.pinCode}`} />
              </div>
            )}
          </div>
        )}

        {/* Emergency Contacts */}
        {s2.contacts && s2.contacts.length > 0 && (
          <div>
            <SectionHeader
              label={`Emergency Contacts (${s2.contacts.length})`}
              sectionKey="emergency"
              icon={Users}
            />
            {openSection === "emergency" && (
              <div className="px-4 pb-3 space-y-2">
                {s2.contacts.map((c: any, i: number) => (
                  <div
                    key={i}
                    className="bg-slate-50 rounded-lg p-3 text-sm space-y-1"
                  >
                    <p className="font-medium text-slate-900">
                      {c.name} <span className="text-slate-500 font-normal">({c.relation})</span>
                    </p>
                    <p className="text-slate-500 text-xs">{c.mobile}</p>
                    <p className="text-slate-500 text-xs">{c.city}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Job Details */}
        {s3.companyName && (
          <div>
            <SectionHeader label="Job Details" sectionKey="job" icon={Briefcase} />
            {openSection === "job" && (
              <div className="px-4 pb-3">
                <InfoRow label="Company" value={s3.companyName} />
                <InfoRow label="Occupation" value={s3.occupation} />
                <InfoRow label="Office Address" value={s3.officeAddress} />
                <InfoRow label="Office Contact" value={s3.officeContact} />
              </div>
            )}
          </div>
        )}

        {/* KYC Documents */}
        {(s4.aadhar || s4.pan || s4.photo || s4.idFrontUrl) && (
          <div>
            <SectionHeader label="KYC Documents" sectionKey="docs" icon={FileText} />
            {openSection === "docs" && (
              <div className="px-4 pb-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {s4.aadhar && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1.5">Aadhar (Front)</p>
                      <div className="rounded-lg border border-slate-100 bg-white overflow-hidden">
                        <img
                          src={s4.aadhar}
                          alt="Aadhar Front"
                          className="w-full h-32 object-contain"
                        />
                      </div>
                    </div>
                  )}
                  {s4.aadharBack && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1.5">Aadhar (Back)</p>
                      <div className="rounded-lg border border-slate-100 bg-white overflow-hidden">
                        <img
                          src={s4.aadharBack}
                          alt="Aadhar Back"
                          className="w-full h-32 object-contain"
                        />
                      </div>
                    </div>
                  )}
                  {s4.pan && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1.5">PAN Card</p>
                      <div className="rounded-lg border border-slate-100 bg-white overflow-hidden">
                        <img
                          src={s4.pan}
                          alt="PAN"
                          className="w-full h-32 object-contain"
                        />
                      </div>
                    </div>
                  )}
                  {s4.photo && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1.5">Passport Photo</p>
                      <div className="rounded-lg border border-slate-100 bg-white overflow-hidden">
                        <img
                          src={s4.photo}
                          alt="Photo"
                          className="w-full h-32 object-contain"
                        />
                      </div>
                    </div>
                  )}
                  {s4.idFrontUrl && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1.5">ID Front ({s4.idType || "Document"})</p>
                      <div className="rounded-lg border border-slate-100 bg-white overflow-hidden">
                        <img
                          src={s4.idFrontUrl}
                          alt="ID Front"
                          className="w-full h-32 object-contain"
                        />
                      </div>
                    </div>
                  )}
                  {s4.idBackUrl && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1.5">ID Back</p>
                      <div className="rounded-lg border border-slate-100 bg-white overflow-hidden">
                        <img
                          src={s4.idBackUrl}
                          alt="ID Back"
                          className="w-full h-32 object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Details */}
        {!!s8.method && (
          <div>
            <SectionHeader label="Payment" sectionKey="payment" icon={Receipt} />
            {openSection === "payment" && (
              <div className="px-4 pb-3 space-y-3">
                <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                  <InfoRow label="Method" value={s8.method} />
                  <InfoRow label="Amount Paid" value={`₹${Number(s8.amountPaid || 0).toLocaleString()}`} />
                  <InfoRow label="Transaction ID" value={s8.transactionId || "-"} />
                </div>
                {!!s8.proofUrl && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1.5">Payment Proof</p>
                    <div className="rounded-lg border border-slate-100 bg-white overflow-hidden">
                      <img
                        src={s8.proofUrl as string}
                        alt="Payment Proof"
                        className="w-full max-h-64 object-contain mx-auto p-2"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Agreements */}
        {(data.step5RulesAgreed || data.step6TermsAgreed || data.step7LeavingAgreed) && (
          <div>
            <SectionHeader label="Agreements" sectionKey="agreements" icon={ShieldCheck} />
            {openSection === "agreements" && (
              <div className="px-4 pb-3">
                <InfoRow
                  label="House Rules"
                  value={
                    data.step5RulesAgreed ? (
                      <span className="text-teal-600 flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> Agreed
                      </span>
                    ) : (
                      <span className="text-slate-400">Not agreed</span>
                    )
                  }
                />
                <InfoRow
                  label="Terms & Conditions"
                  value={
                    data.step6TermsAgreed ? (
                      <span className="text-teal-600 flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> Agreed
                      </span>
                    ) : (
                      <span className="text-slate-400">Not agreed</span>
                    )
                  }
                />
                <InfoRow
                  label="Leaving Policy"
                  value={
                    data.step7LeavingAgreed ? (
                      <span className="text-teal-600 flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> Agreed
                      </span>
                    ) : (
                      <span className="text-slate-400">Not agreed</span>
                    )
                  }
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rejection / Hold Reasons */}
      {data.rejectionReason && (
        <div className="mx-4 md:mx-5 my-3 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span><strong>Rejection Reason:</strong> {data.rejectionReason}</span>
        </div>
      )}
      {data.holdReason && (
        <div className="mx-4 md:mx-5 my-3 rounded-xl bg-amber-50 border border-amber-100 p-3 text-sm text-amber-700 flex items-start gap-2">
          <Pause className="h-4 w-4 shrink-0 mt-0.5" />
          <span><strong>On Hold:</strong> {data.holdReason}</span>
        </div>
      )}

      {/* Actions */}
      {type === "submitted" && (
        <div className="p-4 md:p-5 border-t border-slate-100 bg-slate-50/50">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={openSplitDialog}
              disabled={actionLoading}
              className="rounded-full bg-teal-600 hover:bg-teal-700 text-white h-10 px-5"
            >
              <Check className="mr-1.5 h-4 w-4" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDialogAction("hold")}
              disabled={actionLoading}
              className="rounded-full border-amber-200 text-amber-700 hover:bg-amber-50 h-10 px-5"
            >
              <Pause className="mr-1.5 h-4 w-4" />
              Hold
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDialogAction("reject")}
              disabled={actionLoading}
              className="rounded-full border-red-200 text-red-600 hover:bg-red-50 h-10 px-5"
            >
              <X className="mr-1.5 h-4 w-4" />
              Reject
            </Button>
          </div>
        </div>
      )}

      {/* Credentials */}
      {showCredentials && credentials && (
        <div className="mx-4 md:mx-5 my-3 rounded-xl bg-teal-50 border border-teal-100 p-4 space-y-3">
          <h4 className="font-medium text-teal-800 flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4" />
            Guest Credentials Generated
          </h4>
          <div className="text-sm space-y-1.5 bg-white rounded-lg p-3 border border-teal-100">
            <div className="flex justify-between">
              <span className="text-slate-500">Email</span>
              <span className="font-mono font-medium text-slate-900">
                {credentials.email}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Password</span>
              <span className="font-mono font-medium text-slate-900">
                {credentials.password}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(
                `Email: ${credentials.email}\nPassword: ${credentials.password}`
              );
              toast.success("Copied to clipboard");
            }}
            className="rounded-full border-teal-200 text-teal-700 hover:bg-teal-100"
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Copy to Clipboard
          </Button>
        </div>
      )}

      {/* Reject / Hold Dialog */}
      <Dialog
        open={!!dialogAction}
        onOpenChange={(open) => {
          if (!open) {
            setDialogAction(null);
            setReason("");
          }
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">
              {dialogAction === "reject" ? "Reject Onboarding" : "Put On Hold"}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              {dialogAction === "reject"
                ? "Please provide a reason for rejecting this onboarding submission."
                : "Please provide a reason for putting this onboarding on hold."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason..."
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDialogAction(null);
                setReason("");
              }}
              className="rounded-full border-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={dialogAction === "reject" ? handleReject : handleHold}
              disabled={actionLoading || !reason.trim()}
              className={`rounded-full text-white ${
                dialogAction === "reject"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              {dialogAction === "reject" ? "Reject" : "Hold"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Split Dialog */}
      <Dialog open={splitDialogOpen} onOpenChange={setSplitDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-teal-600" />
              Payment Split
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Allocate payment across Deposit, Rent Difference, and Advance Rent.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Summary */}
            <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Paid</span>
                <span className="font-semibold text-slate-900">₹{amountPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expected Deposit</span>
                <span className="font-medium text-slate-700">₹{expectedDeposit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expected Rent Difference</span>
                <span className="font-medium text-slate-700">₹{expectedRentDiff.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expected Advance Rent</span>
                <span className="font-medium text-slate-700">₹{expectedAdvanceRent.toLocaleString()}</span>
              </div>
              <div className="border-t border-slate-200 pt-1.5 flex justify-between">
                <span className="text-slate-500">Total Expected</span>
                <span className="font-semibold text-slate-900">₹{totalExpected.toLocaleString()}</span>
              </div>
            </div>

            {/* Deposit Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="split-deposit" className="text-sm text-slate-700">
                Deposit Amount (₹)
              </Label>
              <Input
                id="split-deposit"
                type="number"
                min={0}
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0"
                className="h-11 rounded-xl"
              />
            </div>

            {/* Rent Difference Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="split-rent-diff" className="text-sm text-slate-700">
                Rent Difference (₹)
              </Label>
              <Input
                id="split-rent-diff"
                type="number"
                min={0}
                value={rentDiffAmount}
                onChange={(e) => setRentDiffAmount(e.target.value)}
                placeholder="0"
                className="h-11 rounded-xl"
              />
              <p className="text-xs text-slate-400">
                {joiningDate
                  ? `From ${joiningDate.toLocaleDateString("en-IN")} to cycle date (${rentCycleDate})`
                  : "Calculated from joining date to rent cycle date"}
              </p>
            </div>

            {/* Advance Rent Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="split-advance-rent" className="text-sm text-slate-700">
                Advance Rent (₹)
              </Label>
              <Input
                id="split-advance-rent"
                type="number"
                min={0}
                value={advanceRentAmount}
                onChange={(e) => setAdvanceRentAmount(e.target.value)}
                placeholder="0"
                className="h-11 rounded-xl"
              />
            </div>

            {/* Advance Rent Month & Year */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-slate-700">Advance Rent For Month</Label>
                <Select value={advanceRentMonth} onValueChange={setAdvanceRentMonth}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={String(m.value)}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-slate-700">Year</Label>
                <Select value={advanceRentYear} onValueChange={setAdvanceRentYear}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y.value} value={String(y.value)}>
                        {y.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Error */}
            {splitError && (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {splitError}
              </div>
            )}

            {/* Allocated Summary */}
            {amountPaid > 0 && (
              <div className="flex justify-between text-sm px-1">
                <span className="text-slate-500">Allocated</span>
                <span className={`font-medium ${Number(depositAmount || 0) + Number(rentDiffAmount || 0) + Number(advanceRentAmount || 0) === amountPaid ? 'text-teal-600' : 'text-amber-600'}`}>
                  ₹{Number(depositAmount || 0) + Number(rentDiffAmount || 0) + Number(advanceRentAmount || 0)} / ₹{amountPaid}
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSplitDialogOpen(false)}
              disabled={actionLoading}
              className="rounded-full border-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmApprove}
              disabled={actionLoading}
              className="rounded-full bg-teal-600 hover:bg-teal-700 text-white"
            >
              {actionLoading ? "Approving..." : "Confirm & Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
