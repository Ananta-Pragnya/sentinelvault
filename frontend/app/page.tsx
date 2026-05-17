"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const MOCK_ALERTS = [
  { id: "SV-4821", severity: "critical", color: "var(--red)", title: "Federal Reserve emergency signal cluster", body: "FOMC language model flags 4σ deviation. Bond futures repricing 40bps in 6 mins.", tickers: ["TLT", "SPY", "DXY"], score: 0.94, age: "2m" },
  { id: "SV-4820", severity: "high",     color: "var(--ora)", title: "Strait of Hormuz naval activity spike",   body: "Activity 3× above 30-day avg. Tanker insurance +18% in 6h.",               tickers: ["OIL", "XLE", "GLD"], score: 0.81, age: "7m" },
  { id: "SV-4819", severity: "critical", color: "var(--red)", title: "NASDAQ flash-crash pattern forming",      body: "Order book depth collapsed 94%. Algo cascade risk elevated.",                tickers: ["QQQ", "NQ1", "VIX"], score: 0.91, age: "11m" },
  { id: "SV-4818", severity: "medium",   color: "var(--yel)", title: "TSM options flow — pre-earnings signal", body: "Dark pool + implied vol compression. Informed positioning.",                 tickers: ["TSM", "SOXX", "NVDA"], score: 0.62, age: "18m" },
];
const SEV_SHORT: Record<string, string> = { critical: "CRIT", high: "HIGH", medium: "MED", low: "LOW" };

const TICKERS = [
  "TLT 98.34 -0.21%","SPY 512.08 +0.41%","QQQ 433.72 -0.18%","OIL 82.14 +1.24%",
  "GLD 192.40 +0.37%","BTC 68,241 +2.1%","EUR/USD 1.0821 -0.12%","VIX 14.32 -3.1%",
  "NVDA 874.20 +1.8%","DXY 104.32 +0.09%","AAPL 189.14 +0.56%","TSLA 177.54 -1.2%",
];

