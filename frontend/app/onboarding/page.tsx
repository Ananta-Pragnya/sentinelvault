"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingWizard from "@/components/OnboardingWizard";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const handleComplete = async (profile: Record<string, unknown>, token: string) => {
    const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    await fetch(`${api}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(profile),
    });
    router.replace("/dashboard");
  };

  return (
    <div className="min-h-screen bg-sv-bg flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-80 border-r border-sv-border p-10 bg-sv-surface">
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="w-6 h-6 rounded-sm bg-sv-amber flex items-center justify-center">
              <span className="text-sv-bg text-[11px] font-black">SV</span>
            </div>
            <span className="font-bold text-sv-text">SentinelVault</span>
          </div>

          <div className="space-y-6">
            {[
              { n: "01", label: "Account",   desc: "Email + password. That's it." },
              { n: "02", label: "Markets",   desc: "Which asset classes you trade." },
              { n: "03", label: "Regions",   desc: "Your geographic exposure." },
              { n: "04", label: "Profile",   desc: "Role, risk tolerance, alert volume." },
            ].map((s, i) => (
              <div key={s.n} className={`flex gap-4 transition-all ${step === i + 1 ? "opacity-100" : "opacity-30"}`}>
                <div className="shrink-0 mt-0.5">
                  <span className="mono text-[10px] text-sv-amber">{s.n}</span>
                </div>
                <div>
                  <div className={`text-sm font-semibold mb-0.5 ${step === i + 1 ? "text-sv-text" : "text-sv-muted"}`}>{s.label}</div>
                  <div className="text-[11px] text-sv-muted">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-sv-border pt-6">
          <p className="mono text-[10px] text-sv-muted leading-relaxed">
            Your data is used solely to personalise alert scoring. We don't sell it.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-6 h-6 rounded-sm bg-sv-amber flex items-center justify-center">
              <span className="text-sv-bg text-[11px] font-black">SV</span>
            </div>
            <span className="font-bold text-sv-text">SentinelVault</span>
          </div>

          <OnboardingWizard step={step} setStep={setStep} onComplete={handleComplete} />
        </div>
      </div>
    </div>
  );
}
