"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingWizard from "@/components/OnboardingWizard";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const handleComplete = async (profile: Record<string, unknown>, token: string) => {
    const api = process.env.NEXT_PUBLIC_API_URL;
    await fetch(`${api}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(profile),
    });
    router.replace("/dashboard");
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-sentinel-accent mb-2">SentinelVault</h1>
          <p className="text-slate-400">AI-powered alert intelligence platform</p>
        </div>
        <OnboardingWizard step={step} setStep={setStep} onComplete={handleComplete} />
      </div>
    </main>
  );
}