export default function LandingPage() {
  const [clock, setClock] = useState("");
  const [counts, setCounts] = useState({ signals: 0, precision: 0, latency: 0, events: 0 });
  const statsRef = useRef<HTMLDivElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("en-GB", { hour12: false, timeZone: "UTC" }) + " UTC");
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || counted.current) return;
      counted.current = true;
      const targets = { signals: 2400, precision: 94, latency: 180, events: 12000 };
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min((now - start) / 1200, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setCounts({
          signals:   Math.round(ease * targets.signals),
          precision: Math.round(ease * targets.precision),
          latency:   Math.round(ease * targets.latency),
          events:    Math.round(ease * targets.events),
        });
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const DOUBLED = [...TICKERS, ...TICKERS];

  return (
    <div style={{ background: "var(--bg)", color: "var(--txt)", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, minHeight: "100vh" }}>

      {/* ── Ticker bar ── */}
      <div className="ticker-wrap" style={{ background: "var(--bg2)", borderBottom: "1px solid var(--bdr)", padding: "5px 0", height: 28 }}>
        <div className="ticker-inner">
          {DOUBLED.map((t, i) => (
            <span key={i} style={{ padding: "0 20px", color: "var(--txt2)", fontSize: 11, letterSpacing: 1, borderRight: "1px solid var(--bdr)", flexShrink: 0 }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="bb-nav">
        <div style={{ display: "flex", alignItems: "center" }}>
          <span className="bb-brand">SENTINELVAULT</span>
          <div className="bb-live-badge"><span className="bb-live-dot" /><span>LIVE</span></div>
        </div>
        <div className="bb-nav-links">
          <a href="#how"     className="bb-nav-link">HOW IT WORKS</a>
          <a href="#demo"    className="bb-nav-link">DEMO</a>
          <a href="#scoring" className="bb-nav-link">SCORING</a>
        </div>
        <div className="bb-nav-right">
          <Link href="/onboarding" className="bb-nav-btn" style={{ textDecoration: "none" }}>SIGN IN</Link>
          <Link href="/onboarding" className="bb-nav-btn primary" style={{ textDecoration: "none" }}>GET ACCESS</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid var(--bdr)" }}>
        <div style={{ padding: "48px 40px", borderRight: "1px solid var(--bdr)" }}>
          <div className="bb-hero-tag"><span className="bb-live-dot" />LIVE INTELLIGENCE FEED · {clock}</div>
          <h1 className="bb-hero-h1">Every signal<br />that <em>matters</em><br />to you.</h1>
          <p className="bb-hero-sub">
            Global news, market feeds, and macro releases — ingested, scored, and delivered as alerts ranked to your portfolio and risk appetite. No noise. No lag.
          </p>
          <div style={{ display: "flex", border: "1px solid var(--bhi)", marginBottom: 24 }}>
            <Link href="/onboarding" className="bb-btn-white" style={{ textDecoration: "none" }}>START FREE — 2 MIN</Link>
            <a href="#demo" className="bb-btn-ghost">SEE LIVE ALERTS ↓</a>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <div className="bb-trust-item">NO CREDIT CARD</div>
            <div className="bb-trust-item">REAL-TIME</div>
            <div className="bb-trust-item">RLHF SCORING</div>
          </div>
          {/* Mini spec grid */}
          <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid var(--bdr)" }}>
            {[
              { k: "SOURCES",  v: "NewsAPI · RSS · Market feed" },
              { k: "ML MODEL", v: "IsolationForest + LLaMA 70B" },
              { k: "PROTOCOL", v: "WebSocket — real-time push" },
              { k: "FEEDBACK", v: "RLHF weight update on act" },
            ].map((row, i) => (
              <div key={row.k} style={{
                padding: "10px 14px",
                borderBottom: i < 2 ? "1px solid var(--bdr)" : "none",
                borderRight: i % 2 === 0 ? "1px solid var(--bdr)" : "none",
              }}>
                <div style={{ fontSize: 9, color: "var(--txt3)", letterSpacing: 1.5, marginBottom: 3 }}>{row.k}</div>
                <div style={{ fontSize: 10, color: "var(--txt2)" }}>{row.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Live terminal preview */}
        <div style={{ display: "flex", flexDirection: "column" }} id="demo">
          <div className="bb-terminal-bar">
            <span className="bb-terminal-title">SENTINELVAULT — LIVE FEED</span>
            <span className="bb-terminal-live"><span className="bb-live-dot" />LIVE</span>
          </div>
          {MOCK_ALERTS.map((a) => (
            <div key={a.id} className="bb-alert">
              <div className="bb-sev-col">
                <div className="bb-sev-bar" style={{ background: a.color }} />
                <div className="bb-sev-label" style={{ color: a.color }}>{SEV_SHORT[a.severity]}</div>
              </div>
              <div>
                <div className="bb-alert-title">{a.title}</div>
                <div className="bb-alert-body">{a.body}</div>
                <div className="bb-alert-meta">
                  {a.tickers.map((t) => <span key={t} className="bb-tick">{t}</span>)}
                </div>
              </div>
              <div className="bb-alert-right">
                <div className="bb-alert-id">{a.id}</div>
                <div className="bb-alert-age">{a.age} ago</div>
                <div className="bb-score-num" style={{ color: a.color }}>{a.score.toFixed(2)}</div>
                <div className="bb-score-track">
                  <div className="bb-score-fill" style={{ width: `${a.score * 100}%`, background: a.color }} />
                </div>
              </div>
            </div>
          ))}
          <div style={{ padding: "8px 16px", borderTop: "1px solid var(--bdr)", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, color: "var(--txt3)", letterSpacing: 1 }}>4 ACTIVE · {clock}</span>
            <Link href="/onboarding" style={{ fontSize: 10, color: "var(--txt2)", letterSpacing: 1, textDecoration: "none" }}>VIEW ALL →</Link>
          </div>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div ref={statsRef} style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderBottom: "1px solid var(--bdr)" }}>
        <div className="bb-stat"><div className="bb-stat-n">{counts.signals.toLocaleString()}+</div><div className="bb-stat-l">SIGNALS / HOUR</div></div>
        <div className="bb-stat"><div className="bb-stat-n">{counts.precision}%</div><div className="bb-stat-l">ALERT PRECISION</div></div>
        <div className="bb-stat"><div className="bb-stat-n">{counts.latency}ms</div><div className="bb-stat-l">DETECTION LATENCY</div></div>
        <div className="bb-stat"><div className="bb-stat-n">{counts.events.toLocaleString()}+</div><div className="bb-stat-l">EVENTS / DAY</div></div>
      </div>

      {/* ── Pipeline ── */}
      <div id="how" style={{ padding: "40px", borderBottom: "1px solid var(--bdr)" }}>
        <div style={{ fontSize: 9, letterSpacing: 3, color: "var(--txt3)", marginBottom: 24 }}>
          SIGNAL TO BRIEF — UNDER 200ms — FIVE DETERMINISTIC LAYERS
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", border: "1px solid var(--bdr)" }}>
          {[
            { n: "01", name: "Ingest",     desc: "NewsAPI · RSS · Market feeds · Macro releases. Deduplicated before enrichment." },
            { n: "02", name: "Enrich",     desc: "NLP entity extraction · geo-tagging · novelty scoring via sentence embeddings." },
            { n: "03", name: "Score",      desc: "IsolationForest anomaly detection. S = w₁·Impact + w₂·Proximity + w₃·Velocity + w₄·Novelty." },
            { n: "04", name: "Synthesise", desc: "LLaMA 70B → 3-sentence brief + 5-bullet rationale chain grounded in evidence." },
            { n: "05", name: "Deliver",    desc: "WebSocket push to dashboard. RLHF weight update on acted/dismissed feedback." },
          ].map((s, i) => (
            <div key={s.n} className="bb-how-step" style={{ borderRight: i < 4 ? "1px solid var(--bdr)" : "none" }}>
              <div className="bb-how-step-num">{s.n}</div>
              <div className="bb-how-step-name">{s.name}</div>
              <div className="bb-how-step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Scoring + dashboard preview ── */}
      <div id="scoring" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid var(--bdr)" }}>
        <div style={{ padding: "40px", borderRight: "1px solid var(--bdr)" }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: "var(--txt3)", marginBottom: 24 }}>SCORING FORMULA</div>
          <div className="bb-formula">
            S = w₁·Impact<br />
            &nbsp;&nbsp;&nbsp;+ w₂·Proximity<br />
            &nbsp;&nbsp;&nbsp;+ w₃·Velocity<br />
            &nbsp;&nbsp;&nbsp;+ w₄·Novelty
          </div>
          <div style={{ marginTop: 16, fontSize: 11, color: "var(--txt2)", lineHeight: 1.8 }}>
            Weights adapt through RLHF. When you mark an alert as{" "}
            <em style={{ color: "var(--live)", fontStyle: "normal" }}>acted</em>, the dominant weight increases by 0.02.{" "}
            <em style={{ color: "var(--red)", fontStyle: "normal" }}>Dismiss</em> it and proximity pulls back.
          </div>

          <div style={{ marginTop: 24, fontSize: 9, letterSpacing: 2, color: "var(--txt3)", marginBottom: 12 }}>SEVERITY THRESHOLDS</div>
          {[
            { label: "CRITICAL", val: "S ≥ 0.85", color: "var(--red)", pct: 85 },
            { label: "HIGH",     val: "S ≥ 0.65", color: "var(--ora)", pct: 65 },
            { label: "MEDIUM",   val: "S ≥ 0.40", color: "var(--yel)", pct: 40 },
            { label: "LOW",      val: "S < 0.40",  color: "var(--txt3)", pct: 20 },
          ].map((r) => (
            <div key={r.label} className="bb-wt-row" style={{ marginBottom: 6 }}>
              <span className="bb-wt-label" style={{ color: r.color, width: 80 }}>{r.label}</span>
              <div className="bb-wt-track"><div className="bb-wt-fill" style={{ width: `${r.pct}%`, background: r.color }} /></div>
              <span className="bb-wt-pct" style={{ width: 64, color: r.color }}>{r.val}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: "40px" }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: "var(--txt3)", marginBottom: 24 }}>DASHBOARD STRUCTURE</div>
          <div style={{ border: "1px solid var(--bdr)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 100px", borderBottom: "1px solid var(--bdr)", height: 22, background: "var(--bg2)" }}>
              {["SIDEBAR", "ALERT FEED", "DETAIL"].map((h, i) => (
                <div key={h} style={{ borderRight: i < 2 ? "1px solid var(--bdr)" : "none", padding: "4px 8px", fontSize: 8, color: "var(--txt3)", letterSpacing: 1 }}>{h}</div>
              ))}
            </div>
            {[
              ["SYSTEM · LIVE", "CRITICAL: Fed Reserve...", "AI RATIONALE"],
              ["ALERTS: 2 CRIT", "HIGH: Hormuz spike...", "EVIDENCE"],
              ["EXPOSURE: HIGH", "MEDIUM: Options flow...", "SCORE WEIGHTS"],
              ["RLHF: 3 ACTED", "LOW: Routine update...", "RLHF WEIGHTS"],
            ].map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "80px 1fr 100px", borderBottom: i < 3 ? "1px solid var(--bdr)" : "none", height: 20 }}>
                <div style={{ borderRight: "1px solid var(--bdr)", padding: "3px 8px", fontSize: 8, color: "var(--txt3)" }}>{row[0]}</div>
                <div style={{ borderRight: "1px solid var(--bdr)", padding: "3px 8px", fontSize: 8, color: "var(--txt2)" }}>{row[1]}</div>
                <div style={{ padding: "3px 8px", fontSize: 8, color: i === 0 ? "var(--live)" : "var(--txt3)" }}>{row[2]}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, fontSize: 9, letterSpacing: 2, color: "var(--txt3)", marginBottom: 12 }}>RLHF FEEDBACK LOOP</div>
          {[
            { a: "ACTED →",        d: "+0.02 on dominant weight" },
            { a: "DISMISSED →",    d: "-0.01 across all weights" },
            { a: "ACKNOWLEDGED →", d: "no change — marked seen" },
          ].map((r) => (
            <div key={r.a} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--bdr)" }}>
              <span style={{ fontSize: 10, color: "var(--live)", letterSpacing: 1 }}>{r.a}</span>
              <span style={{ fontSize: 10, color: "var(--txt2)" }}>{r.d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ padding: "64px 40px", textAlign: "center", borderBottom: "1px solid var(--bdr)" }}>
        <h2 className="bb-cta-h">Your edge is <em>200ms</em> away.</h2>
        <p className="bb-cta-sub">SET YOUR RISK WEIGHTS. WE HANDLE THE REST.</p>
        <div style={{ display: "inline-flex", border: "1px solid var(--bhi)" }}>
          <Link href="/onboarding" className="bb-btn-white" style={{ textDecoration: "none" }}>CREATE ACCOUNT — FREE</Link>
          <a href="#" className="bb-btn-ghost">BACK TO TOP ↑</a>
        </div>
        <div className="bb-cta-micro">NO CREDIT CARD · 2-MINUTE SETUP · CANCEL ANY TIME</div>
      </div>

      {/* ── Footer ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", background: "var(--bg2)", borderTop: "1px solid var(--bdr)" }}>
        <span style={{ fontSize: 9, color: "var(--txt3)", letterSpacing: 2 }}>SENTINELVAULT · REAL-TIME MARKET INTELLIGENCE</span>
        <span style={{ fontSize: 9, color: "var(--txt3)", letterSpacing: 1 }}>{clock}</span>
      </div>
    </div>
  );
}
