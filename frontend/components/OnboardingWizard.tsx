"use client";
import { useState } from "react";

const ASSET_CLASSES = ["Equities", "FX", "Commodities", "Crypto", "Fixed Income", "Real Estate"];
const REGIONS = ["Americas", "Europe", "APAC", "Middle East", "Africa"];
const ROLES = ["Trader", "Risk Manager", "Analyst", "Portfolio Manager"];
const VOLUMES = ["low", "medium", "high"] as const;

interface Props {
  step: number;
  setStep: (n: number) => void;
  onComplete: (profile: Record<string, unknown>, token: string) => Promise<void>;
}

function Input({ type = "text", value, onChange, placeholder }: {
  type?: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-sv-bg border border-sv-border rounded-sm px-4 py-3 text-sv-text placeholder-sv-muted text-sm focus:outline-none focus:border-sv-line transition-colors mono"
    />
  );
}

function ToggleBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2.5 rounded-sm border text-sm font-medium transition-all text-left"
      style={active
        ? { borderColor: "#F59E0B", background: "rgba(245,158,11,0.08)", color: "#F59E0B" }
        : { borderColor: "#27272A", color: "#71717A" }
      }
    >
      {active && <span className="mr-2 text-xs">✓</span>}{label}
    </button>
  );
}

function StepHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-sv-text mb-1">{title}</h2>
      <p className="text-sm text-sv-muted">{sub}</p>
    </div>
  );
}

export default function OnboardingWizard({ step, setStep, onComplete }: Props) {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [assets, setAssets]     = useState<string[]>([]);
  const [regions, setRegions]   = useState<string[]>([]);
  const [role, setRole]         = useState("Analyst");
  const [risk, setRisk]         = useState(5);
  const [volume, setVolume]     = useState<"low" | "medium" | "high">("medium");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const toggle = (arr: string[], setArr: (a: string[]) => void, val: string) =>
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const handleAuth = async () => {
    setLoading(true); setError("");
    try {
      let res = await fetch(`${api}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.status === 401) {
        res = await fetch(`${api}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.detail || "Registration failed");
        }
        res = await fetch(`${api}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
      }
      if (!res.ok) throw new Error("Login failed — check your password");
      const data = await res.json();
      localStorage.setItem("sv_token", data.access_token);
      setStep(2);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    const token = localStorage.getItem("sv_token") ?? "";
    await onComplete({
      asset_classes: assets.map((a) => a.toLowerCase().replace(" ", "_")),
      regions,
      role: role.toLowerCase().replace(" ", "_"),
      risk_tolerance: risk / 10,
      alert_volume: volume,
    }, token);
    setLoading(false);
  };

  return (
    <div className="card p-8">
      {/* Step bar */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-sm flex items-center justify-center mono text-xs font-bold transition-all"
              style={step >= s
                ? { background: "#F59E0B", color: "#09090A" }
                : { background: "#111113", border: "1px solid #27272A", color: "#52525B" }
              }
            >{s}</div>
            {s < 4 && (
              <div className="h-px w-10 transition-all" style={{ background: step > s ? "#F59E0B" : "#27272A" }} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 — Auth */}
      {step === 1 && (
        <div className="space-y-4">
          <StepHeader title="Sign in or create account" sub="Enter your email — we'll auto-register if you're new." />
          <Input type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
          <Input type="password" value={password} onChange={setPassword} placeholder="Password (min 8 chars)" />
          {error && (
            <div className="text-xs text-sv-red mono bg-sv-red/5 border border-sv-red/20 rounded-sm px-3 py-2">
              {error}
            </div>
          )}
          <button
            onClick={handleAuth}
            disabled={loading || !email || !password}
            className="btn-primary w-full justify-center disabled:opacity-40"
          >
            {loading ? "Authenticating..." : "Continue →"}
          </button>
          <p className="mono text-[10px] text-sv-muted text-center">
            Entering a new email creates an account automatically.
          </p>
        </div>
      )}

      {/* Step 2 — Asset classes */}
      {step === 2 && (
        <div className="space-y-4">
          <StepHeader title="What do you trade?" sub="Select every asset class you monitor." />
          <div className="grid grid-cols-2 gap-2">
            {ASSET_CLASSES.map((a) => (
              <ToggleBtn key={a} label={a} active={assets.includes(a)} onClick={() => toggle(assets, setAssets, a)} />
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={() => setStep(3)} disabled={assets.length === 0} className="btn-primary disabled:opacity-40">
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Regions */}
      {step === 3 && (
        <div className="space-y-4">
          <StepHeader title="Geographic exposure" sub="Where are your positions concentrated?" />
          <div className="grid grid-cols-2 gap-2">
            {REGIONS.map((r) => (
              <ToggleBtn key={r} label={r} active={regions.includes(r)} onClick={() => toggle(regions, setRegions, r)} />
            ))}
          </div>
          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(2)} className="btn-ghost">← Back</button>
            <button onClick={() => setStep(4)} disabled={regions.length === 0} className="btn-primary disabled:opacity-40">
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 4 — Role + prefs */}
      {step === 4 && (
        <div className="space-y-5">
          <StepHeader title="Your profile" sub="Used to tune scoring weights to your workflow." />

          <div>
            <label className="mono text-[10px] text-sv-muted uppercase tracking-wider block mb-2">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <ToggleBtn key={r} label={r} active={role === r} onClick={() => setRole(r)} />
              ))}
            </div>
          </div>

          <div>
            <label className="mono text-[10px] text-sv-muted uppercase tracking-wider block mb-2">
              Risk tolerance — <span className="text-sv-amber">{risk}/10</span>
            </label>
            <input
              type="range" min={1} max={10} value={risk}
              onChange={(e) => setRisk(+e.target.value)}
              className="w-full h-1 appearance-none bg-sv-border rounded-full outline-none"
              style={{ accentColor: "#F59E0B" }}
            />
            <div className="flex justify-between mono text-[10px] text-sv-muted mt-1">
              <span>Conservative</span><span>Aggressive</span>
            </div>
          </div>

          <div>
            <label className="mono text-[10px] text-sv-muted uppercase tracking-wider block mb-2">Alert volume</label>
            <div className="flex gap-2">
              {VOLUMES.map((v) => (
                <ToggleBtn key={v} label={v.charAt(0).toUpperCase() + v.slice(1)} active={volume === v} onClick={() => setVolume(v)} />
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(3)} className="btn-ghost">← Back</button>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary disabled:opacity-40">
              {loading ? "Launching..." : "Launch SentinelVault →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
