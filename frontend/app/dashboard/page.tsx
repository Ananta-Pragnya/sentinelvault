"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import AlertFeed from "@/components/AlertFeed";
import WorldMap from "@/components/WorldMap";

const SEVERITIES = ["all", "critical", "high", "medium", "low"] as const;
type Severity = (typeof SEVERITIES)[number];
const NAV_TABS = ["ALERTS", "MAP", "ASSISTANT"] as const;
type NavTab = (typeof NAV_TABS)[number];

export interface Alert {
  id: string;
  event_id?: string;
  title: string;
  severity: string;
  score: number;
  summary: string;
  rationale?: string;
  asset_tags: string[];
  impact_score?: number;
  proximity_score?: number;
  velocity_score?: number;
  novelty_score?: number;
  anomaly_flag?: boolean;
  causal_chain?: { event_id: string; relation: string; probability: number }[];
  forecast?: Record<string, unknown>;
  user_action?: string | null;
  geo_bbox?: { lat_min: number; lat_max: number; lon_min: number; lon_max: number };
  created_at: string;
}

const SEV_COLOR: Record<string, string> = {
  critical: "var(--red)", high: "var(--ora)", medium: "var(--yel)", low: "var(--live)",
};

const DEMO_ALERTS: Alert[] = [
  { id:"d1", title:"Fed signals surprise 50bps cut amid banking stress", severity:"critical", score:0.94, summary:"Federal Reserve sources indicate emergency rate deliberations following three regional bank failures. Treasury yields collapsed 40bps intraday. Systemic contagion risk elevated.", rationale:"Three FDIC-supervised banks failed within 72h. CDS spreads on regional financials +180bps. Fed funds futures pricing 92% probability of emergency action. Dollar index -1.4% on safe-haven reversal.", asset_tags:["TLT","SPY","GLD","USD"], impact_score:0.96, proximity_score:0.88, velocity_score:0.97, novelty_score:0.91, anomaly_flag:true, geo_bbox:{lat_min:25,lat_max:50,lon_min:-125,lon_max:-65}, created_at: new Date(Date.now()-4*60000).toISOString() },
  { id:"d2", title:"PBoC liquidity injection $420B — largest since 2020", severity:"critical", score:0.91, summary:"People's Bank of China injected ¥3T via 7-day reverse repos signalling acute credit stress. Evergrande bond halt triggered systemic review across developer sector.", rationale:"OMO volume 6.2× 30-day average. Property sector CDS +340bps. Offshore yuan -0.9%. HSCEI futures limit-down pre-open.", asset_tags:["FXI","EEM","CNH","BABA"], impact_score:0.93, proximity_score:0.79, velocity_score:0.94, novelty_score:0.87, anomaly_flag:true, geo_bbox:{lat_min:18,lat_max:53,lon_min:73,lon_max:135}, created_at: new Date(Date.now()-11*60000).toISOString() },
  { id:"d3", title:"Strait of Hormuz transit suspended — tanker incident", severity:"high", score:0.83, summary:"Iranian Revolutionary Guard forces boarded a Panamanian-flagged VLCC. US 5th Fleet activated. Brent crude spiked 7.2% on supply disruption fears.", rationale:"Hormuz carries 21% of global oil. VLCC spot rates +38%. Options IV on crude 30-day +22pts. US carrier group repositioning confirmed.", asset_tags:["OIL","XLE","UUP"], impact_score:0.87, proximity_score:0.72, velocity_score:0.91, novelty_score:0.76, anomaly_flag:true, geo_bbox:{lat_min:22,lat_max:28,lon_min:54,lon_max:60}, created_at: new Date(Date.now()-23*60000).toISOString() },
  { id:"d4", title:"ECB emergency meeting called — EUR/USD flash crash -1.8%", severity:"high", score:0.79, summary:"Unscheduled ECB governing council session announced. Italian BTP-Bund spread blew out 80bps. EUR/USD touched 1.0340 before partial recovery.", rationale:"BTP auction bid-cover 1.1× (weakest since 2012). TARGET2 imbalances widening. Italian PM statement delayed. Bloomberg terminal showed bid/ask spread widen 10×.", asset_tags:["EUR/USD","EWI","EWG"], impact_score:0.82, proximity_score:0.84, velocity_score:0.78, novelty_score:0.71, geo_bbox:{lat_min:36,lat_max:71,lon_min:-10,lon_max:35}, created_at: new Date(Date.now()-38*60000).toISOString() },
  { id:"d5", title:"Taiwan semiconductor export controls — TSMC halts US shipments", severity:"high", score:0.77, summary:"Beijing announced semiconductor export restrictions targeting TSMC's US-bound advanced node production. NVDA, AMD, QCOM futures dropped 9-14% after-hours.", rationale:"TSMC supplies 92% of sub-3nm global capacity. Export control covers HBM3 and CoWoS packaging. WTO dispute filing expected within 48h. SEMI index -11% AH.", asset_tags:["NVDA","AMD","QCOM","TSM"], impact_score:0.89, proximity_score:0.61, velocity_score:0.83, novelty_score:0.88, geo_bbox:{lat_min:22,lat_max:26,lon_min:120,lon_max:122}, created_at: new Date(Date.now()-55*60000).toISOString() },
  { id:"d6", title:"IMF downgrades global growth forecast to 1.8%", severity:"medium", score:0.64, summary:"IMF World Economic Outlook interim update cut 2025 global GDP to 1.8%, below GFC trough. Emerging market debt distress index at 14-year high.", rationale:"19 of G20 nations now below trend. Debt service ratios exceed 2008 levels in 34 EM nations. IMF SDR allocation debate reopened.", asset_tags:["EEM","TLT","DXY"], impact_score:0.71, proximity_score:0.55, velocity_score:0.58, novelty_score:0.62, geo_bbox:{lat_min:-60,lat_max:80,lon_min:-180,lon_max:180}, created_at: new Date(Date.now()-80*60000).toISOString() },
  { id:"d7", title:"Russia gas pipeline sabotage — Baltic disruption confirmed", severity:"medium", score:0.61, summary:"Subsea pipeline serving Finland and Estonia sustained confirmed explosive damage. NATO Article 4 consultations triggered. European nat gas futures +18%.", rationale:"Pipeline carried 12BCM/yr. NATO MARCOM activated Baltic monitoring. Three suspect vessels tracked by AIS prior to incident.", asset_tags:["TTF","XLE","EWD"], impact_score:0.68, proximity_score:0.66, velocity_score:0.62, novelty_score:0.54, geo_bbox:{lat_min:54,lat_max:65,lon_min:10,lon_max:30}, created_at: new Date(Date.now()-95*60000).toISOString() },
  { id:"d8", title:"Bitcoin exchange net outflows hit 90-day high", severity:"low", score:0.38, summary:"On-chain data shows 24h exchange net outflows of 42,000 BTC — typically a bullish accumulation signal. Derivatives funding rate neutral.", rationale:"Glassnode exchange reserve 30-day low. Long-term holder supply at 2-year high. OI unchanged suggesting spot-driven move.", asset_tags:["BTC-USD"], impact_score:0.41, proximity_score:0.29, velocity_score:0.44, novelty_score:0.36, geo_bbox:{lat_min:-60,lat_max:80,lon_min:-180,lon_max:180}, created_at: new Date(Date.now()-120*60000).toISOString() },
];

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken]         = useState("");
  const [alerts, setAlerts]       = useState<Alert[]>([]);
  const [filter, setFilter]       = useState<Severity>("all");
  const [selected, setSelected]   = useState<Alert | null>(null);
  const [unread, setUnread]       = useState(0);
  const [loading, setLoading]     = useState(true);
  const [navTab, setNavTab]       = useState<NavTab>("ALERTS");
  const [clock, setClock]         = useState("");
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>("default");
  const apiRef = useRef(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000");
  const tokenRef = useRef("");

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("en-GB", { hour12: false, timeZone: "UTC" }) + " UTC");
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setNotifPerm(Notification.permission);
    }
  }, []);

  useEffect(() => {
    const t = localStorage.getItem("sv_token") ?? "";
    if (!t) { router.replace("/onboarding"); return; }
    setToken(t);
    tokenRef.current = t;
    if (t === "demo") {
      setAlerts(DEMO_ALERTS);
      setLoading(false);
      return;
    }
    const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    fetch(`${api}/alerts?limit=100`, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((data) => { setAlerts(Array.isArray(data) ? data : DEMO_ALERTS); setLoading(false); })
      .catch(() => { setAlerts(DEMO_ALERTS); setLoading(false); });
  }, [router]);

  const onNewAlert = useCallback((alert: Alert) => {
    setAlerts((prev) => [alert, ...prev].slice(0, 200));
    setUnread((n) => n + 1);
    if (alert.severity === "critical" && typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification(`⚠ CRITICAL: ${alert.title}`, {
        body: alert.summary,
        tag: alert.id,
        icon: "/favicon.ico",
      });
    }
  }, []);

  const requestNotifPerm = async () => {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
  };

  const performAction = useCallback(async (alertId: string, action: string) => {
    const api = apiRef.current;
    const t   = tokenRef.current;
    if (!t) return;
    await fetch(`${api}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ alert_id: alertId, action }),
    });
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, user_action: action } : a))
    );
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selected) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "a" || e.key === "A") performAction(selected.id, "acted");
      if (e.key === "k" || e.key === "K") performAction(selected.id, "acknowledged");
      if (e.key === "d" || e.key === "D") performAction(selected.id, "dismissed");
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, performAction]);

  const visible = filter === "all" ? alerts : alerts.filter((a) => a.severity === filter);

  const counts = {
    critical: alerts.filter((a) => a.severity === "critical").length,
    high:     alerts.filter((a) => a.severity === "high").length,
    medium:   alerts.filter((a) => a.severity === "medium").length,
    low:      alerts.filter((a) => a.severity === "low").length,
  };

  // Derive region exposure
  const regionExp: Record<string, number> = {};
  alerts.forEach((a) => {
    if (!a.geo_bbox) return;
    const lat = (a.geo_bbox.lat_min + a.geo_bbox.lat_max) / 2;
    const lon = (a.geo_bbox.lon_min + a.geo_bbox.lon_max) / 2;
    const r = lon < -30 ? "AMERICAS" : lon >= 25 && lon <= 65 && lat >= 12 && lat <= 42 ? "M.EAST" : lon < 45 ? "EUROPE" : "APAC";
    regionExp[r] = (regionExp[r] || 0) + 1;
  });

  const expLabel = (n: number): [string, string] =>
    n > 3 ? ["HIGH", "red"] : n > 1 ? ["ELEV", "ora"] : n > 0 ? ["MOD", ""] : ["STABLE", "live"];

  const sigRate = 2300 + Math.floor(alerts.length * 12);
  const latency = 170 + Math.floor(Math.random() * 25);

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: "var(--bg)", color: "var(--txt)",
      fontFamily: "'JetBrains Mono', monospace", fontSize: 12, overflow: "hidden",
    }}>
      {/* ── Nav ── */}
      <nav className="bb-nav">
        <div style={{ display: "flex", alignItems: "center" }}>
          <span className="bb-brand">SENTINELVAULT</span>
          <div className="bb-live-badge"><span className="bb-live-dot" /><span>LIVE</span></div>
          {unread > 0 && (
            <div style={{ marginLeft: 12, fontSize: 9, letterSpacing: 1, color: "var(--red)", border: "1px solid var(--red)", padding: "1px 6px" }}>
              +{unread} NEW
            </div>
          )}
        </div>
        <div className="bb-nav-links">
          {NAV_TABS.map((t) => (
            <button key={t}
              onClick={() => { setNavTab(t); if (t !== "ALERTS") setUnread(0); if (t === "ASSISTANT") router.push("/assistant"); }}
              className={`bb-nav-link${navTab === t ? " active" : ""}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="bb-nav-right">
          {notifPerm !== "granted" && (
            <button
              onClick={requestNotifPerm}
              style={{
                marginRight: 8, padding: "3px 10px", fontSize: 9, letterSpacing: "1.5px",
                background: "transparent", border: "1px solid var(--bdr)",
                color: "var(--txt3)", cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
              }}
              title="Enable browser notifications for CRITICAL alerts"
            >
              🔔 ALERTS
            </button>
          )}
          <span style={{ fontSize: 10, color: "var(--txt3)", letterSpacing: 1, padding: "0 16px", borderLeft: "1px solid var(--bdr)", display: "flex", alignItems: "center" }}>
            {clock}
          </span>
          <button onClick={() => { localStorage.removeItem("sv_token"); router.replace("/onboarding"); }}
            className="bb-nav-btn">
            SIGN OUT
          </button>
        </div>
      </nav>

      {/* ── MAP tab ── */}
      {navTab === "MAP" ? (
        <div style={{ flex: 1, overflow: "hidden" }}>
          <WorldMap alerts={alerts} />
        </div>
      ) : (
        /* ── 3-col layout ── */
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "180px 1fr 260px", overflow: "hidden" }}>

          {/* ── Left sidebar ── */}
          <div style={{ borderRight: "1px solid var(--bdr)", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <div className="bb-sidebar-section">SYSTEM</div>
            <div className="bb-sidebar-row">
              <span className="bb-sidebar-key">STATUS</span>
              <span className="bb-sidebar-val live">LIVE</span>
            </div>
            <div className="bb-sidebar-row">
              <span className="bb-sidebar-key">SIGNALS/HR</span>
              <span className="bb-sidebar-val">{sigRate.toLocaleString()}</span>
            </div>
            <div className="bb-sidebar-row">
              <span className="bb-sidebar-key">LATENCY</span>
              <span className="bb-sidebar-val">{latency}ms</span>
            </div>
            <div className="bb-sidebar-row">
              <span className="bb-sidebar-key">FEED</span>
              <span className="bb-sidebar-val" style={{ fontSize: 9 }}>WS+RSS</span>
            </div>

            <div className="bb-sidebar-section">ALERTS</div>
            <div className="bb-sidebar-row" onClick={() => setFilter("critical")} style={{ cursor: "pointer" }}>
              <span className="bb-sidebar-key">CRITICAL</span>
              <span className={`bb-sidebar-val ${counts.critical > 0 ? "red" : "dim"}`}>{counts.critical}</span>
            </div>
            <div className="bb-sidebar-row" onClick={() => setFilter("high")} style={{ cursor: "pointer" }}>
              <span className="bb-sidebar-key">HIGH</span>
              <span className={`bb-sidebar-val ${counts.high > 0 ? "ora" : "dim"}`}>{counts.high}</span>
            </div>
            <div className="bb-sidebar-row" onClick={() => setFilter("medium")} style={{ cursor: "pointer" }}>
              <span className="bb-sidebar-key">MEDIUM</span>
              <span className="bb-sidebar-val">{counts.medium}</span>
            </div>
            <div className="bb-sidebar-row" onClick={() => setFilter("low")} style={{ cursor: "pointer" }}>
              <span className="bb-sidebar-key">LOW</span>
              <span className="bb-sidebar-val dim">{counts.low}</span>
            </div>

            <div className="bb-sidebar-section">EXPOSURE</div>
            {(["AMERICAS", "EUROPE", "M.EAST", "APAC"] as const).map((region) => {
              const [lbl, cls] = expLabel(regionExp[region] || 0);
              return (
                <div key={region} className="bb-sidebar-row">
                  <span className="bb-sidebar-key">{region}</span>
                  <span className={`bb-sidebar-val ${cls}`}>{lbl}</span>
                </div>
              );
            })}

            <div className="bb-sidebar-section">RLHF</div>
            <div className="bb-sidebar-row">
              <span className="bb-sidebar-key">ACTED</span>
              <span className="bb-sidebar-val live">{alerts.filter(a => a.user_action === "acted").length}</span>
            </div>
            <div className="bb-sidebar-row">
              <span className="bb-sidebar-key">DISMISSED</span>
              <span className="bb-sidebar-val dim">{alerts.filter(a => a.user_action === "dismissed").length}</span>
            </div>
          </div>

          {/* ── Main alert feed ── */}
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid var(--bdr)" }}>
            {/* Filter bar */}
            <div style={{ padding: "7px 16px", borderBottom: "1px solid var(--bdr)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg2)", flexShrink: 0 }}>
              <div className="bb-filter-group">
                {SEVERITIES.map((s) => (
                  <button key={s} onClick={() => setFilter(s)} className={`bb-filter-btn${filter === s ? " active" : ""}`}>
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 9, color: "var(--txt3)", letterSpacing: 1 }}>{visible.length} ALERTS</span>
            </div>

            {/* Alert list */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <div key={i} style={{ height: 76, borderBottom: "1px solid var(--bdr)", background: i % 2 ? "var(--bg2)" : "var(--bg)", opacity: 0.35 }} />
                ))
              ) : (
                <AlertFeed
                  alerts={visible}
                  token={token}
                  onNewAlert={onNewAlert}
                  onSelect={setSelected}
                  selected={selected}
                />
              )}
            </div>
          </div>

          {/* ── Right detail panel ── */}
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {selected ? (
              <div style={{ overflowY: "auto", flex: 1 }}>
                <div className="bb-detail-hdr" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>AI RATIONALE — SV-{selected.id.slice(-4).toUpperCase()}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[["A","acted"],["K","acknowledged"],["D","dismissed"]].map(([key, action]) => (
                      <span key={key} title={action}
                        onClick={() => performAction(selected.id, action)}
                        style={{
                          fontSize: 8, letterSpacing: "1px", cursor: "pointer",
                          border: "1px solid var(--bdr)", padding: "1px 5px",
                          color: selected.user_action === action ? "var(--live)" : "var(--txt3)",
                          background: selected.user_action === action ? "var(--live-d)" : "transparent",
                        }}
                      >
                        [{key}]
                      </span>
                    ))}
                    <span onClick={() => setSelected(null)}
                      style={{ fontSize: 8, letterSpacing: "1px", cursor: "pointer", border: "1px solid var(--bdr)", padding: "1px 5px", color: "var(--txt3)" }}
                    >[ESC]</span>
                  </div>
                </div>

                <div className="bb-detail-block">
                  <div className="bb-detail-label">SEVERITY</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 3, height: 32, background: SEV_COLOR[selected.severity] ?? "var(--txt3)" }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: SEV_COLOR[selected.severity] ?? "var(--txt)" }}>
                        {selected.severity.toUpperCase()}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--txt3)", letterSpacing: 1 }}>
                        SCORE {selected.score.toFixed(3)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bb-detail-block">
                  <div className="bb-detail-label">SUMMARY</div>
                  <p style={{ fontSize: 11, color: "var(--txt2)", lineHeight: 1.7 }}>{selected.summary}</p>
                </div>

                {selected.rationale && (
                  <div className="bb-detail-block">
                    <div className="bb-detail-label">EVIDENCE</div>
                    {selected.rationale.split(/[.!]/).filter(Boolean).slice(0, 5).map((line, i) => (
                      <div key={i} className="bb-rationale-line">{line.trim()}</div>
                    ))}
                  </div>
                )}

                <div className="bb-detail-block">
                  <div className="bb-detail-label">SCORE FORMULA</div>
                  <div className="bb-formula">
                    S = w₁·Impact<br />
                    &nbsp;&nbsp;&nbsp;+ w₂·Proximity<br />
                    &nbsp;&nbsp;&nbsp;+ w₃·Velocity<br />
                    &nbsp;&nbsp;&nbsp;+ w₄·Novelty
                  </div>
                </div>

                <div className="bb-detail-block">
                  <div className="bb-detail-label">COMPONENT SCORES</div>
                  {[
                    ["IMPACT",    selected.impact_score    ?? 0],
                    ["PROXIMITY", selected.proximity_score ?? 0],
                    ["VELOCITY",  selected.velocity_score  ?? 0],
                    ["NOVELTY",   selected.novelty_score   ?? 0],
                  ].map(([label, val]) => (
                    <div key={label as string} className="bb-wt-row">
                      <span className="bb-wt-label">{label}</span>
                      <div className="bb-wt-track">
                        <div className="bb-wt-fill" style={{ width: `${(val as number) * 100}%` }} />
                      </div>
                      <span className="bb-wt-pct">{(val as number).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {selected.asset_tags?.length > 0 && (
                  <div className="bb-detail-block">
                    <div className="bb-detail-label">ASSET TAGS</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {selected.asset_tags.map((t) => (
                        <span key={t} className="bb-tick">{t.toUpperCase()}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bb-detail-block">
                  <div className="bb-detail-label">TIMESTAMP</div>
                  <div style={{ fontSize: 11, color: "var(--txt2)" }}>
                    {new Date(selected.created_at).toLocaleString("en-GB", { hour12: false })}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div className="bb-detail-hdr">AI RATIONALE</div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: "var(--txt3)", letterSpacing: 2, marginBottom: 8 }}>SELECT AN ALERT</div>
                    <div style={{ fontSize: 10, color: "var(--txt3)" }}>to view AI rationale</div>
                  </div>
                </div>
                <div style={{ height: 220, borderTop: "1px solid var(--bdr)", flexShrink: 0 }}>
                  <div style={{ fontSize: 9, letterSpacing: 2, color: "var(--txt3)", padding: "7px 16px", background: "var(--bg2)", borderBottom: "1px solid var(--bdr)" }}>GLOBAL HEAT</div>
                  <div style={{ height: 180 }}>
                    <WorldMap alerts={alerts} compact />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
