"use client";
import { useMemo } from "react";
import type { Alert } from "@/app/dashboard/page";

/* ─── Colour palette ───────────────────────────────────────── */
const SEV_COLOR: Record<string, string> = {
  critical: "#ff4444",
  high:     "#ff8c42",
  medium:   "#e6c340",
  low:      "#00e676",
};

/* ─── Equirectangular projection ────────────────────────────── */
// viewBox "0 0 100 50": x ∈ [0,100], y ∈ [0,50]
function project(lat: number, lon: number): [number, number] {
  return [
    ((lon + 180) / 360) * 100,
    ((90 - lat)  / 180) * 50,   // ← was * 100 (bug: S.hem. plotted off-canvas)
  ];
}

/* ─── Simplified continent polygon paths ────────────────────── */
// All coordinates in the same 100×50 equirectangular space.
const CONTINENTS = [
  // North America
  "M 3.3,5.6 L 22,4.7 L 31,6.7 L 35,11.9 L 31,13 L 28,18.1 L 25.6,20.6 L 28.3,22.8 L 20.8,19.4 L 17.2,16.1 L 15.6,11.9 L 13.3,10 L 4.4,8.3 Z",
  // South America
  "M 28.3,22.8 L 32.8,21.9 L 40.3,26.4 L 39.2,29.2 L 38.3,31.4 L 35.8,33.3 L 33.9,34.4 L 31.9,37.8 L 31.1,40 L 29.7,37 L 30.6,31.9 L 28.3,28.3 L 27.8,24.4 Z",
  // Greenland
  "M 35.8,8.1 L 42.9,1.9 L 44.4,3.6 L 43.9,8.3 L 37.8,8.3 Z",
  // Europe
  "M 47.5,14.4 L 48.9,12.8 L 48.6,11.7 L 51.4,10.3 L 52.8,9.2 L 57.8,5.3 L 58.9,6.9 L 58.3,8.3 L 56.7,8.6 L 60.3,12 L 61.1,13.1 L 57.2,13.9 L 55.6,14.7 L 54.4,14.4 L 53.3,12.8 L 51.1,12.5 L 49.4,12.8 Z",
  // Africa
  "M 48.6,15 L 52.8,14.4 L 58.9,16.4 L 64.2,21.7 L 61.1,26.1 L 59.7,30.6 L 58.1,33.3 L 55,34.4 L 53.3,29.7 L 50.8,23.6 L 45.3,21.1 L 45.3,17 Z",
  // Asia (combined with Middle East)
  "M 60,14.7 L 63.9,14.4 L 68.3,17.8 L 72.2,22.8 L 74.4,19.4 L 80.3,21.9 L 83.6,18.9 L 88.9,15.3 L 89.4,12.5 L 94.4,8.3 L 97.2,6.9 L 88.9,4.7 L 77.8,5 L 66.7,6.1 L 61.1,8.9 L 61.1,13.1 Z",
  // Australia
  "M 81.9,33.9 L 86.1,28.3 L 90.3,28.1 L 92.5,32.5 L 91.9,34.4 L 90.3,35.6 L 88.3,34.7 L 86.7,33.9 Z",
];

/* ─── Region definitions ────────────────────────────────────── */
interface Region {
  key:     string;
  label:   string;
  centLat: number;
  centLon: number;
  match:   (lat: number, lon: number) => boolean;
}

const REGIONS: Region[] = [
  { key: "AMERICAS",  label: "Americas",   centLat: 40,  centLon: -100, match: (_l, lo) => lo < -30 },
  { key: "EUROPE",    label: "Europe",     centLat: 50,  centLon:   15, match: (la, lo) => lo >= -25 && lo < 45 && la >= 35 },
  { key: "M.EAST",    label: "Mid. East",  centLat: 27,  centLon:   45, match: (la, lo) => lo >= 25 && lo < 65 && la >= 12 && la < 42 },
  { key: "APAC",      label: "APAC",       centLat: 25,  centLon:  110, match: (la, lo) => lo >= 60 || (lo >= 45 && la < 35) },
  { key: "AFRICA",    label: "Africa",     centLat:  1,  centLon:   18, match: (la, lo) => lo >= -20 && lo < 55 && la < 35 },
];

function classifyAlert(a: Alert): string {
  if (!a.geo_bbox) return "";
  const lat = (a.geo_bbox.lat_min + a.geo_bbox.lat_max) / 2;
  const lon = (a.geo_bbox.lon_min + a.geo_bbox.lon_max) / 2;
  return REGIONS.find((r) => r.match(lat, lon))?.key ?? "";
}

