"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const ASSET_CLASSES = ["Equities", "FX", "Commodities", "Crypto", "Fixed Income", "Real Estate"];
const REGIONS       = ["Americas", "Europe", "APAC", "Middle East", "Africa"];
const ROLES         = ["Trader", "Risk Manager", "Analyst", "Portfolio Manager"];
const VOLUMES       = ["low", "medium", "high"] as const;

interface Props {
  step: number;
  setStep: (n: number) => void;
  onComplete: (profile: Record<string, unknown>, token: string) => Promise<void>;
}

export default function OnboardingWizard({ step, setStep, onComplete }: Props) {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [assets, setAssets]     = useState<string[]>([]);
  const [regions, setRegions]   = useState<string[]>([]);
  const [role, setRole]         = useState("Analyst");
  const [risk, setRisk]         = useState(5);
  const [volume, setVolume]     = useState<"low" | "medium" | "high">("medium");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const toggle = (arr: string[], set: (a: string[]) => void, val: string) =>
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const handleAuth = async () => {
    setLoading(true); setError("");
    try {
      let res = await fetch(`${api}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }).catch(() => {
        // Backend unreachable — enter demo mode so the dashboard is still accessible
        localStorage.setItem("sv_token", "demo");
        router.replace("/dashboard");
        return null as unknown as Response;
      });
      if (!res) return;

      if (res.status === 401) {
        // New user — register then log in
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
        if (!res.ok) throw new Error("Login failed after registration — try again");
        const data = await res.json();
        localStorage.setItem("sv_token", data.access_token);
        setStep(2); // new user → complete onboarding
        return;
      }

      if (!res.ok) throw new Error("Login failed — check your password");
      const data = await res.json();
      localStorage.setItem("sv_token", data.access_token);
      // Existing user — skip onboarding, go straight to dashboard
      router.replace("/dashboard");
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

  const nodeClass = (n: number) =>
    step > n ? "bb-ob-node done" : step === n ? "bb-ob-node active" : "bb-ob-node";
  const connClass = (n: number) =>
    step > n ? "bb-ob-connector done" : "bb-ob-connector idle";

  return (
    <div style={{ background: "var(--bg)", border: "1px solid var(--bhi)", padding: 28, width: "100%", maxWidth: 400 }}>
      {/* Step nodes */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
        <div className={nodeClass(1)}>1</div>
        <div className={connClass(1)} />
        <div className={nodeClass(2)}>2</div>
        <div className={connClass(2)} />
        <div className={nodeClass(3)}>3</div>
        <div className={connClass(3)} />
        <div className={nodeClass(4)}>4</div>
      </div>

      {/* Step 1 — Auth */}
      {step === 1 && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--txt)", letterSpacing: -0.5, marginBottom: 4 }}>Account</h2>
          <p style={{ fontSize: 11, color: "var(--txt2)", marginBottom: 20 }}>Enter your email — we auto-register if you&apos;re new.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" className="bb-ob-input" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 8 chars)" className="bb-ob-input" />
          </div>
          {error && (
            <div style={{ fontSize: 10, color: "var(--red)", border: "1px solid var(--red-d)", background: "var(--red-d)", padding: "6px 10px", marginBottom: 12, letterSpacing: 0.5 }}>
              {error}
            </div>
          )}
          <button onClick={handleAuth} disabled={loading || !email || !password} className="bb-launch" style={{ width: "100%" }}>
            {loading ? "AUTHENTICATING..." : "CONTINUE →"}
          </button>
          <div style={{ marginTop: 10, fontSize: 9, color: "var(--txt3)", letterSpacing: 1, textAlign: "center" }}>
            NEW EMAIL = ACCOUNT CREATED AUTOMATICALLY
          </div>
        </div>
      )}

      {/* Step 2 — Asset classes */}
      {step === 2 && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--txt)", letterSpacing: -0.5, marginBottom: 4 }}>Markets</h2>
          <p style={{ fontSize: 11, color: "var(--txt2)", marginBottom: 20 }}>Select every asset class you monitor.</p>
          <span className="bb-ob-field">ASSET CLASSES</span>
          <div className="bb-ob-grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 20 }}>
            {ASSET_CLASSES.map((a) => (
              <div key={a} className={`bb-ob-opt${assets.includes(a) ? " sel" : ""}`} onClick={() => toggle(assets, setAssets, a)}>
                {assets.includes(a) && <span style={{ marginRight: 6 }}>✓</span>}{a}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8 }}>
            <button onClick={() => setStep(1)} className="bb-back">← BACK</button>
            <button onClick={() => setStep(3)} disabled={assets.length === 0} className="bb-launch">NEXT →</button>
          </div>
        </div>
      )}

      {/* Step 3 — Regions */}
      {step === 3 && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--txt)", letterSpacing: -0.5, marginBottom: 4 }}>Regions</h2>
          <p style={{ fontSize: 11, color: "var(--txt2)", marginBottom: 20 }}>Where are your positions concentrated?</p>
          <span className="bb-ob-field">GEOGRAPHIC EXPOSURE</span>
          <div className="bb-ob-grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 20 }}>
            {REGIONS.map((r) => (
              <div key={r} className={`bb-ob-opt${regions.includes(r) ? " sel" : ""}`} onClick={() => toggle(regions, setRegions, r)}>
                {regions.includes(r) && <span style={{ marginRight: 6 }}>✓</span>}{r}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8 }}>
            <button onClick={() => setStep(2)} className="bb-back">← BACK</button>
            <button onClick={() => setStep(4)} disabled={regions.length === 0} className="bb-launch">NEXT →</button>
          </div>
        </div>
      )}

      {/* Step 4 — Profile */}
      {step === 4 && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--txt)", letterSpacing: -0.5, marginBottom: 4 }}>Profile</h2>
          <p style={{ fontSize: 11, color: "var(--txt2)", marginBottom: 20 }}>Used to tune scoring weights to your workflow.</p>

          <span className="bb-ob-field">ROLE</span>
          <div className="bb-ob-grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 16 }}>
            {ROLES.map((r) => (
              <div key={r} className={`bb-ob-opt${role === r ? " sel" : ""}`} onClick={() => setRole(r)}>
                {r}
              </div>
            ))}
          </div>

          <span className="bb-ob-field">RISK TOLERANCE — {risk} / 10</span>
          <input type="range" min={1} max={10} value={risk} onChange={(e) => setRisk(+e.target.value)}
            style={{ width: "100%", accentColor: "var(--live)", margin: "8px 0 2px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--txt3)", letterSpacing: 1, marginBottom: 16 }}>
            <span>CONSERVATIVE</span><span>AGGRESSIVE</span>
          </div>

          <span className="bb-ob-field">ALERT VOLUME</span>
          <div className="bb-ob-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", marginBottom: 20 }}>
            {VOLUMES.map((v) => (
              <div key={v} className={`bb-ob-opt${volume === v ? " sel" : ""}`} onClick={() => setVolume(v)}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--bdr)" }}>
            <button onClick={() => setStep(3)} className="bb-back">← BACK</button>
            <button onClick={handleSubmit} disabled={loading} className="bb-launch">
              {loading ? "LAUNCHING..." : "LAUNCH SENTINELVAULT →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
