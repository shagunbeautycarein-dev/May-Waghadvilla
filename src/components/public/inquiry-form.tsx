"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TIME_SLOTS } from "@/lib/constants";
import { toast } from "sonner";
import { CheckCircle, CalendarCheck, Clock, MapPin } from "lucide-react";

export function InquiryForm() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId") || "";
  const bedId = searchParams.get("bedId") || "";

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<{ name: string; visitDate: string; timeSlot: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !mobile || !email || !visitDate || !timeSlot) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/public/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          mobile,
          email,
          visitDate,
          timeSlot,
          roomId: roomId || undefined,
          bedId: bedId || undefined,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit inquiry");

      setSubmittedData({ name, visitDate, timeSlot });
      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Thank You Screen
  if (submitted && submittedData) {
    const dateFormatted = new Date(submittedData.visitDate).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return (
      <div className="text-center py-6 px-2 space-y-6">
        {/* Success icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Thank You, {submittedData.name}! 🎉</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Your visit has been booked. We&apos;re excited to welcome you to <strong>The Waghad Villa</strong>!
          </p>
        </div>

        {/* Booking confirmation card */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 space-y-3 text-left">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">Booking Confirmation</p>
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <CalendarCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span><strong>Date:</strong> {dateFormatted}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
            <span><strong>Time Slot:</strong> {submittedData.timeSlot}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
            <span><strong>Location:</strong> The Waghad Villa, Ambawadi, Ahmedabad</span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-600 leading-relaxed">
          ✅ <strong>We assure you — your visit is confirmed.</strong> Our team will contact you before your scheduled time to confirm directions and any requirements. We look forward to welcoming you!
        </div>

        <button
          onClick={() => { setSubmitted(false); setSubmittedData(null); setName(""); setMobile(""); setEmail(""); setVisitDate(""); setTimeSlot(""); setNotes(""); }}
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          Book another visit →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your full name"
          required
          className="rounded-xl mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="mobile">Mobile Number <span className="text-red-500">*</span></Label>
        <Input
          id="mobile"
          type="tel"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          placeholder="Enter your mobile number"
          required
          className="rounded-xl mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          className="rounded-xl mt-1.5"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="visitDate">Visit Date <span className="text-red-500">*</span></Label>
          <Input
            id="visitDate"
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            required
            className="rounded-xl mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="timeSlot">Time Slot <span className="text-red-500">*</span></Label>
          <Select value={timeSlot} onValueChange={setTimeSlot} required>
            <SelectTrigger id="timeSlot" className="rounded-xl mt-1.5 w-full">
              <SelectValue placeholder="Select slot" />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.map((slot) => (
                <SelectItem key={slot} value={slot}>{slot}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {roomId && (
        <div className="rounded-xl bg-teal-50 p-3 text-sm text-teal-800 border border-teal-100">
          <span className="font-medium">Interested Room:</span>{" "}
          {bedId ? "Specific bed selected" : "Room details will be shared with the team"}
        </div>
      )}

      <div>
        <Label htmlFor="notes">Message / Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any specific requirements or questions..."
          rows={3}
          className="rounded-xl mt-1.5"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-teal-700 hover:bg-teal-800 rounded-full h-12"
        disabled={submitting}
      >
        {submitting ? "Submitting..." : "Book Free Visit"}
      </Button>
    </form>
  );
}
