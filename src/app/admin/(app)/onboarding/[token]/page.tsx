"use client";

import { useParams } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/wizard";

export default function AdminOnboardingPage() {
  const params = useParams();
  const token = params.token as string;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Fill Onboarding for Guest</h1>
      <OnboardingWizard token={token} />
    </div>
  );
}
