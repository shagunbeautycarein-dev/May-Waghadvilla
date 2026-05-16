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
import type { Step3Job } from "@/types/onboarding";

interface Props {
  data?: Step3Job;
  onNext: (data: Step3Job) => void;
  onBack: () => void;
}

export function Step3Job({ data, onNext, onBack }: Props) {
  const [formData, setFormData] = useState<Step3Job>(
    data || {
      companyName: "",
      occupation: "",
      officeAddress: "",
      officeContact: "",
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label className="text-xs font-medium text-slate-600">Company Name</Label>
        <Input
          value={formData.companyName}
          onChange={(e) =>
            setFormData({ ...formData, companyName: e.target.value })
          }
          className="rounded-xl border-slate-200 focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium text-slate-600">Occupation</Label>
        <Select
          value={formData.occupation}
          onValueChange={(v) =>
            setFormData({ ...formData, occupation: v })
          }
        >
          <SelectTrigger className="rounded-xl border-slate-200">
            <SelectValue placeholder="Select occupation" />
          </SelectTrigger>
          <SelectContent>
            {["Student", "Employee", "Business Owner", "Freelancer", "Other"].map(
              (occ) => (
                <SelectItem key={occ} value={occ}>
                  {occ}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium text-slate-600">Office Address</Label>
        <Input
          value={formData.officeAddress}
          onChange={(e) =>
            setFormData({ ...formData, officeAddress: e.target.value })
          }
          className="rounded-xl border-slate-200 focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-medium text-slate-600">Office Contact</Label>
        <Input
          value={formData.officeContact}
          onChange={(e) =>
            setFormData({ ...formData, officeContact: e.target.value })
          }
          className="rounded-xl border-slate-200 focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
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
