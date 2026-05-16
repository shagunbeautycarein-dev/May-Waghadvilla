"use client";

import { useState } from "react";
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
import type { Step1Personal } from "@/types/onboarding";

interface Props {
  data?: Step1Personal;
  guest?: { name: string; mobile: string; email: string | null };
  onNext: (data: Step1Personal) => void;
}

export function Step1Personal({ data, guest, onNext }: Props) {
  const [formData, setFormData] = useState<Step1Personal>(
    data || {
      fullName: guest?.name || "",
      mobile: guest?.mobile || "",
      email: guest?.email || "",
      dob: "",
      bloodGroup: "",
      address: "",
      country: "India",
      state: "",
      city: "",
      pinCode: "",
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-600">Full Name *</Label>
          <Input
            value={formData.fullName}
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
            required
            className="rounded-xl border-slate-200 focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-600">Mobile *</Label>
          <Input
            value={formData.mobile}
            onChange={(e) =>
              setFormData({ ...formData, mobile: e.target.value })
            }
            required
            pattern="[0-9]{10}"
            className="rounded-xl border-slate-200 focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium text-slate-600">Email *</Label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          required
          className="rounded-xl border-slate-200 focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-600">Date of Birth *</Label>
          <Input
            type="date"
            value={formData.dob}
            onChange={(e) =>
              setFormData({ ...formData, dob: e.target.value })
            }
            required
            className="rounded-xl border-slate-200 focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-600">Blood Group</Label>
          <Select
            value={formData.bloodGroup}
            onValueChange={(v) =>
              setFormData({ ...formData, bloodGroup: v })
            }
          >
            <SelectTrigger className="rounded-xl border-slate-200">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                (bg) => (
                  <SelectItem key={bg} value={bg}>
                    {bg}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium text-slate-600">Address *</Label>
        <Input
          value={formData.address}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
          required
          className="rounded-xl border-slate-200 focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-600">State *</Label>
          <Input
            value={formData.state}
            onChange={(e) =>
              setFormData({ ...formData, state: e.target.value })
            }
            required
            className="rounded-xl border-slate-200 focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-600">City *</Label>
          <Input
            value={formData.city}
            onChange={(e) =>
              setFormData({ ...formData, city: e.target.value })
            }
            required
            className="rounded-xl border-slate-200 focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium text-slate-600">PIN Code *</Label>
        <Input
          value={formData.pinCode}
          onChange={(e) =>
            setFormData({ ...formData, pinCode: e.target.value })
          }
          required
          pattern="[0-9]{6}"
          className="rounded-xl border-slate-200 focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
        />
      </div>
      <Button
        type="submit"
        className="w-full rounded-full bg-teal-600 hover:bg-teal-700 text-white h-11"
      >
        Continue
      </Button>
    </form>
  );
}
