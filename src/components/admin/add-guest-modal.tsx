"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CloudinaryUpload } from "@/components/shared/cloudinary-upload";
import { OnboardingWizard } from "@/components/onboarding/wizard";
import { calculateRentDifference, calculateTotalPayable } from "@/lib/rent-calculator";
import {
  UserPlus,
  Send,
  ClipboardList,
  Zap,
  ArrowLeft,
  Home,
  BedDouble,
  Calendar,
  IndianRupee,
  CreditCard,
  Loader2,
  Check,
  Copy,
  Smartphone,
  Mail,
} from "lucide-react";

type Room = { id: string; name: string };
type Bed = { id: string; roomId: string; name: string; rent: number; deposit: number; status: string };

type Mode = "select" | "quick" | "onboarding" | "wizard";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddGuestModal({ open, onOpenChange, onSuccess }: Props) {
  const [mode, setMode] = useState<Mode>("select");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [wizardToken, setWizardToken] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [createdGuest, setCreatedGuest] = useState<{ id: string; name: string; email: string } | null>(null);

  // Common form state
  const [roomId, setRoomId] = useState("");
  const [bedId, setBedId] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [rentCycleDate, setRentCycleDate] = useState("5");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  // Quick entry only
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idImage, setIdImage] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentProof, setPaymentProof] = useState("");

  const fetchRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const res = await fetch("/api/admin/rooms");
      if (res.ok) {
        const data = await res.json();
        setRooms(Array.isArray(data) ? data.map((r: Room) => ({ id: r.id, name: r.name })) : []);
      }
    } catch {
      // silent
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  const fetchBeds = useCallback(async (rid: string) => {
    try {
      const res = await fetch(`/api/admin/beds?roomId=${rid}&status=Available`);
      if (res.ok) {
        const data = await res.json();
        setBeds(data);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (open && mode !== "wizard") fetchRooms();
  }, [open, mode, fetchRooms]);

  useEffect(() => {
    if (roomId) {
      fetchBeds(roomId);
    } else {
      setBeds([]);
      setBedId("");
    }
  }, [roomId, fetchBeds]);

  useEffect(() => {
    if (bedId) {
      const bed = beds.find((b) => b.id === bedId);
      if (bed) {
        setMonthlyRent(bed.rent.toString());
        setDeposit(bed.deposit.toString());
      }
    }
  }, [bedId, beds]);

  const rentCalc = useMemo(() => {
    if (!joiningDate || !monthlyRent || !rentCycleDate) return null;
    const rent = Number(monthlyRent);
    const dep = Number(deposit) || 0;
    const cycleDay = Number(rentCycleDate);
    if (!rent || !cycleDay) return null;
    try {
      const calc = calculateRentDifference(rent, new Date(joiningDate), cycleDay);
      const total = calculateTotalPayable(rent, dep, calc.differenceAmount);
      return { ...calc, total };
    } catch {
      return null;
    }
  }, [joiningDate, monthlyRent, deposit, rentCycleDate]);

  const resetAll = () => {
    setMode("select");
    setRoomId(""); setBedId(""); setJoiningDate(""); setMonthlyRent("");
    setDeposit(""); setRentCycleDate("5"); setName(""); setMobile("");
    setEmail(""); setAddress(""); setIdType(""); setIdNumber("");
    setIdImage(""); setAmountPaid(""); setPaymentMethod("Cash");
    setPaymentProof(""); setWizardToken(null); setCredentials(null);
    setCreatedGuest(null);
  };

  const handleClose = () => {
    resetAll();
    onOpenChange(false);
  };

  const handleQuickSubmit = async () => {
    if (!roomId || !bedId || !joiningDate || !monthlyRent || !deposit || !name || !mobile || !email) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/guests/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId, bedId, joiningDate,
          monthlyRent: Number(monthlyRent),
          deposit: Number(deposit),
          rentCycleDate: Number(rentCycleDate) || 5,
          name, mobile, email,
          address: address || undefined,
          idType: idType || undefined,
          idNumber: idNumber || undefined,
          idImage: idImage || undefined,
          amountPaid: Number(amountPaid) || 0,
          paymentMethod,
          paymentProof: paymentProof || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      const data = await res.json();
      setCredentials(data.credentials);
      toast.success("Guest created successfully!");
      onSuccess?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create guest");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateForOnboarding = async () => {
    if (!roomId || !bedId || !joiningDate || !monthlyRent || !deposit || !name || !mobile || !email) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const createRes = await fetch("/api/admin/guests/quick-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, mobile, email, roomId, bedId, joiningDate,
          monthlyRent: Number(monthlyRent),
          deposit: Number(deposit),
          rentCycleDate: Number(rentCycleDate) || 5,
        }),
      });
      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error || "Failed to create guest");
      }
      const { guest } = await createRes.json();
      setCreatedGuest(guest);

      const tokenRes = await fetch("/api/admin/onboarding-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: guest.id }),
      });
      if (!tokenRes.ok) throw new Error("Failed to generate token");
      const { token } = await tokenRes.json();
      setWizardToken(token);
      setMode("wizard");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendLink = async () => {
    if (!roomId || !bedId || !joiningDate || !monthlyRent || !deposit || !name || !mobile || !email) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const createRes = await fetch("/api/admin/guests/quick-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, mobile, email, roomId, bedId, joiningDate,
          monthlyRent: Number(monthlyRent),
          deposit: Number(deposit),
          rentCycleDate: Number(rentCycleDate) || 5,
        }),
      });
      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error || "Failed to create guest");
      }
      const { guest } = await createRes.json();

      const tokenRes = await fetch("/api/admin/onboarding-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: guest.id }),
      });
      if (!tokenRes.ok) throw new Error("Failed to generate token");
      const { link } = await tokenRes.json();
      setCredentials({ email: guest.email, password: link });
      toast.success("Onboarding link generated!");
      onSuccess?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const commonFields = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-600">Room *</Label>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          >
            <option value="">Select room</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-600">Bed *</Label>
          <select
            value={bedId}
            onChange={(e) => setBedId(e.target.value)}
            disabled={!roomId || beds.length === 0}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 disabled:bg-slate-50"
          >
            <option value="">{beds.length === 0 ? "No available beds" : "Select bed"}</option>
            {beds.map((b) => (
              <option key={b.id} value={b.id}>Bed {b.name} (Rs. {b.rent.toLocaleString()})</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-600">Joining Date *</Label>
          <Input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} className="rounded-xl border-slate-200" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-600">Rent Cycle Date *</Label>
          <Input
            type="number" min={1} max={28}
            value={rentCycleDate}
            onChange={(e) => setRentCycleDate(e.target.value)}
            className="rounded-xl border-slate-200"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-600">Monthly Rent (Rs.) *</Label>
          <Input type="number" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} className="rounded-xl border-slate-200" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-600">Deposit (Rs.) *</Label>
          <Input type="number" value={deposit} onChange={(e) => setDeposit(e.target.value)} className="rounded-xl border-slate-200" />
        </div>
      </div>
      {rentCalc && (
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Per Day Rent</span>
            <span className="text-slate-900">Rs. {rentCalc.perDayRent.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Difference Days</span>
            <span className="text-slate-900">{rentCalc.differenceDays} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Rent Difference</span>
            <span className="text-amber-600 font-medium">Rs. {rentCalc.differenceAmount.toLocaleString()}</span>
          </div>
          <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold text-slate-900">
            <span>Total Payable</span>
            <span>Rs. {rentCalc.total.toLocaleString()}</span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-600">Full Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Guest name" className="rounded-xl border-slate-200" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-600">Mobile *</Label>
          <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="10 digit mobile" className="rounded-xl border-slate-200" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-xs font-medium text-slate-600">Email *</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="guest@email.com" className="rounded-xl border-slate-200" />
        </div>
      </div>
    </div>
  );

  if (mode === "wizard" && wizardToken) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
          <OnboardingWizard
            token={wizardToken}
            inline
            autoApprove
            onCredentials={(creds) => {
              setCredentials(creds);
              setMode("select");
              onSuccess?.();
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-slate-900">Add New Guest</DialogTitle>
        </DialogHeader>

        {mode === "select" && !credentials && (
          <div className="space-y-3 py-2">
            <button
              onClick={() => setMode("onboarding")}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/30 transition-all text-left"
            >
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Send className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Send Onboarding Link</p>
                <p className="text-xs text-slate-500">Guest fills details via email link</p>
              </div>
            </button>
            <button
              onClick={() => setMode("onboarding")}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/30 transition-all text-left"
            >
              <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                <ClipboardList className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Fill Onboarding Now</p>
                <p className="text-xs text-slate-500">You fill all details and approve now</p>
              </div>
            </button>
            <button
              onClick={() => setMode("quick")}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/30 transition-all text-left"
            >
              <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Quick Direct Entry</p>
                <p className="text-xs text-slate-500">Fastest: Fill basic details only</p>
              </div>
            </button>
          </div>
        )}

        {mode === "onboarding" && !credentials && (
          <div className="space-y-4 py-2">
            <button onClick={() => setMode("select")} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
              <ArrowLeft className="h-3 w-3" /> Back
            </button>
            <p className="text-sm font-medium text-slate-700">Guest Information</p>
            {commonFields}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={handleSendLink} disabled={submitting} className="rounded-full flex-1">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" /> }
                Send Link
              </Button>
              <Button onClick={handleCreateForOnboarding} disabled={submitting} className="rounded-full bg-teal-600 hover:bg-teal-700 text-white flex-1">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4 mr-1.5" /> }
                Fill Now
              </Button>
            </div>
          </div>
        )}

        {mode === "quick" && !credentials && (
          <div className="space-y-4 py-2">
            <button onClick={() => setMode("select")} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
              <ArrowLeft className="h-3 w-3" /> Back
            </button>
            <p className="text-sm font-medium text-slate-700">Quick Direct Entry</p>
            {commonFields}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Address</Label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Full address"
                rows={2}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">ID Type</Label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="">Select ID type</option>
                  <option value="Aadhaar">Aadhaar</option>
                  <option value="PAN">PAN</option>
                  <option value="Passport">Passport</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">ID Number</Label>
                <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="ID number" className="rounded-xl border-slate-200" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">ID Photo</Label>
              <CloudinaryUpload
                images={idImage ? [idImage] : []}
                onChange={(urls) => setIdImage(urls[0] || "")}
                maxFiles={1}
                folder="waghad-villa/documents"
              />
            </div>
            <div className="border-t border-slate-100 pt-4 space-y-4">
              <p className="text-sm font-medium text-slate-700">Payment</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-600">Amount Paid (Rs.)</Label>
                  <Input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="0" className="rounded-xl border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-600">Payment Method</Label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">Payment Proof</Label>
                <CloudinaryUpload
                  images={paymentProof ? [paymentProof] : []}
                  onChange={(urls) => setPaymentProof(urls[0] || "")}
                  maxFiles={1}
                  folder="waghad-villa/payments"
                />
              </div>
            </div>
            <Button
              onClick={handleQuickSubmit}
              disabled={submitting}
              className="w-full rounded-full bg-teal-600 hover:bg-teal-700 text-white"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Check className="h-4 w-4 mr-1.5" /> }
              Complete & Approve
            </Button>
          </div>
        )}

        {credentials && (
          <div className="space-y-4 py-4 text-center">
            <div className="h-12 w-12 rounded-full bg-teal-50 flex items-center justify-center mx-auto">
              <Check className="h-6 w-6 text-teal-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Guest Created Successfully!</h3>
            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Email</span>
                <span className="font-mono font-medium text-slate-900">{credentials.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Password</span>
                <span className="font-mono font-medium text-slate-900">{credentials.password}</span>
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(`Email: ${credentials.email}\nPassword: ${credentials.password}`);
                  toast.success("Copied to clipboard");
                }}
                className="rounded-full"
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
              </Button>
              <Button size="sm" onClick={handleClose} className="rounded-full bg-teal-600 hover:bg-teal-700 text-white">
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}