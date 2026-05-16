'use client';

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Home, Check, ArrowRight, BedDouble } from "lucide-react";

import { Step1Personal } from "@/components/onboarding/step-1-personal";
import { Step2Emergency } from "@/components/onboarding/step-2-emergency";
import { Step3Job } from "@/components/onboarding/step-3-job";
import { Step4Documents } from "@/components/onboarding/step-4-documents";
import { Step5Rules } from "@/components/onboarding/step-5-rules";
import { Step6Terms } from "@/components/onboarding/step-6-terms";
import { Step7Leaving } from "@/components/onboarding/step-7-leaving";
import { Step8Payment } from "@/components/onboarding/step-8-payment";
import { Step9Review } from "@/components/onboarding/step-9-review";
import type { OnboardingFormData } from "@/types/onboarding";

interface Props {
  token: string;
  inline?: boolean;
  autoApprove?: boolean;
  onCredentials?: (creds: { email: string; password: string }) => void;
}

const STEPS = [
  { num: 1, title: "Personal Details", short: "Personal" },
  { num: 2, title: "Emergency Contacts", short: "Emergency" },
  { num: 3, title: "Job Information", short: "Job" },
  { num: 4, title: "Documents", short: "Docs" },
  { num: 5, title: "House Rules", short: "Rules" },
  { num: 6, title: "Terms & Conditions", short: "Terms" },
  { num: 7, title: "Leaving Policy", short: "Leaving" },
  { num: 8, title: "Payment", short: "Payment" },
  { num: 9, title: "Review & Submit", short: "Review" },
];