const expLevel = (n: number): [string, string] =>
  n > 4 ? ["HIGH",   "#ff4444"] :
  n > 2 ? ["ELEV",   "#ff8c42"] :
  n > 0 ? ["MOD",    "#e6c340"] :
           ["STABLE", "#444444"];

/* ─── Component ─────────────────────────────────────────────── */
interface Props { alerts: Alert[]; compact?: boolean; }

export default function WorldMap({ alerts, compact }: Props) {
  const geoAlerts = useMemo(() => alerts.filter((a) => a.geo_bbox), [alerts]);

  /* Per-region summary */
  const regionData = useMemo(() => {
    return REGIONS.map((r) => {
      const ra = geoAlerts.filter((a) => classifyAlert(a) === r.key);
      return {
        ...r,
        total:    ra.length,
        critical: ra.filter((a) => a.severity === "critical").length,
        high:     ra.filter((a) => a.severity === "high").length,
        medium:   ra.filter((a) => a.severity === "medium").length,
        low:      ra.filter((a) => a.severity === "low").length,
        score:    ra.length ? ra.reduce((s, a) => s + a.score, 0) / ra.length : 0,
      };
    });
  }, [geoAlerts]);

  const maxCount = Math.max(1, ...regionData.map((r) => r.total));

  /* ── Compact: small map only (used in detail panel) ── */
  if (compact) {
    return (
      <div style={{ height: "100%", background: "var(--bg2)", position: "relative", overflow: "hidden" }}>
        <svg viewBox="0 0 100 50" style={{ width: "100%", height: "100%", display: "block" }}>
          {CONTINENTS.map((d, i) => (
            <path key={i} d={d} fill="#1e1e1e" stroke="#2e2e2e" strokeWidth="0.3" />
          ))}
          {geoAlerts.map((alert) => {
            if (!alert.geo_bbox) return null;
            const lat = (alert.geo_bbox.lat_min + alert.geo_bbox.lat_max) / 2;
            const lon = (alert.geo_bbox.lon_min + alert.geo_bbox.lon_max) / 2;
            const [x, y] = project(lat, lon);
            const r = alert.score * 1.4 + 0.5;
            const color = SEV_COLOR[alert.severity] ?? "#444";
            return (
              <g key={alert.id}>
                <circle cx={x} cy={y} r={r * 2.5} fill={color} opacity={0.08} />
                <circle cx={x} cy={y} r={r}       fill={color} opacity={0.85}>
                  <title>{alert.title}</title>
                </circle>
              </g>
            );
          })}
        </svg>
        {geoAlerts.length === 0 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "var(--txt3)", letterSpacing: 2 }}>
            NO GEOTAGGED
          </div>
        )}
      </div>
    );
  }

  /* ── Full view: region table + world map ── */
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--bg)", fontFamily: "'JetBrains Mono', monospace" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 16px", background: "var(--bg2)", borderBottom: "1px solid var(--bdr)", flexShrink: 0 }}>
        <span style={{ fontSize: 9, letterSpacing: 2, color: "var(--txt3)" }}>GLOBAL ALERT DISTRIBUTION</span>
        <span style={{ fontSize: 9, color: "var(--txt3)", letterSpacing: 1 }}>{geoAlerts.length} GEOTAGGED · {alerts.length} TOTAL</span>
      </div>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "280px 1fr", overflow: "hidden" }}>

        {/* ── Left: Region exposure table ── */}
        <div style={{ borderRight: "1px solid var(--bdr)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "7px 16px", background: "var(--bg2)", borderBottom: "1px solid var(--bdr)", fontSize: 9, letterSpacing: 2, color: "var(--txt3)" }}>
            REGIONAL EXPOSURE
          </div>

          {regionData.map((r) => {
            const [lvl, col] = expLevel(r.total);
            const barW = maxCount > 0 ? (r.total / maxCount) * 100 : 0;
            return (
              <div key={r.key} style={{ padding: "12px 16px", borderBottom: "1px solid var(--bdr)" }}>
                {/* Region name + status */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--txt)", letterSpacing: 0.5 }}>{r.label.toUpperCase()}</span>
                  <span style={{ fontSize: 9, letterSpacing: 1, color: col, fontWeight: 700 }}>{lvl}</span>
                </div>

                {/* Count bar */}
                <div style={{ height: 2, background: "var(--bdr)", marginBottom: 8, position: "relative" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${barW}%`, background: col, transition: "width 0.4s ease" }} />
                </div>

                {/* Severity breakdown */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4 }}>
                  {[
                    { label: "CRIT", count: r.critical, color: "#ff4444" },
                    { label: "HIGH", count: r.high,     color: "#ff8c42" },
                    { label: "MED",  count: r.medium,   color: "#e6c340" },
                    { label: "LOW",  count: r.low,      color: "#00e676" },
                  ].map((s) => (
                    <div key={s.label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: s.count > 0 ? s.color : "var(--txt3)", letterSpacing: -0.5, lineHeight: 1 }}>
                        {s.count}
                      </div>
                      <div style={{ fontSize: 8, color: "var(--txt3)", letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Severity legend */}
          <div style={{ marginTop: "auto", padding: "10px 16px", borderTop: "1px solid var(--bdr)", display: "flex", gap: 12 }}>
            {Object.entries(SEV_COLOR).map(([sev, col]) => (
              <span key={sev} style={{ fontSize: 9, color: "var(--txt3)", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 4, textTransform: "uppercase" }}>
                <span style={{ width: 5, height: 5, background: col, display: "inline-block", flexShrink: 0 }} />
                {sev}
              </span>
            ))}
          </div>
        </div>

        {/* ── Right: SVG world map ── */}
        <div style={{ position: "relative", overflow: "hidden", background: "var(--bg)" }}>
          <svg
            viewBox="0 0 100 50"
            preserveAspectRatio="xMidYMid meet"
            style={{ width: "100%", height: "100%", display: "block" }}
          >
            {/* Grid lines */}
            {[-60,-30,0,30,60].map((lat) => {
              const y = ((90 - lat) / 180) * 50;
              return <line key={lat} x1="0" y1={y} x2="100" y2={y} stroke="#1a1a1a" strokeWidth="0.2" />;
            })}
            {[-120,-60,0,60,120].map((lon) => {
              const x = ((lon + 180) / 360) * 100;
              return <line key={lon} x1={x} y1="0" x2={x} y2="50" stroke="#1a1a1a" strokeWidth="0.2" />;
            })}
            {/* Equator */}
            <line x1="0" y1="25" x2="100" y2="25" stroke="#222" strokeWidth="0.3" />

            {/* Continent fills */}
            {CONTINENTS.map((d, i) => (
              <path key={i} d={d} fill="#1c1c1c" stroke="#2a2a2a" strokeWidth="0.25" />
            ))}

            {/* Region centroid labels */}
            {REGIONS.map((r) => {
              const [cx, cy] = project(r.centLat, r.centLon);
              const rd = regionData.find((x) => x.key === r.key);
              return (
                <g key={r.key}>
                  <text x={cx} y={cy} textAnchor="middle" fontSize="1.8"
                    fill={rd && rd.total > 0 ? "#555" : "#333"}
                    fontFamily="'JetBrains Mono', monospace" letterSpacing="0.5">
                    {r.key}
                  </text>
                </g>
              );
            })}

            {/* Alert pins */}
            {geoAlerts.map((alert) => {
              if (!alert.geo_bbox) return null;
              const lat = (alert.geo_bbox.lat_min + alert.geo_bbox.lat_max) / 2;
              const lon = (alert.geo_bbox.lon_min + alert.geo_bbox.lon_max) / 2;
              const [x, y] = project(lat, lon);
              const r = alert.score * 1.6 + 0.5;
              const color = SEV_COLOR[alert.severity] ?? "#444";
              return (
                <g key={alert.id}>
                  {/* Outer glow */}
                  <circle cx={x} cy={y} r={r * 4} fill={color} opacity={0.04} />
                  {/* Mid ring */}
                  <circle cx={x} cy={y} r={r * 2} fill={color} opacity={0.12} />
                  {/* Core dot */}
                  <circle cx={x} cy={y} r={r} fill={color} opacity={0.9}>
                    <title>{alert.title} ({alert.severity.toUpperCase()} · {alert.score.toFixed(2)})</title>
                  </circle>
                </g>
              );
            })}

            {/* Map border */}
            <rect x="0" y="0" width="100" height="50" fill="none" stroke="#222" strokeWidth="0.3" />
          </svg>

          {/* Lat/lon labels */}
          {geoAlerts.length === 0 && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "var(--txt3)", letterSpacing: 2, pointerEvents: "none" }}>
              NO GEOTAGGED ALERTS — MONITORING...
            </div>
          )}

          {/* Bottom scale */}
          <div style={{ position: "absolute", bottom: 6, right: 10, fontSize: 8, color: "var(--txt3)", letterSpacing: 1 }}>
            EQUIRECTANGULAR · WGS84
          </div>
        </div>
      </div>
    </div>
  );
}
