"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileCheck } from "lucide-react";

interface Props {
  agreed?: boolean;
  onNext: (agreed: boolean) => void;
  onBack: () => void;
}

export function Step6Terms({ agreed, onNext, onBack }: Props) {
  const [checked, setChecked] = useState(agreed || false);
  const [content, setContent] = useState<string>("Loading...");

  useEffect(() => {
    fetch("/api/settings/terms_conditions")
      .then((res) => res.json())
      .then((data) => setContent(data.value || "Terms content not set."))
      .catch(() => setContent("Failed to load terms."));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checked) return;
    onNext(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <FileCheck className="h-4 w-4 text-teal-600" />
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Please read carefully</p>
      </div>
      <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50 p-5 text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
        {content}
      </div>
      <div className="flex items-start gap-3 bg-white rounded-xl border border-slate-100 p-4">
        <Checkbox
          id="terms"
          checked={checked}
          onCheckedChange={(v) => setChecked(v === true)}
          className="mt-0.5 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
        />
        <Label htmlFor="terms" className="text-sm font-normal leading-snug text-slate-700 cursor-pointer">
          I agree to the terms and conditions *
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
          type="submit"
          className="flex-1 rounded-full bg-teal-600 hover:bg-teal-700 text-white h-11"
          disabled={!checked}
        >
          Continue
        </Button>
      </div>
    </form>
  );
}
