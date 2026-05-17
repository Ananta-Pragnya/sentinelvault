"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

/* ─── Mock data ────────────────────────────────────────────────── */

const TICKER_ITEMS = [
  { sym: "SPY",  val: "+0.34%", up: true  },
  { sym: "QQQ",  val: "-1.12%", up: false },
  { sym: "TLT",  val: "+0.89%", up: true  },
  { sym: "GLD",  val: "+2.14%", up: true  },
  { sym: "VIX",  val: "+18.4",  up: false },
  { sym: "DXY",  val: "-0.23%", up: false },
  { sym: "OIL",  val: "+3.71%", up: true  },
  { sym: "BTC",  val: "-4.52%", up: false },
  { sym: "NQ1",  val: "-1.87%", up: false },
  { sym: "EUR",  val: "+0.12%", up: true  },
  { sym: "CNH",  val: "-0.44%", up: false },
  { sym: "TSM",  val: "+1.93%", up: true  },
];

const ALERTS = [
  {
    id: "A1", sev: "critical", sev_color: "#EF4444",
    title: "Federal Reserve emergency signal cluster",
    summary: "FOMC language model flags 4σ deviation. Bond futures repricing 40bps in 6 mins.",
    tags: ["TLT", "SPY", "DXY"], score: 0.94, ts: "00:02:14", seq: "SV-4821",
    bullets: ["Language divergence from prior statement: +4 semantic markers","Fed funds futures repriced $180B notional within 8 minutes","Correlation with March 2023 SVB signature: 0.81","Treasury curve inversion deepening at 2Y-10Y spread"],
  },
  {
    id: "A2", sev: "high", sev_color: "#F97316",
    title: "Strait of Hormuz naval activity spike",
    summary: "Activity 3× above 30-day avg. Tanker insurance premiums +18% in 6h. Energy reacting.",
    tags: ["OIL", "XLE", "GLD"], score: 0.81, ts: "00:07:38", seq: "SV-4820",
    bullets: ["AIS tracking anomalies across 14 vessels","Lloyd's war risk premiums spiking in real time","Historical match to April 2019 pattern: 0.77"],
  },
  {
    id: "A3", sev: "critical", sev_color: "#EF4444",
    title: "NASDAQ flash-crash pattern forming",
    summary: "Order book depth at key support collapsed 94%. Algo cascade risk elevated.",
    tags: ["QQQ", "NQ1", "VIX"], score: 0.91, ts: "00:11:02", seq: "SV-4819",
    bullets: ["Level-2 book depth erosion: 94% at 438.50","Put/call ratio spiked to 2.1 in last 15 minutes","Dark pool print activity 6× above baseline"],
  },
  {
    id: "A4", sev: "medium", sev_color: "#EAB308",
    title: "TSM options flow — pre-earnings signal",
    summary: "Dark pool + implied vol compression suggests informed positioning.",
    tags: ["TSM", "SOXX", "NVDA"], score: 0.62, ts: "00:18:45", seq: "SV-4818",
    bullets: ["IV compression 3 days pre-earnings: anomaly","Unusual call sweep: 4,200 contracts at 185 strike","Institutional block prints above offer"],
  },
];

const PIPELINE = [
  { n: "01", label: "Ingest",    desc: "NewsAPI · RSS · Market feeds · Macro releases", icon: "⬇" },
  { n: "02", label: "Enrich",    desc: "NLP entity extraction · geo-tagging · deduplication · novelty scoring", icon: "◈" },
  { n: "03", label: "Score",     desc: "IsolationForest anomaly · causal chain · S = w₁·Impact + w₂·Proximity + w₃·Velocity + w₄·Novelty", icon: "◐" },
  { n: "04", label: "Synthesise", desc: "Groq LLaMA 70B → 3-sentence brief + 5-bullet rationale chain", icon: "◉" },
  { n: "05", label: "Deliver",   desc: "WebSocket push → dashboard · RLHF weight update on feedback", icon: "↗" },
];

/* ─── Sub-components ────────────────────────────────────────────── */

function Ticker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="ticker-wrap h-8 border-b border-sv-border flex items-center bg-sv-surface">
      <div className="ticker-inner gap-8 px-4">
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 text-xs mono">
            <span className="text-sv-dim">{item.sym}</span>
            <span className={item.up ? "text-sv-green" : "text-sv-red"}>{item.val}</span>
            <span className="text-sv-border mx-2">|</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function SevPill({ sev, color }: { sev: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] mono font-semibold tracking-widest uppercase"
      style={{ color, background: `${color}18`, border: `1px solid ${color}40` }}
    >
      <span className="w-1 h-1 rounded-full" style={{ background: color }} />
      {sev}
    </span>
  );
}