export function OnboardingWizard({ token, inline, autoApprove, onCredentials }: Props) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [guestData, setGuestData] = useState<any>(null);
  const [formData, setFormData] = useState<OnboardingFormData>({});
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch(`/api/onboarding/verify?token=${token}`);
        if (!res.ok) throw new Error("Invalid token");
        const data = await res.json();
        setGuestData(data.guest);
        setValid(true);

        if (data.onboardingData) {
          const od = data.onboardingData;
          const loaded: OnboardingFormData = {
            step1: od.step1Personal || undefined,
            step2: od.step2Emergency || undefined,
            step3: od.step3Job || undefined,
            step4: od.step4Documents || undefined,
            step5: od.step5RulesAgreed || false,
            step6: od.step6TermsAgreed || false,
            step7: od.step7LeavingAgreed || false,
            step8: od.step8Payment || undefined,
          };
          setFormData(loaded);

          let resumeStep = 1;
          if (loaded.step1) resumeStep = 2;
          if (loaded.step2) resumeStep = 3;
          if (loaded.step3) resumeStep = 4;
          if (loaded.step4) resumeStep = 5;
          if (loaded.step5) resumeStep = 6;
          if (loaded.step6) resumeStep = 7;
          if (loaded.step7) resumeStep = 8;
          if (loaded.step8) resumeStep = 9;
          setStep(resumeStep);
        }
      } catch {
        toast.error("Invalid or expired onboarding link");
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [token]);

  const saveDraft = async (currentStepData: OnboardingFormData, stepNum: number) => {
    setSaving(true);
    try {
      await fetch("/api/onboarding/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, step: stepNum, data: currentStepData }),
      });
    } catch {
      // silent fail
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async (stepData: unknown) => {
    const key = `step${step}` as keyof OnboardingFormData;
    const newFormData = { ...formData, [key]: stepData };
    setFormData(newFormData);
    await saveDraft(newFormData, step);
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch("/api/onboarding/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, data: formData, autoApprove }),
      });
      if (!res.ok) throw new Error("Submit failed");
      const result = await res.json();

      if (autoApprove && result.credentials) {
        setCredentials(result.credentials);
        toast.success("Guest onboarded and approved successfully!");
        if (onCredentials) onCredentials(result.credentials);
      } else {
        toast.success("Onboarding submitted! Waiting for admin approval.");
      }
      setSubmitted(true);
    } catch {
      toast.error("Failed to submit. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className={`${inline ? "min-h-[50vh]" : "min-h-screen"} bg-slate-50 flex items-center justify-center`}>
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className={`${inline ? "min-h-[50vh]" : "min-h-screen"} bg-slate-50 flex items-center justify-center`}>
        <div className="text-center">
          <p className="text-red-600 font-medium">Invalid or expired link</p>
          <p className="text-sm text-slate-500 mt-1">Please contact the admin for a new link.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={`${inline ? "py-8" : "min-h-screen py-8 flex items-center justify-center"} bg-slate-50 px-4`}>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
          <div className="h-12 w-12 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
            <Check className="h-6 w-6 text-teal-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            {autoApprove ? "Guest Onboarded & Approved" : "Onboarding Submitted"}
          </h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            {autoApprove
              ? "The guest has been successfully onboarded and approved. Credentials are shown below."
              : "Thank you! Your onboarding has been submitted successfully. Our admin team will review it shortly."}
          </p>
          {credentials && (
            <div className="mt-4 bg-slate-50 rounded-xl border border-slate-100 p-4 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Email</span>
                <span className="font-mono font-medium text-slate-900">{credentials.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Password</span>
                <span className="font-mono font-medium text-slate-900">{credentials.password}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${inline ? "" : "min-h-screen"} bg-slate-50 py-4 md:py-8 px-3 md:px-4 ${inline ? "pb-4" : "pb-24 md:pb-8"}`}>
      <div className="max-w-2xl mx-auto">
        <div className={`${inline ? "mb-3 md:mb-5" : "mb-4 md:mb-8"} text-center`}>
          {!inline && (
            <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center mx-auto mb-2 md:mb-3">
              <Home className="h-5 w-5 text-white" />
            </div>
          )}
          <h1 className="text-base md:text-lg font-semibold text-slate-900">Complete Your Onboarding</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5 md:mt-1">
            Welcome to The Waghad Villa, {guestData?.name}
          </p>
          {guestData?.room?.name && (
            <div className="mt-2 inline-flex items-center gap-2 bg-teal-50 text-teal-700 text-xs font-medium px-3 py-1.5 rounded-full border border-teal-100">
              <Home className="h-3 w-3" />
              Room {guestData.room.name}
              {guestData?.bed?.name && (
                <span className="flex items-center gap-1">
                  <BedDouble className="h-3 w-3" />
                  Bed {guestData.bed.name}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mb-4 md:mb-8 overflow-x-auto pb-2 -mx-3 px-3 md:mx-0 md:px-0">
          <div className="flex items-center justify-between relative min-w-[320px]">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-100" />
            <div
              className="absolute top-4 left-0 h-0.5 bg-teal-500 transition-all duration-300"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
            />

            {STEPS.map((s) => {
              const isActive = s.num === step;
              const isCompleted = s.num < step;
              return (
                <div key={s.num} className="relative z-10 flex flex-col items-center gap-1">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all shrink-0 ${
                      isActive
                        ? "bg-teal-600 text-white shadow-md"
                        : isCompleted
                        ? "bg-teal-50 text-teal-600 border border-teal-200"
                        : "bg-white text-slate-400 border border-slate-200"
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : s.num}
                  </div>
                  <span
                    className={`text-[9px] md:text-[10px] font-medium text-center leading-tight max-w-[60px] ${
                      isActive ? "text-teal-700" : isCompleted ? "text-teal-600" : "text-slate-400"
                    }`}
                  >
                    <span className="hidden sm:inline">{s.title}</span>
                    <span className="sm:hidden">{s.short}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-teal-600 mb-0.5">Step {step} of {STEPS.length}</p>
                <h2 className="text-sm md:text-base font-semibold text-slate-900">{STEPS[step - 1].title}</h2>
              </div>
              {saving && (
                <span className="text-xs text-slate-400">Saving...</span>
              )}
            </div>
          </div>

          <div className="p-4 md:p-6">
            {step === 1 && (
              <Step1Personal data={formData.step1} guest={guestData} onNext={handleNext} />
            )}
            {step === 2 && (
              <Step2Emergency data={formData.step2} onNext={handleNext} onBack={handleBack} />
            )}
            {step === 3 && (
              <Step3Job data={formData.step3} onNext={handleNext} onBack={handleBack} />
            )}
            {step === 4 && (
              <Step4Documents data={formData.step4} onNext={handleNext} onBack={handleBack} />
            )}
            {step === 5 && (
              <Step5Rules agreed={formData.step5} onNext={handleNext} onBack={handleBack} />
            )}
            {step === 6 && (
              <Step6Terms agreed={formData.step6} onNext={handleNext} onBack={handleBack} />
            )}
            {step === 7 && (
              <Step7Leaving agreed={formData.step7} onNext={handleNext} onBack={handleBack} />
            )}
            {step === 8 && (
              <Step8Payment data={formData.step8} guest={guestData} onNext={handleNext} onBack={handleBack} />
            )}
            {step === 9 && (
              <Step9Review data={formData} guest={guestData} onSubmit={handleSubmit} onBack={handleBack} />
            )}
          </div>
        </div>

        {step < 9 && (
          <div className="mt-4 md:mt-6 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                saveDraft(formData, step);
                toast.success("Progress saved! You can resume later using the same link.");
              }}
              className="text-xs text-slate-500 hover:text-slate-700 rounded-full"
            >
              Save & Continue Later
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
