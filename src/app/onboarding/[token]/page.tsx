"use client";

import { useParams } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/wizard";

export default function GuestOnboardingPage() {
  const params = useParams();
  const token = params.token as string;

  return (
    <div className="min-h-screen bg-slate-50">
      <OnboardingWizard token={token} />
    </div>
  );
}
