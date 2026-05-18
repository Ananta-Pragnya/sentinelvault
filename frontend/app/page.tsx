"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

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

  return (
    <div style={{ background: "var(--bg)", color: "var(--txt)", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, minHeight: "100vh" }}>

      {/* ── Nav ── */}
      <nav className="bb-nav">
        <div style={{ display: "flex", alignItems: "center" }}>
          <span className="bb-brand">SENTINELVAULT</span>
          <div className="bb-live-badge"><span className="bb-live-dot" /><span>LIVE</span></div>
        </div>
        <div className="bb-nav-links">
          <a href="#features"  className="bb-nav-link">FEATURES</a>
          <a href="#how"       className="bb-nav-link">HOW IT WORKS</a>
          <a href="#pricing"   className="bb-nav-link">PRICING</a>
        </div>
        <div className="bb-nav-right">
          <Link href="/onboarding" className="bb-nav-btn" style={{ textDecoration: "none" }}>SIGN IN</Link>
          <Link href="/onboarding" className="bb-nav-btn primary" style={{ textDecoration: "none" }}>GET ACCESS</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid var(--bdr)" }}>

        {/* Left: headline + CTA */}
        <div style={{ padding: "56px 40px", borderRight: "1px solid var(--bdr)" }}>
          <div className="bb-hero-tag"><span className="bb-live-dot" />AI-POWERED MARKET INTELLIGENCE · {clock}</div>
          <h1 className="bb-hero-h1">Every signal<br />that <em>matters</em><br />to you.</h1>
          <p className="bb-hero-sub">
            Global news, market feeds, and geopolitical events — ingested, scored by AI, and delivered as personalised alerts ranked to your portfolio and risk appetite.
          </p>
          <div style={{ display: "flex", border: "1px solid var(--bhi)", marginBottom: 24 }}>
            <Link href="/onboarding" className="bb-btn-white" style={{ textDecoration: "none" }}>GET ACCESS — FREE</Link>
            <a href="#features" className="bb-btn-ghost">SEE FEATURES ↓</a>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <div className="bb-trust-item">NO CREDIT CARD</div>
            <div className="bb-trust-item">REAL-TIME FEED</div>
            <div className="bb-trust-item">ADAPTIVE AI</div>
          </div>
        </div>

        {/* Right: key capabilities grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr" }}>
          {[
            {
              tag: "INTELLIGENCE",
              title: "Real-time signal detection",
              body: "Monitors thousands of global sources every minute. Anomalies surface in under 200ms.",
              color: "var(--live)",
            },
            {
              tag: "GEOPOLITICAL",
              title: "Global event mapping",
              body: "Live geopolitical flashpoints plotted on an interactive world map with severity scoring.",
              color: "var(--ora)",
            },
            {
              tag: "AI SYNTHESIS",
              title: "LLM-powered briefs",
              body: "Every alert comes with a 3-sentence AI summary and a 5-bullet evidence chain.",
              color: "var(--yel)",
            },
            {
              tag: "ADAPTIVE",
              title: "Learns from your actions",
              body: "RLHF feedback loop adjusts your scoring weights every time you act or dismiss an alert.",
              color: "var(--red)",
            },
          ].map((f, i) => (
            <div key={f.tag} style={{
              padding: "28px 24px",
              borderRight: i % 2 === 0 ? "1px solid var(--bdr)" : "none",
              borderBottom: i < 2 ? "1px solid var(--bdr)" : "none",
            }}>
              <div style={{ fontSize: 9, letterSpacing: "2px", color: f.color, marginBottom: 10 }}>{f.tag}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--txt)", marginBottom: 8, lineHeight: 1.4 }}>{f.title}</div>
              <div style={{ fontSize: 11, color: "var(--txt2)", lineHeight: 1.7 }}>{f.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div ref={statsRef} style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderBottom: "1px solid var(--bdr)" }}>
        <div className="bb-stat"><div className="bb-stat-n">{counts.signals.toLocaleString()}+</div><div className="bb-stat-l">SIGNALS / HOUR</div></div>
        <div className="bb-stat"><div className="bb-stat-n">{counts.precision}%</div><div className="bb-stat-l">ALERT PRECISION</div></div>
        <div className="bb-stat"><div className="bb-stat-n">{counts.latency}ms</div><div className="bb-stat-l">DETECTION LATENCY</div></div>
        <div className="bb-stat"><div className="bb-stat-n">{counts.events.toLocaleString()}+</div><div className="bb-stat-l">EVENTS / DAY</div></div>
      </div>

      {/* ── Features ── */}
      <div id="features" style={{ padding: "56px 40px", borderBottom: "1px solid var(--bdr)" }}>
        <div style={{ fontSize: 9, letterSpacing: 3, color: "var(--txt3)", marginBottom: 8 }}>PLATFORM CAPABILITIES</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: "var(--txt)", marginBottom: 40 }}>
          Built for traders, analysts,<br />and risk managers.
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", border: "1px solid var(--bdr)" }}>
          {[
            {
              n: "01",
              title: "Personalised Alert Feed",
              body: "Alerts scored to your specific portfolio and risk weights. Not a generic news feed — every item is ranked by how much it affects you.",
              locked: true,
            },
            {
              n: "02",
              title: "Interactive World Map",
              body: "Geopolitical events plotted in real time on a live map. Filter by severity, click for AI-generated context, and track developing situations.",
              locked: true,
            },
            {
              n: "03",
              title: "AI Analyst Assistant",
              body: "Ask questions about any alert, market event, or macro situation. Powered by LLaMA 70B with full context from your live alert history.",
              locked: true,
            },
            {
              n: "04",
              title: "Portfolio Exposure Dashboard",
              body: "See exactly which regions, sectors, and asset classes your alerts are clustered around. Regional exposure updated on every new signal.",
              locked: true,
            },
            {
              n: "05",
              title: "Adaptive Scoring Engine",
              body: "The more you use it, the better it gets. RLHF weight updates on every action mean your feed drifts toward what you actually care about.",
              locked: false,
            },
            {
              n: "06",
              title: "WebSocket Live Push",
              body: "No polling. No refresh. Alerts arrive the moment they are scored — sub-200ms from source ingestion to your screen.",
              locked: false,
            },
          ].map((f, i) => (
            <div key={f.n} style={{
              padding: "28px 24px",
              borderRight: i % 3 < 2 ? "1px solid var(--bdr)" : "none",
              borderBottom: i < 3 ? "1px solid var(--bdr)" : "none",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 9, color: "var(--txt3)", letterSpacing: 2 }}>{f.n}</span>
                {f.locked && (
                  <span style={{ fontSize: 8, color: "var(--live)", border: "1px solid var(--live-d)", padding: "1px 6px", letterSpacing: 1 }}>MEMBERS ONLY</span>
                )}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--txt)", marginBottom: 8, lineHeight: 1.4 }}>{f.title}</div>
              <div style={{ fontSize: 11, color: "var(--txt2)", lineHeight: 1.7 }}>{f.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <div id="how" style={{ padding: "56px 40px", borderBottom: "1px solid var(--bdr)" }}>
        <div style={{ fontSize: 9, letterSpacing: 3, color: "var(--txt3)", marginBottom: 8 }}>UNDER THE HOOD</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: "var(--txt)", marginBottom: 40 }}>
          Signal to brief in<br /><em style={{ color: "var(--live)", fontStyle: "normal" }}>under 200ms.</em>
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", border: "1px solid var(--bdr)" }}>
          {[
            { n: "01", name: "Ingest",     desc: "NewsAPI · RSS · Market feeds · Macro releases. Deduplicated and normalised before enrichment." },
            { n: "02", name: "Enrich",     desc: "NLP entity extraction, geo-tagging, and novelty scoring via sentence embeddings." },
            { n: "03", name: "Score",      desc: "IsolationForest anomaly detection. Score = weighted sum of Impact, Proximity, Velocity, Novelty." },
            { n: "04", name: "Synthesise", desc: "LLaMA 70B generates a 3-sentence brief and 5-bullet evidence chain grounded in source text." },
            { n: "05", name: "Deliver",    desc: "WebSocket push to your dashboard. RLHF weight update fires on every acted or dismissed alert." },
          ].map((s, i) => (
            <div key={s.n} className="bb-how-step" style={{ borderRight: i < 4 ? "1px solid var(--bdr)" : "none" }}>
              <div className="bb-how-step-num">{s.n}</div>
              <div className="bb-how-step-name">{s.name}</div>
              <div className="bb-how-step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pricing ── */}
      <div id="pricing" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid var(--bdr)" }}>
        <div style={{ padding: "56px 40px", borderRight: "1px solid var(--bdr)" }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: "var(--txt3)", marginBottom: 8 }}>FREE TIER</div>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, color: "var(--txt)", marginBottom: 4 }}>$0 <span style={{ fontSize: 12, color: "var(--txt3)", fontWeight: 400 }}>/month</span></div>
          <div style={{ fontSize: 11, color: "var(--txt2)", marginBottom: 24, lineHeight: 1.7 }}>Everything you need to get started. No credit card required.</div>
          {[
            "Real-time alert feed",
            "AI-generated summaries",
            "Interactive world map",
            "RLHF adaptive scoring",
            "WebSocket live push",
            "AI analyst assistant",
          ].map((item) => (
            <div key={item} className="bb-trust-item" style={{ marginBottom: 10 }}>{item}</div>
          ))}
          <div style={{ marginTop: 28, display: "inline-flex", border: "1px solid var(--bhi)" }}>
            <Link href="/onboarding" className="bb-btn-white" style={{ textDecoration: "none" }}>CREATE ACCOUNT</Link>
          </div>
        </div>

        <div style={{ padding: "56px 40px" }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: "var(--yel)", marginBottom: 8 }}>COMING SOON</div>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, color: "var(--txt)", marginBottom: 4 }}>PRO <span style={{ fontSize: 12, color: "var(--txt3)", fontWeight: 400 }}>/ enterprise</span></div>
          <div style={{ fontSize: 11, color: "var(--txt2)", marginBottom: 24, lineHeight: 1.7 }}>Advanced features for professional traders and risk desks.</div>
          {[
            "Causal chain graph visualisation",
            "Forward prediction arcs",
            "30-day signal density heatmap",
            "Live vessel & AIS tracking",
            "Custom source whitelists",
            "API access + webhooks",
          ].map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: 10, color: "var(--txt3)", letterSpacing: "0.5px" }}>
              <span style={{ color: "var(--yel)" }}>—</span>
              {item}
            </div>
          ))}
          <div style={{ marginTop: 28 }}>
            <span style={{ fontSize: 10, color: "var(--txt3)", letterSpacing: 1, border: "1px solid var(--bdr)", padding: "8px 16px" }}>NOTIFY ME WHEN AVAILABLE</span>
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ padding: "72px 40px", textAlign: "center", borderBottom: "1px solid var(--bdr)" }}>
        <div style={{ fontSize: 9, letterSpacing: 3, color: "var(--txt3)", marginBottom: 16 }}>GET STARTED</div>
        <h2 className="bb-cta-h">Your edge is <em>200ms</em> away.</h2>
        <p className="bb-cta-sub">SET YOUR RISK WEIGHTS. WE HANDLE THE REST.</p>
        <div style={{ display: "inline-flex", border: "1px solid var(--bhi)" }}>
          <Link href="/onboarding" className="bb-btn-white" style={{ textDecoration: "none" }}>CREATE FREE ACCOUNT</Link>
          <Link href="/onboarding" className="bb-btn-ghost" style={{ textDecoration: "none" }}>SIGN IN →</Link>
        </div>
        <div className="bb-cta-micro">NO CREDIT CARD · 2-MINUTE SETUP · CANCEL ANY TIME</div>
      </div>

      {/* ── Footer ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", background: "var(--bg2)", borderTop: "1px solid var(--bdr)" }}>
        <span style={{ fontSize: 9, color: "var(--txt3)", letterSpacing: 2 }}>SENTINELVAULT · AI-POWERED MARKET INTELLIGENCE</span>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <Link href="/onboarding" style={{ fontSize: 9, color: "var(--txt3)", letterSpacing: 1, textDecoration: "none" }}>SIGN IN</Link>
          <Link href="/onboarding" style={{ fontSize: 9, color: "var(--txt3)", letterSpacing: 1, textDecoration: "none" }}>GET ACCESS</Link>
          <span style={{ fontSize: 9, color: "var(--txt3)", letterSpacing: 1 }}>{clock}</span>
        </div>
      </div>
    </div>
  );
}