function LiveAlertCard({ alert, delay = 0 }: { alert: typeof ALERTS[0]; delay?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  return (
    <div
      className={`card hover-lift p-4 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      style={{ borderLeft: `2px solid ${alert.sev_color}` }}
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <SevPill sev={alert.sev} color={alert.sev_color} />
        <div className="flex items-center gap-3 shrink-0">
          <span className="mono text-[10px] text-sv-muted">{alert.seq}</span>
          <span className="mono text-[10px] text-sv-muted">{alert.ts}</span>
        </div>
      </div>

      <h4 className="text-sm font-semibold text-sv-text mb-1.5 leading-snug">{alert.title}</h4>
      <p className="text-[11px] text-sv-dim leading-relaxed mb-3">{alert.summary}</p>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {alert.tags.map((t) => (
            <span key={t} className="mono text-[10px] px-1.5 py-0.5 bg-sv-raised border border-sv-border rounded-sm text-sv-muted">{t}</span>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-12 h-1 bg-sv-border rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${alert.score * 100}%`, background: alert.sev_color }} />
          </div>
          <span className="mono text-[10px] text-sv-dim">{alert.score.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function StatCounter({ value, suffix, label, delay = 0 }: { value: number; suffix: string; label: string; delay?: number }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const timer = setTimeout(() => {
      let s = 0;
      const step = value / 50;
      const iv = setInterval(() => {
        s += step;
        if (s >= value) { setCount(value); clearInterval(iv); }
        else setCount(Math.floor(s));
      }, 20);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(timer);
  }, [started, value, delay]);

  return (
    <div ref={ref} className="text-center">
      <div className="mono text-4xl font-semibold gradient-text mb-1">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-xs text-sv-muted tracking-wide uppercase">{label}</div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────── */

export default function LandingPage() {
  const router = useRouter();
  const [cycle, setCycle] = useState(0);
  const [activeAlert, setActiveAlert] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("sv_token");
      if (token) router.replace("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    const iv = setInterval(() => setCycle((c) => c + 1), 4000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    setActiveAlert(cycle % ALERTS.length);
  }, [cycle]);

  const active = ALERTS[activeAlert];

  return (
    <div className="min-h-screen bg-sv-bg text-sv-text overflow-x-hidden">

      {/* Live ticker */}
      <Ticker />

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-sv-border bg-sv-bg/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-sm bg-sv-amber flex items-center justify-center">
              <span className="text-sv-bg text-[10px] font-black">SV</span>
            </div>
            <span className="font-bold text-sv-text tracking-tight">SentinelVault</span>
            <span className="intel-tag ml-2">BETA</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs text-sv-dim">
            <button onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-sv-text transition-colors">How it works</button>
            <button onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-sv-text transition-colors">Live demo</button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/onboarding")} className="btn-ghost text-xs">Sign in</button>
            <button onClick={() => router.push("/onboarding")} className="btn-primary text-xs">
              Get access
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative grid-bg min-h-[88vh] flex items-center overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[400px] rounded-full bg-sv-amber opacity-[0.03] blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] rounded-full bg-sv-red opacity-[0.04] blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 py-16 w-full grid lg:grid-cols-2 gap-12 items-center">

          {/* Left — copy */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center gap-2 intel-tag">
                <span className="w-1.5 h-1.5 rounded-full bg-sv-green pulse-dot relative" />
                LIVE INTELLIGENCE FEED
              </div>
              <span className="mono text-[10px] text-sv-muted">{new Date().toUTCString().replace("GMT", "UTC")}</span>
            </div>

            <h1 className="text-[56px] lg:text-[72px] font-black leading-[0.95] tracking-[-0.03em] mb-6">
              <span className="text-sv-text block">Every market</span>
              <span className="text-sv-text block">signal that</span>
              <span className="text-sv-amber block">matters to you.</span>
            </h1>

            <p className="text-sv-dim text-base leading-relaxed max-w-lg mb-8">
              SentinelVault ingests global news, market feeds, and macro releases in real time.
              AI distils it into <span className="text-sv-text font-medium">scored, personalised alerts</span> — ranked to your portfolio and risk appetite.
            </p>

            <div className="flex items-center gap-3 mb-10">
              <button onClick={() => router.push("/onboarding")} className="btn-primary">
                Start free — 2 min setup
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })} className="btn-ghost">
                See live alerts ↓
              </button>
            </div>

            {/* Trust strip */}
            <div className="flex items-center gap-6 text-[11px] text-sv-muted">
              {["No credit card", "Real-time ingestion", "RLHF personalisation"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <span className="text-sv-green">✓</span> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right — live terminal */}
          <div className="relative">
            {/* Terminal chrome */}
            <div className="card glow-amber overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-sv-border bg-sv-raised">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-sv-red opacity-70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-sv-yellow opacity-70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-sv-green opacity-70" />
                </div>
                <span className="mono text-[10px] text-sv-muted">sentinelvault — live alerts</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sv-green pulse-dot relative" />
                  <span className="mono text-[10px] text-sv-green">LIVE</span>
                </div>
              </div>

              <div className="p-3 space-y-2.5 bg-sv-bg min-h-[380px]">
                {ALERTS.map((a, i) => (
                  <div
                    key={a.id}
                    onClick={() => setActiveAlert(i)}
                    className={`p-3 rounded-sm cursor-pointer transition-all duration-300 border ${
                      activeAlert === i
                        ? "border-sv-line bg-sv-surface"
                        : "border-transparent hover:border-sv-border hover:bg-sv-surface/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-full min-h-[28px] rounded-full shrink-0" style={{ background: a.sev_color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <SevPill sev={a.sev} color={a.sev_color} />
                          <span className="mono text-[10px] text-sv-muted ml-auto">{a.ts}</span>
                        </div>
                        <p className="text-xs font-medium text-sv-text leading-snug truncate">{a.title}</p>
                      </div>
                    </div>

                    {activeAlert === i && (
                      <div className="mt-2 pl-3.5">
                        <p className="text-[11px] text-sv-dim leading-relaxed mb-2">{a.summary}</p>
                        <div className="space-y-1">
                          {a.bullets.slice(0, 3).map((b, j) => (
                            <div key={j} className="flex gap-1.5 text-[10px] text-sv-muted">
                              <span style={{ color: a.sev_color }}>›</span>
                              <span>{b}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom bar */}
              <div className="border-t border-sv-border px-4 py-2 bg-sv-raised flex items-center justify-between">
                <span className="mono text-[10px] text-sv-muted">4 active alerts · last updated {new Date().toLocaleTimeString()}</span>
                <span className="mono text-[10px]" style={{ color: active.sev_color }}>SCORE {active.score.toFixed(2)}</span>
              </div>
            </div>

            {/* Floating score card */}
            <div className="absolute -right-4 -bottom-4 card p-3 w-44 glow-amber hidden lg:block">
              <div className="mono text-[10px] text-sv-muted mb-2 uppercase tracking-wider">Score breakdown</div>
              {[
                { l: "Impact",   v: 0.92, c: "#EF4444" },
                { l: "Velocity", v: 0.95, c: "#F59E0B" },
                { l: "Novelty",  v: 0.71, c: "#22C55E" },
              ].map((s) => (
                <div key={s.l} className="mb-1.5">
                  <div className="flex justify-between mono text-[9px] mb-0.5">
                    <span className="text-sv-dim">{s.l}</span>
                    <span className="text-sv-text">{s.v.toFixed(2)}</span>
                  </div>
                  <div className="h-1 bg-sv-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.v * 100}%`, background: s.c }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="border-y border-sv-border bg-sv-surface">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCounter value={2400}  suffix="+"  label="Signals / hour"       delay={0}   />
          <StatCounter value={94}    suffix="%"  label="Alert precision"      delay={100} />
          <StatCounter value={180}   suffix="ms" label="Detection latency"    delay={200} />
          <StatCounter value={12000} suffix="+"  label="Events processed daily" delay={300} />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-[280px_1fr] gap-16 items-start">
          <div className="lg:sticky lg:top-24">
            <div className="intel-tag mb-4">Under the hood</div>
            <h2 className="text-3xl font-bold mb-3 leading-tight">Signal to brief.<br/>Under 200ms.</h2>
            <p className="text-sv-dim text-sm leading-relaxed">
              Five deterministic layers — no black box. Every alert is traceable back to its raw source event.
            </p>
          </div>

          <div className="space-y-0">
            {PIPELINE.map((step, i) => (
              <div key={step.n} className="relative flex gap-6 group">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-9 h-9 rounded-sm flex items-center justify-center text-base shrink-0 transition-all group-hover:border-sv-amber"
                    style={{ background: "#111113", border: "1px solid #27272A" }}
                  >
                    <span style={{ color: "#F59E0B" }}>{step.icon}</span>
                  </div>
                  {i < PIPELINE.length - 1 && (
                    <div className="w-px flex-1 min-h-[40px] my-1" style={{ background: "#27272A" }} />
                  )}
                </div>

                {/* Content */}
                <div className="pb-8 pt-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="mono text-[10px] text-sv-muted">{step.n}</span>
                    <span className="font-semibold text-sv-text">{step.label}</span>
                  </div>
                  <p className="text-sm text-sv-dim leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── LIVE DEMO ── */}
      <section id="demo" className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex items-start justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="intel-tag mb-4">Live demo</div>
            <h2 className="text-3xl font-bold mb-2">Watch it think</h2>
            <p className="text-sv-dim text-sm max-w-md">No account required. These are representative alerts — the real feed starts the moment you sign up.</p>
          </div>
          <div className="flex items-center gap-2 intel-tag">
            <span className="w-1.5 h-1.5 rounded-full bg-sv-green pulse-dot relative" />
            SIMULATED FEED
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* Alert feed */}
          <div className="space-y-3">
            {ALERTS.map((a, i) => (
              <LiveAlertCard key={a.id} alert={a} delay={i * 120} />
            ))}
          </div>

          {/* Right panel */}
          <div className="space-y-4">
            {/* AI rationale */}
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded-sm bg-sv-amber/10 border border-sv-amber/30 flex items-center justify-center">
                  <span className="text-sv-amber text-xs">◈</span>
                </div>
                <span className="text-xs font-semibold text-sv-text">AI Rationale Chain</span>
                <span className="ml-auto intel-tag text-[9px]">GPT-70B</span>
              </div>
              <div className="space-y-2">
                {ALERTS[0].bullets.map((b, i) => (
                  <div key={i} className="flex gap-2.5 text-[11px]">
                    <span className="text-sv-amber mono shrink-0 mt-0.5">›</span>
                    <span className="text-sv-dim leading-relaxed">{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Score formula */}
            <div className="card p-4">
              <div className="mono text-[10px] text-sv-muted uppercase tracking-wider mb-3">Score formula</div>
              <div className="card-raised p-3 mb-3">
                <code className="mono text-[11px] text-sv-amber leading-relaxed">
                  S = w₁·Impact<br />
                  &nbsp;&nbsp;+ w₂·Proximity<br />
                  &nbsp;&nbsp;+ w₃·Velocity<br />
                  &nbsp;&nbsp;+ w₄·Novelty
                </code>
              </div>
              {[
                { l: "Impact",    v: 0.92, w: "35%", c: "#EF4444" },
                { l: "Proximity", v: 0.88, w: "30%", c: "#F97316" },
                { l: "Velocity",  v: 0.95, w: "20%", c: "#F59E0B" },
                { l: "Novelty",   v: 0.71, w: "15%", c: "#22C55E" },
              ].map((s) => (
                <div key={s.l} className="mb-2.5 last:mb-0">
                  <div className="flex justify-between mono text-[10px] mb-1">
                    <span className="text-sv-dim">{s.l} <span className="text-sv-muted">({s.w})</span></span>
                    <span style={{ color: s.c }}>{s.v.toFixed(2)}</span>
                  </div>
                  <div className="h-1.5 bg-sv-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${s.v * 100}%`, background: s.c }} />
                  </div>
                </div>
              ))}
            </div>

            {/* AI chat preview */}
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sv-amber text-sm">◉</span>
                <span className="text-xs font-semibold text-sv-text">AI Assistant</span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="card-raised rounded-sm p-3 text-sv-dim">
                  What's my biggest risk exposure right now?
                </div>
                <div className="p-3 rounded-sm text-sv-dim leading-relaxed border border-sv-amber/20 bg-sv-amber/5">
                  Based on <span className="text-sv-amber mono">SV-4821</span> and <span className="text-sv-amber mono">SV-4819</span>, your highest exposure sits in{" "}
                  <span className="text-sv-text font-medium">rate-sensitive equities</span> — QQQ and SPY carry the heaviest score-weighted exposure.
                  The Fed signal scores 0.94. Consider reviewing duration and hedging via TLT puts or VIX calls.
                </div>
                <div className="flex items-center gap-1 text-sv-muted mono text-[9px]">
                  <span className="w-1 h-1 rounded-full bg-sv-green" />
                  Grounded in 4 active alerts · 2 asset tags cited
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── CTA ── */}
      <section className="relative overflow-hidden py-28">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] rounded-full bg-sv-amber opacity-[0.04] blur-[100px] pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <div className="intel-tag inline-block mb-6">Ready when you are</div>
          <h2 className="text-5xl font-black tracking-tight mb-4">
            Your edge is{" "}
            <span className="gradient-text">200ms</span> away.
          </h2>
          <p className="text-sv-dim text-base max-w-lg mx-auto mb-10 leading-relaxed">
            Set your risk weights. We handle the rest — ingestion, scoring, synthesis, delivery.
            Every signal ranked to what you actually care about.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={() => router.push("/onboarding")} className="btn-primary text-sm">
              Create your account — free
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="btn-ghost text-sm">
              Back to top ↑
            </button>
          </div>

          <p className="mono text-[10px] text-sv-muted mt-6">No credit card · 2-minute setup · Cancel any time</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sv-border">
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-sv-amber flex items-center justify-center">
              <span className="text-sv-bg text-[8px] font-black">SV</span>
            </div>
            <span className="text-sm font-semibold text-sv-dim">SentinelVault</span>
          </div>
          <p className="mono text-[10px] text-sv-muted">© 2026 · AI Alert Intelligence Platform</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sv-green pulse-dot relative" />
            <span className="mono text-[10px] text-sv-green">All systems operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
