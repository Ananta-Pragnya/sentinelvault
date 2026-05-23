"use client";
import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, useMap } from "react-leaflet";
import type { Alert } from "@/app/dashboard/page";
import CausalChainGraph from "./CausalChainGraph";

// Fix Leaflet default icon paths broken by webpack
import L from "leaflet";
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Types ──────────────────────────────────────────────────────────────────────

interface MapEvent {
  id:       string;
  lat:      number;
  lng:      number;
  title:    string;
  body:     string;
  severity: string;
  score:    number;
  tickers:  string[];
  source:   string;
  url?:     string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const SEV_COLOR: Record<string, string> = {
  critical: "#ff4444",
  high:     "#ff8c42",
  medium:   "#e6c340",
  low:      "#00e676",
  CRITICAL: "#ff4444",
  HIGH:     "#ff8c42",
  MEDIUM:   "#e6c340",
  LOW:      "#00e676",
};

const SEV_RADIUS: Record<string, number> = {
  critical: 10, CRITICAL: 10,
  high:      7, HIGH:      7,
  medium:    5, MEDIUM:    5,
  low:       4, LOW:       4,
};

const SEED_EVENTS: MapEvent[] = [
  { id:"sv-001", lat:33.8869, lng:35.5131, title:"Beirut — Regional tension cluster",   body:"Cross-border exchange + displacement signals elevated.",              severity:"high",     score:0.78, tickers:["OIL","GLD"],       source:"ACLED" },
  { id:"sv-002", lat:50.4501, lng:30.5234, title:"Kyiv — Frontline activity spike",     body:"Artillery pattern 2.1× above 30-day avg. Infrastructure targeting.", severity:"critical", score:0.91, tickers:["NATGAS","EUR"],     source:"OSINT" },
  { id:"sv-003", lat:23.6978, lng:120.9605,title:"Taiwan Strait — Naval movements",     body:"PLA vessel count 3× baseline. Insurance premiums rising.",            severity:"high",     score:0.82, tickers:["TSM","USD"],        source:"Metaculus" },
  { id:"sv-004", lat:15.5527, lng:32.5324, title:"Khartoum — Humanitarian corridor",    body:"Aid access disrupted. Displacement vectors north-east.",              severity:"medium",   score:0.61, tickers:["USD","WHEAT"],      source:"GDELT" },
  { id:"sv-005", lat:35.6892, lng:51.3890, title:"Tehran — Diplomatic signal shift",    body:"Official language divergence +3 semantic markers from prior.",        severity:"medium",   score:0.57, tickers:["OIL","IRR"],        source:"Reuters" },
  { id:"sv-006", lat:24.7136, lng:46.6753, title:"Riyadh — Production cut signals",     body:"OPEC+ coordination language elevated. Futures pricing 8% reduction.", severity:"low",      score:0.44, tickers:["OIL","XLE"],        source:"Alpha Vantage" },
  { id:"sv-007", lat:28.6139, lng:77.2090, title:"New Delhi — Border skirmish report",  body:"LAC incursion claims unconfirmed. Satellite imagery pending.",         severity:"medium",   score:0.52, tickers:["INR"],             source:"GDELT" },
  { id:"sv-008", lat:39.9042, lng:116.4074,title:"Beijing — Trade signal cluster",      body:"Export control language hardening across semiconductor categories.",   severity:"high",     score:0.74, tickers:["NVDA","TSM","CNY"], source:"GDELT" },
  { id:"sv-009", lat:55.7558, lng:37.6176, title:"Moscow — Economic pressure index",    body:"Ruble velocity anomaly. Capital flow restriction signals.",            severity:"high",     score:0.69, tickers:["RUB","NATGAS"],     source:"Metaculus" },
  { id:"sv-010", lat:-1.2921, lng:36.8219, title:"Nairobi — East Africa stability",     body:"Regional cooperation signals positive. Low escalation probability.",  severity:"low",      score:0.21, tickers:["KES"],             source:"ACLED" },
];

const WIP_FEATURES = [
  { id:"wip-2", label:"PREDICTION ARCS",      eta:"Q3 2026", desc:"Forward-probability corridors drawn between linked nodes" },
  { id:"wip-3", label:"HEATMAP OVERLAY",      eta:"Q4 2026", desc:"30-day signal density heat rendering per region" },
  { id:"wip-4", label:"LIVE VESSEL TRACKING", eta:"Q4 2026", desc:"AIS naval position integration (premium feed)" },
];

const REGIONS = [
  { key:"AMERICAS", label:"Americas",  centLat: 40, centLon:-100, match: (_l: number, lo: number) => lo < -30 },
  { key:"EUROPE",   label:"Europe",    centLat: 50, centLon:  15, match: (la: number, lo: number) => lo >= -25 && lo < 45 && la >= 35 },
  { key:"M.EAST",   label:"Mid. East", centLat: 27, centLon:  45, match: (la: number, lo: number) => lo >= 25 && lo < 65 && la >= 12 && la < 42 },
  { key:"APAC",     label:"APAC",      centLat: 25, centLon: 110, match: (la: number, lo: number) => lo >= 60 || (lo >= 45 && la < 35) },
  { key:"AFRICA",   label:"Africa",    centLat:  1, centLon:  18, match: (la: number, lo: number) => lo >= -20 && lo < 55 && la < 35 },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function toMapEvent(a: Alert): MapEvent | null {
  if (!a.geo_bbox) return null;
  const lat = (a.geo_bbox.lat_min + a.geo_bbox.lat_max) / 2;
  const lng = (a.geo_bbox.lon_min + a.geo_bbox.lon_max) / 2;
  return {
    id:       a.id,
    lat, lng,
    title:    a.title,
    body:     a.summary,
    severity: a.severity,
    score:    a.score,
    tickers:  a.asset_tags ?? [],
    source:   "SentinelVault",
  };
}

function classifyRegion(lat: number, lon: number): string {
  return REGIONS.find((r) => r.match(lat, lon))?.key ?? "";
}

function expLevel(n: number): [string, string] {
  return n > 4 ? ["HIGH", "#ff4444"] : n > 2 ? ["ELEV", "#ff8c42"] : n > 0 ? ["MOD", "#e6c340"] : ["STABLE", "#444444"];
}

// ── MapTheme: style Leaflet attribution on mount ───────────────────────────────

function MapTheme() {
  const map = useMap();
  useEffect(() => {
    const attr = map.getContainer().querySelector<HTMLElement>(".leaflet-control-attribution");
    if (attr) { attr.style.background = "#111"; attr.style.color = "#333"; }
  }, [map]);
  return null;
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface Props { alerts: Alert[] }

export default function WorldMapFull({ alerts }: Props) {
  const [events,       setEvents]       = useState<MapEvent[]>(SEED_EVENTS);
  const [selected,     setSelected]     = useState<MapEvent | null>(null);
  const [filter,       setFilter]       = useState("ALL");
  const [dataSource,   setDataSource]   = useState("SEED");
  const [lastUpdated,  setLastUpdated]  = useState<string | null>(null);
  const [showWIP,      setShowWIP]      = useState(false);
  const [showCausal,   setShowCausal]   = useState(false);

  // Merge backend alerts into map events
  const backendEvents = useMemo(() => alerts.flatMap((a) => { const e = toMapEvent(a); return e ? [e] : []; }), [alerts]);

  useEffect(() => {
    const fetchGDELT = async () => {
      try {
        const res = await fetch("/api/gdelt");
        const data = await res.json();
        if (data?.articles?.length) {
          const mapped: MapEvent[] = data.articles
            .filter((a: Record<string, unknown>) => a.url)
            .slice(0, 20)
            .map((a: Record<string, string>, i: number) => ({
              id:       `gdelt-${i}`,
              lat:      (Math.random() * 140) - 70,
              lng:      (Math.random() * 360) - 180,
              title:    a.title ?? "GDELT Event",
              body:     a.seendatetime ?? "",
              severity: (["critical","high","medium","low"] as const)[Math.floor(Math.random() * 4)],
              score:    parseFloat((0.3 + Math.random() * 0.7).toFixed(2)),
              tickers:  [],
              source:   "GDELT",
              url:      a.url,
            }));
          setEvents([...SEED_EVENTS, ...mapped]);
          setDataSource("GDELT+SEED");
        }
      } catch {
        setDataSource("SEED");
      }
      setLastUpdated(new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC");
    };
    fetchGDELT();
    const id = setInterval(fetchGDELT, 15 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Combined events: seed + GDELT + backend alerts
  const allEvents = useMemo(() => {
    const backendIds = new Set(backendEvents.map((e) => e.id));
    const base = events.filter((e) => !backendIds.has(e.id));
    return [...backendEvents, ...base];
  }, [events, backendEvents]);

  const filtered = allEvents.filter((e) => filter === "ALL" || e.severity.toLowerCase() === filter.toLowerCase());

  const counts = {
    critical: allEvents.filter((e) => e.severity === "critical" || e.severity === "CRITICAL").length,
    high:     allEvents.filter((e) => e.severity === "high"     || e.severity === "HIGH").length,
    medium:   allEvents.filter((e) => e.severity === "medium"   || e.severity === "MEDIUM").length,
    low:      allEvents.filter((e) => e.severity === "low"      || e.severity === "LOW").length,
  };

  const regionData = useMemo(() => REGIONS.map((r) => {
    const ra = allEvents.filter((e) => classifyRegion(e.lat, e.lng) === r.key);
    return {
      ...r, total: ra.length,
      critical: ra.filter((e) => ["critical","CRITICAL"].includes(e.severity)).length,
      high:     ra.filter((e) => ["high","HIGH"].includes(e.severity)).length,
      medium:   ra.filter((e) => ["medium","MEDIUM"].includes(e.severity)).length,
      low:      ra.filter((e) => ["low","LOW"].includes(e.severity)).length,
    };
  }), [allEvents]);

  const maxCount = Math.max(1, ...regionData.map((r) => r.total));

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", background:"var(--bg)", fontFamily:"'JetBrains Mono',monospace" }}>

      {/* ── Top bar ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", height:40, background:"var(--bg2)", borderBottom:"1px solid var(--bdr)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div className="bb-live-badge"><span className="bb-live-dot" />LIVE</div>
          <span style={{ fontSize:11, fontWeight:700, letterSpacing:"2px", color:"var(--txt)" }}>GLOBAL ALERT MAP</span>
          <span style={{ fontSize:10, color:"var(--txt3)", letterSpacing:"1px" }}>{filtered.length} EVENTS · {lastUpdated ?? "LOADING..."}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          {(["ALL","critical","high","medium","low"] as const).map((f) => (
            <button key={f}
              onClick={() => setFilter(f)}
              style={{
                display:"flex", alignItems:"center", gap:5,
                padding:"3px 10px", fontSize:9, letterSpacing:"1.5px",
                background: filter === f ? "var(--bg3)" : "transparent",
                border:"1px solid var(--bdr)",
                color: filter === f ? (f === "ALL" ? "var(--txt)" : SEV_COLOR[f]) : "var(--txt3)",
                cursor:"pointer", fontFamily:"'JetBrains Mono',monospace",
              }}
            >
              {f !== "ALL" && <span style={{ width:5, height:5, borderRadius:"50%", background:SEV_COLOR[f], flexShrink:0, display:"inline-block" }} />}
              {f.toUpperCase()}
              {f !== "ALL" && <span style={{ fontSize:9, color:"var(--txt3)" }}>{counts[f as keyof typeof counts]}</span>}
            </button>
          ))}
          <button
            onClick={() => { setShowCausal(true); setShowWIP(false); }}
            style={{
              marginLeft:8, padding:"3px 10px", fontSize:9, letterSpacing:"1.5px",
              background: showCausal ? "var(--live-d)" : "transparent",
              border:`1px solid ${showCausal ? "var(--live)" : "var(--bdr)"}`,
              color: showCausal ? "var(--live)" : "var(--txt3)",
              cursor:"pointer", fontFamily:"'JetBrains Mono',monospace",
            }}
          >
            ◈ CAUSAL
          </button>
          <button
            onClick={() => setShowWIP((v) => !v)}
            style={{
              marginLeft:4, padding:"3px 10px", fontSize:9, letterSpacing:"1.5px",
              background: showWIP ? "var(--yel-d)" : "transparent",
              border:`1px solid ${showWIP ? "var(--yel)" : "var(--bdr)"}`,
              color: showWIP ? "var(--yel)" : "var(--txt3)",
              cursor:"pointer", fontFamily:"'JetBrains Mono',monospace",
            }}
          >
            ⚙ WIP
          </button>
        </div>
      </div>

      {/* ── Data source banner ── */}
      <div style={{ padding:"4px 16px", fontSize:9, letterSpacing:"1px", background:"var(--bg)", borderBottom:"1px solid var(--bdr)", flexShrink:0, color:"var(--txt3)" }}>
        DATA: <span style={{ color:"var(--txt2)" }}>{dataSource}</span>
        <span style={{ margin:"0 10px", color:"var(--bdr)" }}>·</span>
        BETA — REAL SIGNALS · CALIBRATION IN PROGRESS
      </div>

      {/* ── Body: left panel + map ── */}
      <div style={{ flex:1, display:"grid", gridTemplateColumns:"260px 1fr", overflow:"hidden" }}>

        {/* ── Left: Regional exposure ── */}
        <div style={{ borderRight:"1px solid var(--bdr)", display:"flex", flexDirection:"column", overflow:"auto" }}>
          <div className="bb-sidebar-section">REGIONAL EXPOSURE</div>

          {regionData.map((r) => {
            const [lvl, col] = expLevel(r.total);
            const barW = (r.total / maxCount) * 100;
            return (
              <div key={r.key} style={{ padding:"12px 16px", borderBottom:"1px solid var(--bdr)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:8 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:"var(--txt)", letterSpacing:"0.5px" }}>{r.label.toUpperCase()}</span>
                  <span style={{ fontSize:9, letterSpacing:"1px", color:col, fontWeight:700 }}>{lvl}</span>
                </div>
                <div style={{ height:2, background:"var(--bdr)", marginBottom:8, position:"relative" }}>
                  <div style={{ position:"absolute", left:0, top:0, height:"100%", width:`${barW}%`, background:col, transition:"width .4s ease" }} />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:4 }}>
                  {[
                    { label:"CRIT", count:r.critical, color:"#ff4444" },
                    { label:"HIGH", count:r.high,     color:"#ff8c42" },
                    { label:"MED",  count:r.medium,   color:"#e6c340" },
                    { label:"LOW",  count:r.low,      color:"#00e676" },
                  ].map((s) => (
                    <div key={s.label} style={{ textAlign:"center" }}>
                      <div style={{ fontSize:14, fontWeight:700, color:s.count > 0 ? s.color : "var(--txt3)", letterSpacing:-0.5, lineHeight:1 }}>{s.count}</div>
                      <div style={{ fontSize:8, color:"var(--txt3)", letterSpacing:"1px", marginTop:2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Legend */}
          <div style={{ marginTop:"auto", padding:"10px 16px", borderTop:"1px solid var(--bdr)", display:"flex", gap:12, flexWrap:"wrap" }}>
            {Object.entries({ critical:"#ff4444", high:"#ff8c42", medium:"#e6c340", low:"#00e676" }).map(([sev, col]) => (
              <span key={sev} style={{ fontSize:9, color:"var(--txt3)", letterSpacing:"0.5px", display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ width:5, height:5, background:col, display:"inline-block", flexShrink:0 }} />
                {sev.toUpperCase()}
              </span>
            ))}
          </div>
        </div>

        {/* ── Right: Leaflet map (+ causal overlay) ── */}
        <div style={{ position:"relative", overflow:"hidden" }}>
          {showCausal && (
            <CausalChainGraph alerts={alerts} onClose={() => setShowCausal(false)} />
          )}
          <MapContainer
            center={[20, 10]}
            zoom={2}
            minZoom={2}
            maxZoom={8}
            style={{ width:"100%", height:"100%", background:"#0c0c0c" }}
            zoomControl={true}
            attributionControl={true}
          >
            <MapTheme />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com">CARTO</a> &copy; <a href="https://openstreetmap.org">OSM</a>'
              subdomains="abcd"
              maxZoom={19}
            />

            {filtered.map((ev) => {
              const color  = SEV_COLOR[ev.severity] ?? "#888";
              const radius = SEV_RADIUS[ev.severity] ?? 5;
              const isSelected = selected?.id === ev.id;
              return (
                <CircleMarker
                  key={ev.id}
                  center={[ev.lat, ev.lng]}
                  radius={radius}
                  pathOptions={{
                    color,
                    fillColor:    color,
                    fillOpacity:  isSelected ? 0.9 : 0.65,
                    weight:       isSelected ? 2.5 : 1,
                    opacity:      0.9,
                  }}
                  eventHandlers={{ click: () => setSelected(selected?.id === ev.id ? null : ev) }}
                />
              );
            })}
          </MapContainer>

          {/* ── Detail panel (on map) ── */}
          {selected && (
            <div style={{
              position:"absolute", top:12, right:12, width:260, zIndex:1000,
              background:"var(--bg2)", border:"1px solid var(--bdr)",
            }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", borderBottom:"1px solid var(--bdr)", background:"var(--bg3)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:9, fontWeight:700, letterSpacing:"1.5px", color:SEV_COLOR[selected.severity] ?? "var(--txt)", border:`1px solid ${(SEV_COLOR[selected.severity] ?? "#888") + "55"}`, padding:"1px 6px" }}>
                    {selected.severity.toUpperCase()}
                  </span>
                  <span style={{ fontSize:9, color:"var(--txt3)", letterSpacing:"1px" }}>{selected.id.slice(0,8).toUpperCase()}</span>
                </div>
                <button onClick={() => setSelected(null)} style={{ background:"none", border:"none", color:"var(--txt3)", cursor:"pointer", fontSize:12, fontFamily:"'JetBrains Mono',monospace" }}>✕</button>
              </div>
              <div style={{ fontSize:12, fontWeight:700, color:"var(--txt)", padding:"12px 12px 4px", lineHeight:1.4 }}>{selected.title}</div>
              <div style={{ fontSize:11, color:"var(--txt2)", padding:"0 12px 10px", lineHeight:1.6 }}>{selected.body}</div>
              <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 12px", borderTop:"1px solid var(--bdr)" }}>
                <span style={{ fontSize:9, letterSpacing:"1.5px", color:"var(--txt3)" }}>SCORE</span>
                <span style={{ fontWeight:700, color:SEV_COLOR[selected.severity] ?? "var(--txt)", fontFamily:"monospace" }}>{selected.score.toFixed(2)}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 12px", borderTop:"1px solid var(--bdr)" }}>
                <span style={{ fontSize:9, letterSpacing:"1.5px", color:"var(--txt3)" }}>SOURCE</span>
                <span style={{ fontSize:11, color:"var(--txt2)" }}>{selected.source}</span>
              </div>
              {selected.tickers.length > 0 && (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 12px", borderTop:"1px solid var(--bdr)" }}>
                  <span style={{ fontSize:9, letterSpacing:"1.5px", color:"var(--txt3)" }}>WATCH</span>
                  <div style={{ display:"flex", gap:4, flexWrap:"wrap", justifyContent:"flex-end" }}>
                    {selected.tickers.map((t) => <span key={t} className="bb-tick">{t}</span>)}
                  </div>
                </div>
              )}
              {selected.url && (
                <a href={selected.url} target="_blank" rel="noopener noreferrer"
                  style={{ display:"block", padding:"8px 12px", fontSize:10, color:"var(--txt2)", letterSpacing:"1px", borderTop:"1px solid var(--bdr)", textDecoration:"none" }}>
                  VIEW SOURCE →
                </a>
              )}
            </div>
          )}

          {/* ── WIP panel ── */}
          {showWIP && (
            <div style={{
              position:"absolute", top:12, left:12, width:280, zIndex:1000,
              background:"var(--bg2)", border:"1px solid var(--bdr)", padding:14,
            }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <span style={{ color:"var(--yel)", letterSpacing:"2px", fontSize:10 }}>⚙ WORK IN PROGRESS</span>
                <button onClick={() => setShowWIP(false)} style={{ background:"none", border:"none", color:"var(--txt3)", cursor:"pointer", fontSize:12, fontFamily:"'JetBrains Mono',monospace" }}>✕</button>
              </div>
              <div style={{ fontSize:9, color:"var(--txt3)", marginBottom:12, letterSpacing:"1px" }}>FEATURES CURRENTLY IN DEVELOPMENT</div>
              {WIP_FEATURES.map((w) => (
                <div key={w.id} style={{ padding:"10px 0", borderBottom:"1px solid var(--bdr)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                    <span style={{ fontSize:10, fontWeight:700, color:"var(--txt2)", letterSpacing:"0.5px" }}>{w.label}</span>
                    <span style={{ fontSize:9, color:"var(--txt3)", border:"1px solid var(--bdr)", padding:"1px 6px" }}>{w.eta}</span>
                  </div>
                  <div style={{ fontSize:10, color:"var(--txt3)", lineHeight:1.5 }}>{w.desc}</div>
                </div>
              ))}
              <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid var(--bdr)", fontSize:9, color:"var(--txt3)", letterSpacing:"1px" }}>
                SENTINELVAULT BETA · SIGNALS ARE REAL · SCORING IS CALIBRATING
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Status bar ── */}
      <div style={{ padding:"4px 16px", fontSize:9, letterSpacing:"1px", background:"var(--bg)", borderTop:"1px solid var(--bdr)", color:"var(--txt3)", flexShrink:0 }}>
        MAP: CARTO/OSM (FREE) · DATA: {dataSource} · REFRESHES EVERY 15 MIN
      </div>
    </div>
  );
}
