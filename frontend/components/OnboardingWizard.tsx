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

export default function OnboardingWizard({ step, setStep, onComplete }: Props) {
  const api = process.env.NEXT_PUBLIC_API_URL;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [assets, setAssets] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [role, setRole] = useState("Analyst");
  const [risk, setRisk] = useState(5);
  const [volume, setVolume] = useState<"low" | "medium" | "high">("medium");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggle = (arr: string[], setArr: (a: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

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
        if (!res.ok) throw new Error("Registration failed");
        res = await fetch(`${api}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
      }
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
    <div className="sentinel-card p-8">
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step >= s ? "bg-sentinel-accent text-sentinel-bg" : "bg-sentinel-card border border-sentinel-border text-slate-500"
            }`}>{s}</div>
            {s < 4 && <div className={`h-0.5 w-12 transition-all ${step > s ? "bg-sentinel-accent" : "bg-sentinel-border"}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Create your account</h2>
          <p className="text-slate-400 text-sm">Sign in or register — we'll auto-create your account</p>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
            className="w-full bg-sentinel-bg border border-sentinel-border rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sentinel-accent"
          />
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
            className="w-full bg-sentinel-bg border border-sentinel-border rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sentinel-accent"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={handleAuth} disabled={loading || !email || !password}
            className="w-full py-3 rounded-lg bg-sentinel-accent text-sentinel-bg font-bold hover:opacity-90 disabled:opacity-40 transition-opacity">
            {loading ? "..." : "Continue"}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Asset classes</h2>
          <p className="text-slate-400 text-sm">Select the markets you monitor</p>
          <div className="grid grid-cols-2 gap-2">
            {ASSET_CLASSES.map((a) => (
              <button key={a} onClick={() => toggle(assets, setAssets, a)}
                className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                  assets.includes(a) ? "border-sentinel-accent bg-sentinel-accent/10 text-sentinel-accent" : "border-sentinel-border text-slate-400 hover:border-slate-500"
                }`}>{a}</button>
            ))}
          </div>
          <div className="flex justify-end">
            <button onClick={() => setStep(3)} disabled={assets.length === 0}
              className="px-6 py-2 rounded-lg bg-sentinel-accent text-sentinel-bg font-bold disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Geographic exposure</h2>
          <p className="text-slate-400 text-sm">Where are your exposures?</p>
          <div className="grid grid-cols-2 gap-2">
            {REGIONS.map((r) => (
              <button key={r} onClick={() => toggle(regions, setRegions, r)}
                className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                  regions.includes(r) ? "border-sentinel-accent bg-sentinel-accent/10 text-sentinel-accent" : "border-sentinel-border text-slate-400 hover:border-slate-500"
                }`}>{r}</button>
            ))}
          </div>
          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="px-6 py-2 rounded-lg border border-sentinel-border text-slate-400">← Back</button>
            <button onClick={() => setStep(4)} disabled={regions.length === 0}
              className="px-6 py-2 rounded-lg bg-sentinel-accent text-sentinel-bg font-bold disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-white">Role &amp; preferences</h2>
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Your role</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button key={r} onClick={() => setRole(r)}
                  className={`px-4 py-2.5 rounded-lg border text-sm transition-all ${
                    role === r ? "border-sentinel-accent bg-sentinel-accent/10 text-sentinel-accent" : "border-sentinel-border text-slate-400"
                  }`}>{r}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Risk tolerance — {risk}/10</label>
            <input type="range" min={1} max={10} value={risk} onChange={(e) => setRisk(+e.target.value)}
              className="w-full accent-sentinel-accent" />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Alert volume</label>
            <div className="flex gap-2">
              {VOLUMES.map((v) => (
                <button key={v} onClick={() => setVolume(v)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm capitalize transition-all ${
                    volume === v ? "border-sentinel-accent bg-sentinel-accent/10 text-sentinel-accent" : "border-sentinel-border text-slate-400"
                  }`}>{v}</button>
              ))}
            </div>
          </div>
          <div className="flex justify-between">
            <button onClick={() => setStep(3)} className="px-6 py-2 rounded-lg border border-sentinel-border text-slate-400">← Back</button>
            <button onClick={handleSubmit} disabled={loading}
              className="px-8 py-2 rounded-lg bg-sentinel-accent text-sentinel-bg font-bold disabled:opacity-40">
              {loading ? "Setting up..." : "Launch SentinelVault →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
