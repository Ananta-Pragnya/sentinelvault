"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingWizard from "@/components/OnboardingWizard";

const STEPS = [
  { n: "01", label: "Markets", desc: "Which asset classes you trade." },
  { n: "02", label: "Regions", desc: "Your geographic exposure." },
  { n: "03", label: "Profile", desc: "Role, risk tolerance, alert volume." },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const handleComplete = async (profile: Record<string, unknown>) => {
    localStorage.setItem("sv_token", "demo");
    const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    await fetch(`${api}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    }).catch(() => {});
    router.replace("/dashboard");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--txt)", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, display: "flex", flexDirection: "column" }}>
      {/* Nav */}
      <nav className="bb-nav">
        <div style={{ display: "flex", alignItems: "center" }}>
          <span className="bb-brand">SENTINELVAULT</span>
          <div className="bb-live-badge"><span className="bb-live-dot" /><span>SETUP</span></div>
        </div>
        <div style={{ fontSize: 10, color: "var(--txt3)", letterSpacing: 1 }}>
          STEP {step} OF 3
        </div>
      </nav>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "220px 1fr" }}>
        {/* Left panel */}
        <div style={{ borderRight: "1px solid var(--bdr)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: "var(--txt3)", padding: "12px 20px", borderBottom: "1px solid var(--bdr)", background: "var(--bg2)" }}>
              SETUP PROGRESS
            </div>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{
                display: "flex", gap: 14, padding: "14px 20px",
                borderBottom: "1px solid var(--bdr)",
                opacity: step === i + 1 ? 1 : step > i + 1 ? 0.5 : 0.25,
                background: step === i + 1 ? "var(--bg3)" : "transparent",
              }}>
                <span style={{ fontSize: 9, color: step > i + 1 ? "var(--live)" : step === i + 1 ? "var(--txt)" : "var(--txt3)", letterSpacing: 1, flexShrink: 0, paddingTop: 1 }}>
                  {step > i + 1 ? "✓" : s.n}
                </span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: step === i + 1 ? "var(--txt)" : "var(--txt3)", marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: "var(--txt3)", lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: "16px 20px", borderTop: "1px solid var(--bdr)" }}>
            <div style={{ fontSize: 9, color: "var(--txt3)", lineHeight: 1.6 }}>
              Your data is used solely to personalise alert scoring. We don&apos;t sell it.
            </div>
          </div>
        </div>

        {/* Right: form */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
          <OnboardingWizard step={step} setStep={setStep} onComplete={handleComplete} />
        </div>
      </div>
    </div>
  );
}
