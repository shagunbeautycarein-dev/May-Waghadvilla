"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileImage, User } from "lucide-react";
import { CloudinaryUpload } from "@/components/shared/cloudinary-upload";
import type { Step4Documents } from "@/types/onboarding";

interface Props {
  data?: Step4Documents;
  onNext: (data: Step4Documents) => void;
  onBack: () => void;
}

type DocType = "aadhar" | "pan" | "photo";

const DOC_CONFIG: { key: DocType; label: string; icon: React.ElementType }[] = [
  { key: "aadhar", label: "Aadhar Card", icon: FileImage },
  { key: "pan", label: "PAN Card", icon: FileImage },
  { key: "photo", label: "Passport Photo", icon: User },
];

export function Step4Documents({ data, onNext, onBack }: Props) {
  const [formData, setFormData] = useState<Step4Documents>(
    data || { aadhar: "", pan: "", photo: "" }
  );
  const [activeTab, setActiveTab] = useState<DocType>("aadhar");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!formData.aadhar || !formData.pan || !formData.photo) {
      setError("Please upload Aadhar Card, PAN Card, and Passport Photo to continue.");
      return;
    }
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Document Type Tabs */}
      <div className="flex gap-2">
        {DOC_CONFIG.map((doc) => {
          const hasFile = !!formData[doc.key];
          return (
            <button
              key={doc.key}
              type="button"
              onClick={() => setActiveTab(doc.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-medium transition-all border ${
                activeTab === doc.key
                  ? "bg-teal-50 border-teal-200 text-teal-700"
                  : hasFile
                  ? "bg-white border-slate-200 text-slate-700"
                  : "bg-white border-slate-200 text-slate-400"
              }`}
            >
              <doc.icon className="h-3.5 w-3.5" />
              {doc.label}
              {hasFile && (
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Upload Area per active tab */}
      {DOC_CONFIG.map((doc) => {
        if (doc.key !== activeTab) return null;
        const value = formData[doc.key];
        return (
          <div key={doc.key} className="space-y-3">
            <p className="text-sm font-medium text-slate-900">
              Upload {doc.label}
            </p>
            <CloudinaryUpload
              images={value ? [value] : []}
              onChange={(urls) => setFormData((prev) => ({ ...prev, [doc.key]: urls[0] || "" }))}
              maxFiles={1}
              folder={`wahad-villa/documents/${doc.key}`}
            />
          </div>
        );
      })}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

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
