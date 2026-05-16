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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !mobile || !visitDate || !timeSlot) {
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
          email: email || undefined,
          visitDate,
          timeSlot,
          roomId: roomId || undefined,
          bedId: bedId || undefined,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit inquiry");
      }

      toast.success("Inquiry submitted! We will contact you soon.");
      setName("");
      setMobile("");
      setEmail("");
      setVisitDate("");
      setTimeSlot("");
      setNotes("");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="name">
          Full Name <span className="text-red-500">*</span>
        </Label>
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
        <Label htmlFor="mobile">
          Mobile Number <span className="text-red-500">*</span>
        </Label>
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
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email (optional)"
          className="rounded-xl mt-1.5"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="visitDate">
            Visit Date <span className="text-red-500">*</span>
          </Label>
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
          <Label htmlFor="timeSlot">
            Time Slot <span className="text-red-500">*</span>
          </Label>
          <Select value={timeSlot} onValueChange={setTimeSlot} required>
            <SelectTrigger id="timeSlot" className="rounded-xl mt-1.5 w-full">
              <SelectValue placeholder="Select slot" />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.map((slot) => (
                <SelectItem key={slot} value={slot}>
                  {slot}
                </SelectItem>
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
        className="w-full bg-teal-700 hover:bg-teal-800 rounded-full"
        disabled={submitting}
      >
        {submitting ? "Submitting..." : "Book Free Visit"}
      </Button>
    </form>
  );
}
