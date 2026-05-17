"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const MOCK_ALERTS = [
  { id: "1", severity: "critical", title: "Federal Reserve unexpected rate signal detected", summary: "Unusual language in FOMC minutes suggests emergency meeting probability above baseline. Bond markets pricing in 40bps move.", asset_tags: ["USD", "TLT", "SPY"], score: 0.94, ago: "2m ago" },
  { id: "2", severity: "high", title: "Geopolitical tension spike — Strait of Hormuz", summary: "Naval activity 3× above 30-day average. Energy futures reacting. Tanker insurance premiums up 18% in 6 hours.", asset_tags: ["OIL", "XLE", "GLD"], score: 0.81, ago: "7m ago" },
  { id: "3", severity: "critical", title: "Flash crash pattern forming on NASDAQ futures", summary: "Order book depth at critical support collapsed 94%. Similar signature to Aug 2024 event. Algo cascade risk elevated.", asset_tags: ["QQQ", "NQ1", "VIX"], score: 0.91, ago: "11m ago" },
  { id: "4", severity: "medium", title: "Taiwan Semiconductor earnings pre-leak indicators", summary: "Options flow and dark pool activity suggests informed positioning ahead of earnings. Implied vol compression anomaly.", asset_tags: ["TSM", "SOXX", "NVDA"], score: 0.62, ago: "18m ago" },
  { id: "5", severity: "high", title: "Chinese yuan devaluation signal cluster", summary: "PBOC fixing deviating from model by 3.2σ. Capital outflow indicators rising. Offshore CNH pressure building.", asset_tags: ["CNH", "FXI", "EEM"], score: 0.77, ago: "24m ago" },
  { id: "6", severity: "low", title: "ECB board member dovish pivot — unscheduled speech", summary: "Language diverges significantly from last official statement. EUR/USD pair pricing in 30bps of cuts not previously expected.", asset_tags: ["EUR", "FEZ", "EZU"], score: 0.44, ago: "31m ago" },
  { id: "7", severity: "high", title: "Sovereign debt stress — emerging market contagion", summary: "Credit default swap spreads widening simultaneously across 6 EM sovereigns. Historical contagion pattern match: 87%.", asset_tags: ["EMB", "HYG", "EM CDS"], score: 0.79, ago: "38m ago" },
];

const SEVERITY_CONFIG = {
  critical: { color: "text-sentinel-critical", bg: "bg-sentinel-critical/10", border: "border-sentinel-critical/30", dot: "bg-sentinel-critical", label: "CRITICAL" },
  high:     { color: "text-sentinel-high",     bg: "bg-sentinel-high/10",     border: "border-sentinel-high/30",     dot: "bg-sentinel-high",     label: "HIGH"     },
  medium:   { color: "text-sentinel-medium",   bg: "bg-sentinel-medium/10",   border: "border-sentinel-medium/30",   dot: "bg-sentinel-medium",   label: "MEDIUM"   },
  low:      { color: "text-sentinel-low",      bg: "bg-sentinel-low/10",      border: "border-sentinel-low/30",      dot: "bg-sentinel-low",      label: "LOW"      },
} as const;

const FEATURES = [
  { icon: "⚡", title: "Real-time ingestion", desc: "NewsAPI + RSS + market feeds processed in under 200ms. Every signal captured." },
  { icon: "🧠", title: "AI synthesis", desc: "Groq LLaMA 70B distils noise into a 3-sentence brief with causal chain reasoning." },
  { icon: "🗺️", title: "Geo-tagged world map", desc: "Every alert pinned to origin coordinates. See risk clusters forming before they spread." },
  { icon: "📐", title: "Personalised scoring", desc: "S = w1·Impact + w2·Proximity + w3·Velocity + w4·Novelty, tuned to your portfolio." },
  { icon: "🔁", title: "RLHF feedback loop", desc: "Act, Ack, or Dismiss. The model learns your risk appetite with every interaction." },
  { icon: "💬", title: "AI assistant", desc: "Ask 'what's my biggest EM exposure right now?' and get a cited, alert-grounded answer." },
];

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sentinel-low/10 border border-sentinel-low/30 text-sentinel-low text-xs font-semibold">
      <span className="w-1.5 h-1.5 rounded-full bg-sentinel-low animate-pulse" />
      LIVE FEED
    </span>
  );
}

function MockAlertCard({ alert, visible }: { alert: typeof MOCK_ALERTS[0]; visible: boolean }) {
  const cfg = SEVERITY_CONFIG[alert.severity as keyof typeof SEVERITY_CONFIG];
  return (
    <div className={`sentinel-card p-4 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.border} ${cfg.color} border`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Score {alert.score.toFixed(2)}</span>
          <span>{alert.ago}</span>
        </div>
      </div>
      <h4 className="text-sm font-semibold text-white mb-1 leading-snug">{alert.title}</h4>
      <p className="text-xs text-slate-400 leading-relaxed mb-3">{alert.summary}</p>
      <div className="flex flex-wrap gap-1">
        {alert.asset_tags.map((tag) => (
          <span key={tag} className="text-xs px-2 py-0.5 bg-sentinel-border/50 rounded text-slate-400">{tag}</span>
        ))}
      </div>
    </div>
  );
}

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function LandingPage() {
  const router = useRouter();
  const [visibleAlerts, setVisibleAlerts] = useState([0, 1, 2]);
  const [tick, setTick] = useState(0);

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem("sv_token");
    if (token) router.replace("/dashboard");
  }, [router]);

  // Cycle alerts in the demo feed
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const base = tick % MOCK_ALERTS.length;
    setVisibleAlerts([base, (base + 1) % MOCK_ALERTS.length, (base + 2) % MOCK_ALERTS.length]);
  }, [tick]);

  return (
    <div className="min-h-screen bg-sentinel-bg text-white overflow-x-hidden">

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-sentinel-border/50 sticky top-0 z-50 bg-sentinel-bg/80 backdrop-blur-md">
        <span className="text-lg font-bold text-sentinel-accent tracking-tight">SentinelVault</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/onboarding")}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Sign in
          </button>
          <button
            onClick={() => router.push("/onboarding")}
            className="px-4 py-2 text-sm font-semibold bg-sentinel-accent text-sentinel-bg rounded-lg hover:opacity-90 transition-opacity"
          >
            Get started free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-8 pt-24 pb-16 max-w-6xl mx-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-sentinel-accent/5 via-transparent to-sentinel-critical/5 pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="mb-6">
            <LiveBadge />
          </div>

          <h1 className="text-5xl font-extrabold leading-tight mb-6">
            Know what's moving markets{" "}
            <span className="text-sentinel-accent">before it moves you.</span>
          </h1>

          <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-2xl">
            SentinelVault ingests global news, market feeds, and macro signals in real time.
            AI distils the noise into personalised, scored alerts — so you act on signal, not rumour.
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/onboarding")}
              className="px-6 py-3 bg-sentinel-accent text-sentinel-bg font-bold rounded-xl hover:opacity-90 transition-opacity text-sm"
            >
              Start for free →
            </button>
            <button
              onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })}
              className="px-6 py-3 border border-sentinel-border text-slate-300 font-medium rounded-xl hover:border-slate-500 transition-colors text-sm"
            >
              See it live ↓
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-sentinel-border/50 bg-sentinel-card/30">
        <div className="max-w-6xl mx-auto px-8 py-10 grid grid-cols-3 gap-8">
          {[
            { value: 2400, suffix: "+", label: "Signals processed / hour" },
            { value: 94, suffix: "%", label: "Alert precision rate" },
            { value: 180, suffix: "ms", label: "Median detection latency" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-extrabold text-sentinel-accent mb-1">
                <AnimatedCounter target={s.value} suffix={s.suffix} />
              </div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Live demo */}
      <section id="demo" className="max-w-6xl mx-auto px-8 py-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Watch it work</h2>
            <p className="text-slate-400 text-sm">Live demo feed — alerts cycling in real time. No account needed.</p>
          </div>
          <LiveBadge />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alert feed */}
          <div className="space-y-3">
            {visibleAlerts.map((idx, i) => (
              <MockAlertCard key={`${idx}-${i}`} alert={MOCK_ALERTS[idx]} visible={true} />
            ))}
          </div>

          {/* Right panel: score breakdown + rationale */}
          <div className="space-y-4">
            <div className="sentinel-card p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">AI Rationale — top alert</h3>
              <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
                {[
                  "FOMC minutes language model flagged 4 semantic divergences from prior statement",
                  "Fed funds futures repriced 23bps within 8 minutes of release",
                  "Correlation with 2023-03 SVB event signature: 0.81",
                  "Treasury yield curve inversion deepening — historical recession pre-signal",
                  "Equity put/call ratio spike confirms institutional hedging activity",
                ].map((bullet, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-sentinel-accent mt-0.5 shrink-0">•</span>
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="sentinel-card p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Score breakdown</h3>
              {[
                { label: "Impact", value: 0.92, color: "bg-sentinel-critical" },
                { label: "Proximity", value: 0.88, color: "bg-sentinel-high" },
                { label: "Velocity", value: 0.95, color: "bg-sentinel-accent" },
                { label: "Novelty", value: 0.71, color: "bg-sentinel-low" },
              ].map((s) => (
                <div key={s.label} className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{s.label}</span>
                    <span className="text-white font-mono">{s.value.toFixed(2)}</span>
                  </div>
                  <div className="h-1.5 bg-sentinel-border rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} rounded-full transition-all duration-1000`} style={{ width: `${s.value * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="sentinel-card p-5 border-sentinel-accent/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sentinel-accent text-lg">💬</span>
                <h3 className="text-sm font-semibold text-slate-300">AI Assistant preview</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="bg-sentinel-border/30 rounded-lg p-3 text-slate-400">
                  What's my biggest risk exposure right now?
                </div>
                <div className="bg-sentinel-accent/10 border border-sentinel-accent/20 rounded-lg p-3 text-slate-300 leading-relaxed">
                  Based on alerts #3 and #1 in the last hour, your highest exposure is <span className="text-sentinel-accent">rate-sensitive equities</span> (QQQ, SPY). The Fed signal cluster carries a 94% severity score — consider reviewing duration risk and hedging with TLT puts.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-sentinel-card/20 border-t border-sentinel-border/50">
        <div className="max-w-6xl mx-auto px-8 py-20">
          <h2 className="text-3xl font-bold mb-3 text-center">Everything in one place</h2>
          <p className="text-slate-400 text-center mb-12 text-sm">From raw signal to actionable brief in under a second.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="sentinel-card p-5 hover:border-slate-600 transition-colors">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="text-sm font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-8 py-20 text-center">
        <h2 className="text-4xl font-extrabold mb-4">
          Stop reading. Start{" "}
          <span className="text-sentinel-accent">knowing.</span>
        </h2>
        <p className="text-slate-400 mb-8 max-w-lg mx-auto text-sm leading-relaxed">
          Set up your risk profile in 2 minutes. SentinelVault starts scoring alerts to your weights immediately.
        </p>
        <button
          onClick={() => router.push("/onboarding")}
          className="px-8 py-4 bg-sentinel-accent text-sentinel-bg font-bold rounded-xl hover:opacity-90 transition-opacity text-sm"
        >
          Create your account →
        </button>
        <p className="text-xs text-slate-600 mt-4">Free tier · No credit card</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-sentinel-border/50 px-8 py-6 text-center text-xs text-slate-600">
        SentinelVault — AI Alert Intelligence Platform
      </footer>
    </div>
  );
}
